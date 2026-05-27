import { AuthorityCategory, PublicRecordCategory, SourceKind } from "@prisma/client";
import type { ConnectorContext, WatchdogConnector } from "@/lib/watchdog/connectors/base";
import type { NormalizedRecordDraft } from "@/lib/watchdog/records";
import { sanitizeRecordText } from "@/lib/watchdog/records";
import { fetchText } from "@/lib/watchdog/connectors/http";

const CONNECTOR_KEY = "property";

const AGENCY_CONTACT_PAGES = [
  { authoritySlug: "polismyndigheten", authorityName: "Polismyndigheten", sourceUrl: "https://polisen.se/om-polisen/kontakt/" },
  { authoritySlug: "riksdagen", authorityName: "Sveriges riksdag", sourceUrl: "https://www.riksdagen.se/sv/kontakt/" },
  { authoritySlug: "regeringskansliet", authorityName: "Regeringskansliet", sourceUrl: "https://www.regeringen.se/regeringskansliet/kontakt/" },
  { authoritySlug: "skatteverket", authorityName: "Skatteverket", sourceUrl: "https://www.skatteverket.se/omoss/kontakt.html" },
  { authoritySlug: "msb", authorityName: "Myndigheten för samhällsskydd och beredskap", sourceUrl: "https://www.msb.se/sv/om-msb/kontakta-msb/" },
  { authoritySlug: "forsakringskassan", authorityName: "Försäkringskassan", sourceUrl: "https://www.forsakringskassan.se/om-forsakringskassan/kontakta-oss" },
];

function extractBusinessAddresses(html: string) {
  const addresses = new Set<string>();
  const patterns = [
    /\b([A-ZÅÄÖ][a-zåäö]+(?:gatan|vägen|stigen|torget|plan)\s+\d+[A-Za-z]?,\s*\d{3}\s?\d{2}\s+[A-ZÅÄÖ][a-zåäö]+)\b/g,
    /\b(\d{3}\s?\d{2}\s+[A-ZÅÄÖ][a-zåäö]+(?:\s+[A-ZÅÄÖ][a-zåäö]+)?)\b/g,
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const address = match[1]?.trim();
      if (address && address.length > 8) addresses.add(address);
    }
  }

  return [...addresses].slice(0, 3);
}

export const propertyConnector: WatchdogConnector = {
  key: CONNECTOR_KEY,
  label: "Fastigheter (verksamhet)",
  async run(context: ConnectorContext) {
    const drafts: NormalizedRecordDraft[] = [];

    for (const agency of AGENCY_CONTACT_PAGES) {
      const html = await fetchText(agency.sourceUrl);
      if (!html) continue;

      await context.prisma.authority.upsert({
        where: { slug: agency.authoritySlug },
        update: { name: agency.authorityName },
        create: {
          name: agency.authorityName,
          slug: agency.authoritySlug,
          level: "Myndighet",
          region: "Nationell",
          category: AuthorityCategory.AGENCY,
          summary: `${agency.authorityName} — verksamhetsadresser från offentliga källor.`,
        },
      });

      const addresses = extractBusinessAddresses(html);
      for (const [index, address] of addresses.entries()) {
        drafts.push({
          connectorKey: CONNECTOR_KEY,
          category: PublicRecordCategory.PROPERTY,
          title: `${agency.authorityName} — verksamhetsadress`,
          summary: sanitizeRecordText(
            `Verksamhetsadress för ${agency.authorityName}: ${address}. Privata bostadsadresser maskeras.`,
          ),
          sourceKind: SourceKind.PUBLIC_REGISTRY,
          sourceUrl: agency.sourceUrl,
          sourceRecordId: `${agency.authoritySlug}-address-${index}`,
          legalBasis: "Offentlig verksamhetsadress",
          payload: { address, kind: "verksamhetsadress", authorityName: agency.authorityName },
          authorityId: undefined,
        });
      }
    }

    return drafts;
  },
};
