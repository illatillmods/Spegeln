import { AuthorityCategory, PublicRecordCategory, SourceKind } from "@prisma/client";
import type { ConnectorContext, WatchdogConnector } from "@/lib/watchdog/connectors/base";
import type { NormalizedRecordDraft } from "@/lib/watchdog/records";
import { sanitizeRecordText } from "@/lib/watchdog/records";
import { fetchJson, fetchText, paginateJson } from "@/lib/watchdog/connectors/http";

const CONNECTOR_KEY = "domstol";

type CourtNewsItem = {
  id: string;
  court: string;
  courtSlug: string;
  title: string;
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

function extractMentionedNames(text: string) {
  const matches = text.match(/\b([A-ZÅÄÖ][a-zåäö]+ [A-ZÅÄÖ][a-zåäö]+)\b/g) || [];
  return [...new Set(matches)].slice(0, 5);
}

async function fetchCourtNews(): Promise<CourtNewsItem[]> {
  const apiItems = await paginateJson<CourtNewsItem>(
    (page) => `https://www.domstol.se/api/news?language=sv&count=20&page=${page}`,
    (payload) => {
      const data = payload as {
        items?: Array<{ id?: string; title?: string; preamble?: string; url?: string; date?: string; court?: string }>;
      };
      return (data.items || [])
        .filter((item) => item.title)
        .map((item, index) => ({
          id: item.id || `domstol-api-${index}`,
          court: item.court || "Sveriges Domstolar",
          courtSlug: slugify(item.court || "sveriges-domstolar"),
          title: item.title as string,
          summary: item.preamble || item.title || "",
          date: item.date || new Date().toISOString().slice(0, 10),
          sourceUrl: item.url || "https://www.domstol.se/",
        }));
    },
    { maxPages: 3 },
  );

  if (apiItems.length > 0) return apiItems;

  const html = await fetchText("https://www.domstol.se/nyheter-och-press/nyheter-fran-sveriges-domstolar/");
  if (!html) return [];

  const items: CourtNewsItem[] = [];
  const pattern = /href="([^"]+)"[^>]*class="[^"]*news[^"]*"[^>]*>[\s\S]*?<h\d[^>]*>([^<]+)<\/h\d>/gi;
  let index = 0;
  for (const match of html.matchAll(pattern)) {
    const href = match[1].startsWith("http") ? match[1] : `https://www.domstol.se${match[1]}`;
    items.push({
      id: `domstol-html-${index}`,
      court: "Sveriges Domstolar",
      courtSlug: "sveriges-domstolar",
      title: match[2].trim(),
      summary: match[2].trim(),
      date: new Date().toISOString().slice(0, 10),
      sourceUrl: href,
    });
    index += 1;
    if (index >= 15) break;
  }

  return items;
}

export const domstolConnector: WatchdogConnector = {
  key: CONNECTOR_KEY,
  label: "Domstolar",
  async run(context: ConnectorContext) {
    const drafts: NormalizedRecordDraft[] = [];
    const decisions = await fetchCourtNews();

    for (const decision of decisions) {
      await context.prisma.authority.upsert({
        where: { slug: decision.courtSlug },
        update: { name: decision.court },
        create: {
          name: decision.court,
          slug: decision.courtSlug,
          level: "Domstol",
          region: "Nationell",
          category: AuthorityCategory.COURT,
          summary: `${decision.court} — publicerade domar och nyheter.`,
        },
      });

      const mentionedNames = extractMentionedNames(`${decision.title} ${decision.summary}`);

      drafts.push({
        connectorKey: CONNECTOR_KEY,
        category: PublicRecordCategory.COURT,
        title: decision.title,
        summary: sanitizeRecordText(decision.summary),
        occurredAt: new Date(decision.date),
        sourceKind: SourceKind.COURT_RECORD,
        sourceUrl: decision.sourceUrl,
        sourceRecordId: decision.id,
        legalBasis: "Publicerade domstolsnyheter och avgöranden",
        payload: { court: decision.court, mentionedNames, rawText: decision.summary },
      });

      for (const name of mentionedNames) {
        drafts.push({
          connectorKey: CONNECTOR_KEY,
          category: PublicRecordCategory.COURT,
          title: `${name} — omnämnd i ${decision.court}`,
          summary: sanitizeRecordText(`${name} omnämns i publicerat avgörande: ${decision.title}.`),
          occurredAt: new Date(decision.date),
          sourceKind: SourceKind.COURT_RECORD,
          sourceUrl: decision.sourceUrl,
          sourceRecordId: `${decision.id}-${slugify(name)}`,
          legalBasis: "Publicerad domstolshandling",
          officialHint: {
            fullName: name,
            title: "Domstolsomnämnande",
            authoritySlug: decision.courtSlug,
            authorityName: decision.court,
          },
        });
      }
    }

    return drafts;
  },
};
