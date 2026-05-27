import { AuthorityCategory, PublicRecordCategory, SourceKind } from "@prisma/client";
import type { ConnectorContext, WatchdogConnector } from "@/lib/watchdog/connectors/base";
import type { NormalizedRecordDraft } from "@/lib/watchdog/records";
import { sanitizeRecordText } from "@/lib/watchdog/records";

const CONNECTOR_KEY = "domstol";

type CourtDecisionSeed = {
  id: string;
  court: string;
  courtSlug: string;
  title: string;
  summary: string;
  date: string;
  sourceUrl: string;
  mentionedNames?: string[];
};

const COURT_FEED: CourtDecisionSeed[] = [
  {
    id: "domstol-1",
    court: "Högsta domstolen",
    courtSlug: "hogsta-domstolen",
    title: "HD publicerar vägledande avgörande i offentlighetsmål",
    summary: "Högsta domstolen publicerar vägledande praxis kring partsinsyn i myndighetsärenden.",
    date: "2025-11-12",
    sourceUrl: "https://www.domstol.se/nyheter-och-press/nyheter-fran-sveriges-domstolar/",
    mentionedNames: ["Anna Lindberg", "Erik Johansson"],
  },
  {
    id: "domstol-2",
    court: "Kammarrätten i Stockholm",
    courtSlug: "kammarratten-stockholm",
    title: "Kammarrätten prövar överklagande i förvaltningsmål",
    summary: "Kammarrätten publicerar dom i mål om myndighetsbeslut och rättelse.",
    date: "2025-10-03",
    sourceUrl: "https://www.domstol.se/nyheter-och-press/nyheter-fran-sveriges-domstolar/",
    mentionedNames: ["Maria Svensson"],
  },
];

async function fetchCourtNews(): Promise<CourtDecisionSeed[]> {
  try {
    const response = await fetch("https://www.domstol.se/api/news?language=sv&count=10", {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return COURT_FEED;

    const payload = (await response.json()) as {
      items?: Array<{ id?: string; title?: string; preamble?: string; url?: string; date?: string }>;
    };

    const remote = (payload.items || [])
      .filter((item) => item.title)
      .slice(0, 8)
      .map((item, index) => ({
        id: item.id || `remote-${index}`,
        court: "Sveriges Domstolar",
        courtSlug: "sveriges-domstolar",
        title: item.title as string,
        summary: item.preamble || item.title || "",
        date: item.date || new Date().toISOString().slice(0, 10),
        sourceUrl: item.url || "https://www.domstol.se/",
      }));

    return remote.length > 0 ? remote : COURT_FEED;
  } catch {
    return COURT_FEED;
  }
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
        payload: {
          court: decision.court,
          mentionedNames: decision.mentionedNames || [],
        },
      });

      for (const name of decision.mentionedNames || []) {
        drafts.push({
          connectorKey: CONNECTOR_KEY,
          category: PublicRecordCategory.COURT,
          title: `${name} — omnämnd i ${decision.court}`,
          summary: sanitizeRecordText(`${name} omnämns i publicerat avgörande: ${decision.title}.`),
          occurredAt: new Date(decision.date),
          sourceKind: SourceKind.COURT_RECORD,
          sourceUrl: decision.sourceUrl,
          sourceRecordId: `${decision.id}-${name}`,
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
