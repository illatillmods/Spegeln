import { AuthorityCategory, PublicRecordCategory, SourceKind } from "@prisma/client";
import type { ConnectorContext, WatchdogConnector } from "@/lib/watchdog/connectors/base";
import type { NormalizedRecordDraft } from "@/lib/watchdog/records";
import { sanitizeRecordText } from "@/lib/watchdog/records";
import { fetchText } from "@/lib/watchdog/connectors/http";

const CONNECTOR_KEY = "polis-open";

const POLICE_FEEDS = [
  { region: "Nationell", url: "https://polisen.se/om-polisen/pressrum/pressmeddelanden/" },
  { region: "Stockholm", url: "https://polisen.se/om-polisen/polisomraden/stockholms-lan/aktuellt/pressmeddelanden/" },
  { region: "Skåne", url: "https://polisen.se/om-polisen/polisomraden/skane/aktuellt/pressmeddelanden/" },
  { region: "Västra Götaland", url: "https://polisen.se/om-polisen/polisomraden/vastra-gotaland/aktuellt/pressmeddelanden/" },
];

type PoliceRelease = {
  id: string;
  title: string;
  summary: string;
  date: string;
  region: string;
  sourceUrl: string;
};

async function fetchFeed(url: string, region: string): Promise<PoliceRelease[]> {
  const html = await fetchText(url);
  if (!html) return [];

  const releases: PoliceRelease[] = [];
  const pattern = /href="(\/[^"]*press[^"]*)"[^>]*>([^<]+)</gi;
  let index = 0;

  for (const match of html.matchAll(pattern)) {
    const path = match[1];
    const title = match[2]?.trim();
    if (!title || title.length < 8) continue;
    if (title.toLowerCase().includes("pressmeddel")) continue;

    releases.push({
      id: `${region}-${index}-${path}`,
      title,
      summary: `Polismyndighetens pressmeddelande (${region}): ${title}`,
      date: new Date().toISOString().slice(0, 10),
      region,
      sourceUrl: path.startsWith("http") ? path : `https://polisen.se${path}`,
    });
    index += 1;
    if (index >= 10) break;
  }

  return releases;
}

export const polisOpenConnector: WatchdogConnector = {
  key: CONNECTOR_KEY,
  label: "Polisen (öppna pressmeddelanden)",
  async run(context: ConnectorContext) {
    const drafts: NormalizedRecordDraft[] = [];
    const seen = new Set<string>();

    await context.prisma.authority.upsert({
      where: { slug: "polismyndigheten" },
      update: { name: "Polismyndigheten" },
      create: {
        name: "Polismyndigheten",
        slug: "polismyndigheten",
        level: "Myndighet",
        region: "Nationell",
        category: AuthorityCategory.POLICE,
        summary: "Polismyndigheten — offentliga pressmeddelanden och tillsynsbeslut.",
      },
    });

    for (const feed of POLICE_FEEDS) {
      const releases = await fetchFeed(feed.url, feed.region);
      for (const release of releases) {
        if (seen.has(release.sourceUrl)) continue;
        seen.add(release.sourceUrl);

        drafts.push({
          connectorKey: CONNECTOR_KEY,
          category: PublicRecordCategory.OTHER,
          title: release.title,
          summary: sanitizeRecordText(release.summary),
          occurredAt: new Date(release.date),
          sourceKind: SourceKind.PUBLIC_REGISTRY,
          sourceUrl: release.sourceUrl,
          sourceRecordId: release.id,
          legalBasis: "Polismyndighetens offentliga pressmeddelanden",
          payload: { region: release.region, kind: "police_press_release", rawText: release.summary },
          authorityId: undefined,
        });
      }
    }

    return drafts;
  },
};
