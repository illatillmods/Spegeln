import { AuthorityCategory, OfficialCategory, PublicRecordCategory, SourceKind } from "@prisma/client";
import type { ConnectorContext, WatchdogConnector } from "@/lib/watchdog/connectors/base";
import type { NormalizedRecordDraft } from "@/lib/watchdog/records";
import { sanitizeRecordText } from "@/lib/watchdog/records";

const CONNECTOR_KEY = "regering";

type GovernmentMember = {
  id: string;
  name: string;
  title: string;
  department: string;
  departmentSlug: string;
  profileUrl?: string;
};

const GOVERNMENT_ROSTER: GovernmentMember[] = [
  {
    id: "pm",
    name: "Ulf Kristersson",
    title: "Statsminister",
    department: "Statsrådsberedningen",
    departmentSlug: "statsradsberedningen",
    profileUrl: "https://www.regeringen.se/regeringskansliet/statsrad/ulf-kristersson/",
  },
  {
    id: "finans",
    name: "Elisabeth Svantesson",
    title: "Finansminister",
    department: "Finansdepartementet",
    departmentSlug: "finansdepartementet",
    profileUrl: "https://www.regeringen.se/regeringskansliet/statsrad/elisabeth-svantesson/",
  },
  {
    id: "utrikes",
    name: "Tobias Billström",
    title: "Utrikesminister",
    department: "Utrikesdepartementet",
    departmentSlug: "utrikesdepartementet",
    profileUrl: "https://www.regeringen.se/regeringskansliet/statsrad/tobias-billstrom/",
  },
  {
    id: "justitie",
    name: "Gunnar Strömmer",
    title: "Justitieminister",
    department: "Justitiedepartementet",
    departmentSlug: "justitiedepartementet",
    profileUrl: "https://www.regeringen.se/regeringskansliet/statsrad/gunnar-strommer/",
  },
];

async function fetchPressReleases(): Promise<Array<{ title: string; summary: string; url: string; date?: string }>> {
  try {
    const response = await fetch("https://www.regeringen.se/pressmeddelanden/?format=json", {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as {
      items?: Array<{ title?: string; preamble?: string; url?: string; published?: string }>;
    };
    return (payload.items || [])
      .filter((item) => item.title && item.url)
      .slice(0, 20)
      .map((item) => ({
        title: item.title as string,
        summary: item.preamble || item.title || "",
        url: item.url as string,
        date: item.published,
      }));
  } catch {
    return [];
  }
}

export const regeringConnector: WatchdogConnector = {
  key: CONNECTOR_KEY,
  label: "Regeringen",
  async run(context: ConnectorContext) {
    const drafts: NormalizedRecordDraft[] = [];
    const pressReleases = await fetchPressReleases();

    for (const member of GOVERNMENT_ROSTER) {
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
        payload: {
          department: member.department,
          title: member.title,
        },
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
        payload: { kind: "press_release" },
      });
    }

    return drafts;
  },
};
