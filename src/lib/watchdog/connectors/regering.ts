import { AuthorityCategory, OfficialCategory, PublicRecordCategory, SourceKind } from "@prisma/client";
import type { ConnectorContext, WatchdogConnector } from "@/lib/watchdog/connectors/base";
import type { NormalizedRecordDraft } from "@/lib/watchdog/records";
import { sanitizeRecordText } from "@/lib/watchdog/records";
import { fetchJson, fetchText } from "@/lib/watchdog/connectors/http";

const CONNECTOR_KEY = "regering";

type GovernmentMember = {
  id: string;
  name: string;
  title: string;
  department: string;
  departmentSlug: string;
  profileUrl: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function fetchGovernmentMembers(): Promise<GovernmentMember[]> {
  const html = await fetchText("https://www.regeringen.se/regeringskansliet/statsrad/");
  if (!html) return [];

  const members: GovernmentMember[] = [];
  const linkPattern =
    /href="(\/regeringskansliet\/statsrad\/[^"]+)"[^>]*>[\s\S]*?<h2[^>]*>([^<]+)<\/h2>[\s\S]*?<p[^>]*>([^<]+)<\/p>/gi;

  for (const match of html.matchAll(linkPattern)) {
    const profilePath = match[1];
    const name = match[2]?.trim();
    const title = match[3]?.trim();
    if (!name || !title) continue;

    const profileUrl = `https://www.regeringen.se${profilePath}`;
    const id = slugify(name);
    const departmentMatch = title.match(/(?:minister|statsråd).*?(?:departement|beredning)/i);
    const department = departmentMatch ? title : title.split("—")[0]?.trim() || "Regeringskansliet";
    const departmentSlug = slugify(department) || "regeringskansliet";

    members.push({ id, name, title, department, departmentSlug, profileUrl });
  }

  if (members.length > 0) return members;

  const fallbackHtml = await fetchText("https://www.regeringen.se/sok/?q=statsrad");
  if (!fallbackHtml) return [];

  const altPattern = /href="(https:\/\/www\.regeringen\.se\/regeringskansliet\/statsrad\/[^"]+)"/g;
  let index = 0;
  for (const match of fallbackHtml.matchAll(altPattern)) {
    const profileUrl = match[1];
    const id = slugify(profileUrl.split("/").pop() || `member-${index}`);
    members.push({
      id,
      name: id.replace(/-/g, " "),
      title: "Statsråd",
      department: "Regeringskansliet",
      departmentSlug: "regeringskansliet",
      profileUrl,
    });
    index += 1;
    if (index >= 24) break;
  }

  return members;
}

async function fetchPressReleases() {
  const payload = await fetchJson<{
    items?: Array<{ title?: string; preamble?: string; url?: string; published?: string }>;
  }>("https://www.regeringen.se/pressmeddelanden/?format=json");

  return (payload?.items || [])
    .filter((item) => item.title && item.url)
    .slice(0, 30)
    .map((item) => ({
      title: item.title as string,
      summary: item.preamble || item.title || "",
      url: item.url as string,
      date: item.published,
    }));
}

export const regeringConnector: WatchdogConnector = {
  key: CONNECTOR_KEY,
  label: "Regeringen",
  async run(context: ConnectorContext) {
    const drafts: NormalizedRecordDraft[] = [];
    const [members, pressReleases] = await Promise.all([fetchGovernmentMembers(), fetchPressReleases()]);

    for (const member of members) {
      await context.prisma.authority.upsert({
        where: { slug: member.departmentSlug },
        update: { name: member.department },
        create: {
          name: member.department,
          slug: member.departmentSlug,
          level: "Departement",
          region: "Nationell",
          category: AuthorityCategory.MINISTRY,
          summary: `${member.department} — regeringens departement.`,
        },
      });

      drafts.push({
        connectorKey: CONNECTOR_KEY,
        category: PublicRecordCategory.ROLE,
        title: `${member.name} — ${member.title}`,
        summary: sanitizeRecordText(`${member.name} innehar rollen ${member.title} vid ${member.department}.`),
        sourceKind: SourceKind.PUBLIC_REGISTRY,
        sourceUrl: member.profileUrl,
        sourceRecordId: member.id,
        legalBasis: "Regeringens offentliga statsrådslista",
        payload: { department: member.department, title: member.title },
        identity: {
          sourceKey: "regering:statsrad",
          externalId: member.id,
          profileUrl: member.profileUrl,
        },
        officialHint: {
          fullName: member.name,
          title: member.title,
          authoritySlug: member.departmentSlug,
          authorityName: member.department,
          category: OfficialCategory.MINISTER,
        },
      });
    }

    for (const release of pressReleases) {
      drafts.push({
        connectorKey: CONNECTOR_KEY,
        category: PublicRecordCategory.OTHER,
        title: release.title,
        summary: sanitizeRecordText(release.summary),
        occurredAt: release.date ? new Date(release.date) : undefined,
        sourceKind: SourceKind.PUBLIC_REGISTRY,
        sourceUrl: release.url,
        sourceRecordId: release.url,
        legalBasis: "Regeringens pressmeddelanden",
        payload: { kind: "press_release", rawText: release.summary },
      });
    }

    return drafts;
  },
};
