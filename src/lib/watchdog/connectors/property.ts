import { AuthorityCategory, PublicRecordCategory, SourceKind } from "@prisma/client";
import type { ConnectorContext, WatchdogConnector } from "@/lib/watchdog/connectors/base";
import type { NormalizedRecordDraft } from "@/lib/watchdog/records";
import { sanitizeRecordText } from "@/lib/watchdog/records";

const CONNECTOR_KEY = "property";

type PropertySeed = {
  id: string;
  ownerName: string;
  ownerTitle: string;
  authoritySlug: string;
  authorityName: string;
  address: string;
  kind: string;
  sourceUrl: string;
};

const PROPERTY_FEED: PropertySeed[] = [
  {
    id: "prop-1",
    ownerName: "Anna Svensson",
    ownerTitle: "Generaldirektör",
    authoritySlug: "polismyndigheten",
    authorityName: "Polismyndigheten",
    address: "Polisens huvudkontor, Kungsholmen (verksamhetsadress)",
    kind: "Verksamhetslokal",
    sourceUrl: "https://polisen.se/om-polisen/kontakt/",
  },
  {
    id: "prop-2",
    ownerName: "Erik Johansson",
    ownerTitle: "Riksdagsledamot",
    authoritySlug: "riksdagen",
    authorityName: "Sveriges riksdag",
    address: "Riksdagshuset, Stockholm (verksamhetsadress)",
    kind: "Verksamhetslokal",
    sourceUrl: "https://www.riksdagen.se/",
  },
];

export const propertyConnector: WatchdogConnector = {
  key: CONNECTOR_KEY,
  label: "Fastigheter (verksamhet)",
  async run(context: ConnectorContext) {
    const drafts: NormalizedRecordDraft[] = [];

    for (const item of PROPERTY_FEED) {
      await context.prisma.authority.upsert({
        where: { slug: item.authoritySlug },
        update: { name: item.authorityName },
        create: {
          name: item.authorityName,
          slug: item.authoritySlug,
          level: "Myndighet",
          region: "Nationell",
          category: AuthorityCategory.AGENCY,
          summary: `${item.authorityName} — verksamhetsadresser från offentliga källor.`,
        },
      });

      drafts.push({
        connectorKey: CONNECTOR_KEY,
        category: PublicRecordCategory.PROPERTY,
        title: `${item.ownerName} — ${item.kind}`,
        summary: sanitizeRecordText(
          `Verksamhetsadress kopplad till ${item.ownerTitle} (${item.authorityName}): ${item.address}. Privata bostadsadresser maskeras.`,
        ),
        sourceKind: SourceKind.PUBLIC_REGISTRY,
        sourceUrl: item.sourceUrl,
        sourceRecordId: item.id,
        legalBasis: "Offentlig verksamhetsadress / transparensregister",
        payload: {
          address: item.address,
          kind: item.kind,
        },
        officialHint: {
          fullName: item.ownerName,
          title: item.ownerTitle,
          authoritySlug: item.authoritySlug,
          authorityName: item.authorityName,
        },
      });
    }

    return drafts;
  },
};
