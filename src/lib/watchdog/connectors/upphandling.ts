import { AuthorityCategory, PublicRecordCategory, SourceKind } from "@prisma/client";
import type { ConnectorContext, WatchdogConnector } from "@/lib/watchdog/connectors/base";
import type { NormalizedRecordDraft } from "@/lib/watchdog/records";
import { sanitizeRecordText } from "@/lib/watchdog/records";
import { fetchText } from "@/lib/watchdog/connectors/http";

const CONNECTOR_KEY = "upphandling";

type ProcurementItem = {
  id: string;
  title: string;
  buyer: string;
  buyerSlug: string;
  summary: string;
  date: string;
  sourceUrl: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function fetchProcurementFeed(): Promise<ProcurementItem[]> {
  const rss = await fetchText("https://www.upphandlingsmyndigheten.se/rss/nyheter/");
  if (rss) {
    const items: ProcurementItem[] = [];
    const pattern = /<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<description><!\[CDATA\[(.*?)\]\]><\/description>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?<\/item>/gi;
    let index = 0;
    for (const match of rss.matchAll(pattern)) {
      const title = match[1]?.trim();
      const sourceUrl = match[2]?.trim();
      const summary = match[3]?.trim() || title;
      const date = match[4] ? new Date(match[4]).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
      if (!title || !sourceUrl) continue;

      items.push({
        id: `upphandling-rss-${index}`,
        title,
        buyer: "Upphandlingsmyndigheten",
        buyerSlug: "upphandlingsmyndigheten",
        summary,
        date,
        sourceUrl,
      });
      index += 1;
      if (index >= 20) break;
    }
    if (items.length > 0) return items;
  }

  const html = await fetchText("https://www.kammarkollegiet.se/upphandling/aktuella-upphandlingar");
  if (!html) return [];

  const items: ProcurementItem[] = [];
  const pattern = /href="([^"]+)"[^>]*>([^<]{10,120})</g;
  let index = 0;
  for (const match of html.matchAll(pattern)) {
    const href = match[1].startsWith("http") ? match[1] : `https://www.kammarkollegiet.se${match[1]}`;
    const title = match[2].trim();
    if (!title.toLowerCase().includes("upphand") && !title.toLowerCase().includes("avtal")) continue;

    items.push({
      id: `kammarkollegiet-${index}`,
      title,
      buyer: "Kammarkollegiet",
      buyerSlug: "kammarkollegiet",
      summary: title,
      date: new Date().toISOString().slice(0, 10),
      sourceUrl: href,
    });
    index += 1;
    if (index >= 15) break;
  }

  return items;
}

export const upphandlingConnector: WatchdogConnector = {
  key: CONNECTOR_KEY,
  label: "Upphandling",
  async run(context: ConnectorContext) {
    const drafts: NormalizedRecordDraft[] = [];
    const items = await fetchProcurementFeed();

    for (const item of items) {
      await context.prisma.authority.upsert({
        where: { slug: item.buyerSlug },
        update: { name: item.buyer },
        create: {
          name: item.buyer,
          slug: item.buyerSlug,
          level: "Myndighet",
          region: "Nationell",
          category: AuthorityCategory.AGENCY,
          summary: `${item.buyer} — offentlig upphandlande myndighet.`,
        },
      });

      drafts.push({
        connectorKey: CONNECTOR_KEY,
        category: PublicRecordCategory.PROCUREMENT,
        title: item.title,
        summary: sanitizeRecordText(`${item.buyer}: ${item.summary}`),
        occurredAt: new Date(item.date),
        sourceKind: SourceKind.PROCUREMENT,
        sourceUrl: item.sourceUrl,
        sourceRecordId: item.id,
        legalBasis: "Offentlig upphandlingsannons / nyhetsflöde",
        payload: { buyer: item.buyer },
      });
    }

    return drafts;
  },
};
