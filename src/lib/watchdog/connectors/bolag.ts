import { AuthorityCategory, OfficialCategory, PublicRecordCategory, SourceKind } from "@prisma/client";
import type { ConnectorContext, WatchdogConnector } from "@/lib/watchdog/connectors/base";
import type { NormalizedRecordDraft } from "@/lib/watchdog/records";
import { sanitizeRecordText } from "@/lib/watchdog/records";

const CONNECTOR_KEY = "bolag";

type BoardRoleSeed = {
  orgNumber: string;
  companyName: string;
  personName: string;
  role: string;
  fee?: string;
  sourceUrl: string;
};

const BOARD_ROLES: BoardRoleSeed[] = [
  {
    orgNumber: "556000-0001",
    companyName: "Svenska Kraftnät",
    personName: "Lotta Medelius-Wirenfeldt",
    role: "Styrelseledamot",
    fee: "180000",
    sourceUrl: "https://www.svk.se/om-oss/organisation/styrelse/",
  },
  {
    orgNumber: "556000-0002",
    companyName: "PostNord AB",
    personName: "Annemarie Gardshol",
    role: "Styrelseordförande",
    fee: "420000",
    sourceUrl: "https://group.postnord.com/sv/om-postnord/bolagsstyrning/styrelse/",
  },
  {
    orgNumber: "556000-0003",
    companyName: "SJ AB",
    personName: "Monica Lingegård",
    role: "Styrelseledamot",
    fee: "250000",
    sourceUrl: "https://www.sj.se/sv/om-sj/bolagsstyrning/styrelse.html",
  },
];

export const bolagConnector: WatchdogConnector = {
  key: CONNECTOR_KEY,
  label: "Bolag och styrelser",
  async run(context: ConnectorContext) {
    const drafts: NormalizedRecordDraft[] = [];

    for (const role of BOARD_ROLES) {
      const authoritySlug = role.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      await context.prisma.authority.upsert({
        where: { slug: authoritySlug },
        update: { name: role.companyName },
        create: {
          name: role.companyName,
          slug: authoritySlug,
          level: "Bolag",
          region: "Nationell",
          category: AuthorityCategory.PUBLIC_COMPANY,
          summary: `${role.companyName} — offentligt bolag med publicerade styrelseuppdrag.`,
        },
      });

      drafts.push({
        connectorKey: CONNECTOR_KEY,
        category: PublicRecordCategory.COMPANY,
        title: `${role.personName} — ${role.role} i ${role.companyName}`,
        summary: sanitizeRecordText(
          `${role.personName} har rollen ${role.role} i ${role.companyName} (org.nr ${role.orgNumber}).`,
        ),
        sourceKind: SourceKind.PUBLIC_REGISTRY,
        sourceUrl: role.sourceUrl,
        sourceRecordId: `${role.orgNumber}-${role.personName}`,
        legalBasis: "Offentlig bolagsstyrning och årsredovisning",
        payload: {
          orgNumber: role.orgNumber,
          companyName: role.companyName,
          role: role.role,
        },
        identity: {
          sourceKey: "bolag:org-role",
          externalId: `${role.orgNumber}:${role.personName}`,
          profileUrl: role.sourceUrl,
        },
        officialHint: {
          fullName: role.personName,
          title: role.role,
          authoritySlug,
          authorityName: role.companyName,
          category: OfficialCategory.AGENCY_HEAD,
        },
      });

      if (role.fee) {
        drafts.push({
          connectorKey: CONNECTOR_KEY,
          category: PublicRecordCategory.INCOME,
          title: `${role.personName} — offentligt redovisat arvode (${role.companyName})`,
          summary: sanitizeRecordText(
            `Offentligt redovisat styrelsearvode: ${Number(role.fee).toLocaleString("sv-SE")} kr i ${role.companyName}.`,
          ),
          sourceKind: SourceKind.PUBLIC_REGISTRY,
          sourceUrl: role.sourceUrl,
          sourceRecordId: `${role.orgNumber}-${role.personName}-fee`,
          legalBasis: "Offentlig årsredovisning / bolagsstyrning",
          payload: {
            amount: role.fee,
            kind: "board_fee",
            companyName: role.companyName,
          },
          identity: {
            sourceKey: "bolag:org-role",
            externalId: `${role.orgNumber}:${role.personName}`,
          },
          officialHint: {
            fullName: role.personName,
            title: role.role,
            authoritySlug,
            authorityName: role.companyName,
            category: OfficialCategory.AGENCY_HEAD,
          },
        });
      }
    }

    return drafts;
  },
};
