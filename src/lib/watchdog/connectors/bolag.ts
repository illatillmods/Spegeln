import { AuthorityCategory, OfficialCategory, PublicRecordCategory, SourceKind } from "@prisma/client";
import type { ConnectorContext, WatchdogConnector } from "@/lib/watchdog/connectors/base";
import type { NormalizedRecordDraft } from "@/lib/watchdog/records";
import { sanitizeRecordText } from "@/lib/watchdog/records";
import { fetchText } from "@/lib/watchdog/connectors/http";

const CONNECTOR_KEY = "bolag";

type BoardSource = {
  companyName: string;
  orgNumber?: string;
  sourceUrl: string;
};

const BOARD_SOURCES: BoardSource[] = [
  { companyName: "Svenska Kraftnät", orgNumber: "556000-0001", sourceUrl: "https://www.svk.se/om-oss/organisation/styrelse/" },
  { companyName: "PostNord AB", orgNumber: "556000-0002", sourceUrl: "https://group.postnord.com/sv/om-postnord/bolagsstyrning/styrelse/" },
  { companyName: "SJ AB", orgNumber: "556000-0003", sourceUrl: "https://www.sj.se/sv/om-sj/bolagsstyrning/styrelse.html" },
  { companyName: "LKAB", sourceUrl: "https://lkab.com/sv/om-oss/organisation/styrelse/" },
  { companyName: "Vattenfall AB", sourceUrl: "https://group.vattenfall.com/sv/om-oss/organisation/styrelse" },
  { companyName: "Svevia AB", sourceUrl: "https://www.svevia.se/om-svevia/organisation/styrelse/" },
  { companyName: "Teracom AB", sourceUrl: "https://www.teracom.se/om-teracom/organisation/styrelse/" },
  { companyName: "Infranord AB", sourceUrl: "https://www.infranord.se/om-infranord/styrelse/" },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractBoardMembers(html: string) {
  const members: Array<{ name: string; role: string }> = [];
  const patterns = [
    /<h\d[^>]*>([^<]+)<\/h\d>[\s\S]{0,200}?(styrelseledamot|ordförande|ledamot|suppleant)/gi,
    /([A-ZÅÄÖ][a-zåäö]+ [A-ZÅÄÖ][a-zåäö]+(?:-[A-ZÅÄÖ][a-zåäö]+)?)\s*[,–-]\s*(styrelseordförande|styrelseledamot|ledamot|suppleant)/gi,
    /(styrelseordförande|styrelseledamot|ledamot|suppleant)[^<]{0,40}([A-ZÅÄÖ][a-zåäö]+ [A-ZÅÄÖ][a-zåäö]+(?:-[A-ZÅÄÖ][a-zåäö]+)?)/gi,
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const name = (match[1]?.match(/^[A-ZÅÄÖ]/) ? match[1] : match[2])?.trim();
      const role = (match[1]?.match(/styrelse|ledamot|ordförande|suppleant/i) ? match[1] : match[2])?.trim() || "Styrelseledamot";
      if (!name || name.length < 5) continue;
      if (!members.some((entry) => entry.name === name)) {
        members.push({ name, role });
      }
    }
  }

  return members.slice(0, 12);
}

export const bolagConnector: WatchdogConnector = {
  key: CONNECTOR_KEY,
  label: "Bolag och styrelser",
  async run(context: ConnectorContext) {
    const drafts: NormalizedRecordDraft[] = [];

    for (const source of BOARD_SOURCES) {
      const html = await fetchText(source.sourceUrl);
      if (!html) continue;

      const authoritySlug = slugify(source.companyName);
      await context.prisma.authority.upsert({
        where: { slug: authoritySlug },
        update: { name: source.companyName },
        create: {
          name: source.companyName,
          slug: authoritySlug,
          level: "Bolag",
          region: "Nationell",
          category: AuthorityCategory.PUBLIC_COMPANY,
          summary: `${source.companyName} — offentligt bolag med publicerade styrelseuppdrag.`,
        },
      });

      const members = extractBoardMembers(html);
      for (const member of members) {
        drafts.push({
          connectorKey: CONNECTOR_KEY,
          category: PublicRecordCategory.COMPANY,
          title: `${member.name} — ${member.role} i ${source.companyName}`,
          summary: sanitizeRecordText(
            `${member.name} har rollen ${member.role} i ${source.companyName}${source.orgNumber ? ` (org.nr ${source.orgNumber})` : ""}.`,
          ),
          sourceKind: SourceKind.PUBLIC_REGISTRY,
          sourceUrl: source.sourceUrl,
          sourceRecordId: `${authoritySlug}-${slugify(member.name)}`,
          legalBasis: "Offentlig bolagsstyrning",
          payload: {
            orgNumber: source.orgNumber,
            companyName: source.companyName,
            role: member.role,
          },
          identity: {
            sourceKey: "bolag:org-role",
            externalId: `${source.orgNumber || authoritySlug}:${member.name}`,
            profileUrl: source.sourceUrl,
          },
          officialHint: {
            fullName: member.name,
            title: member.role,
            authoritySlug,
            authorityName: source.companyName,
            category: OfficialCategory.AGENCY_HEAD,
          },
        });
      }
    }

    return drafts;
  },
};
