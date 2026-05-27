import { AuthorityCategory, OfficialCategory, PublicRecordCategory, SourceKind } from "@prisma/client";
import type { ConnectorContext, WatchdogConnector } from "@/lib/watchdog/connectors/base";
import type { NormalizedRecordDraft } from "@/lib/watchdog/records";
import { sanitizeRecordText } from "@/lib/watchdog/records";
import { asArray, fetchJson, paginateJson, sleep } from "@/lib/watchdog/connectors/http";

const CONNECTOR_KEY = "riksdag";

type RiksdagPerson = {
  intressent_id?: string;
  fornamn?: string;
  efternamn?: string;
  parti?: string;
  valkrets?: string;
  status?: string;
};

type RiksdagTravelRow = {
  intressent_id?: string;
  fornamn?: string;
  efternamn?: string;
  parti?: string;
  arende?: string;
  datum?: string;
  fran?: string;
  till?: string;
  syfte?: string;
  ersattning?: string;
  traktamente?: string;
  total?: string;
};

type RiksdagAssignment = {
  intressent_id?: string;
  fornamn?: string;
  efternamn?: string;
  parti?: string;
  roll_kod?: string;
  organ_namn?: string;
  typ?: string;
  from?: string;
  tom?: string;
};

type RiksdagInterest = {
  intressent_id?: string;
  fornamn?: string;
  efternamn?: string;
  parti?: string;
  uppgift?: string;
  typ?: string;
};

export type RiksdagConnectorOptions = {
  travelFromYear?: number;
  travelToYear?: number;
};

function getApiBase() {
  return process.env.RIKSDAG_API_BASE?.replace(/\/$/, "") || "https://data.riksdagen.se";
}

function fullName(person: { fornamn?: string; efternamn?: string }) {
  return `${person.fornamn || ""} ${person.efternamn || ""}`.trim();
}

function riksmål(year: number) {
  return `${year - 1}/${String(year % 100).padStart(2, "0")}`;
}

function politicianHint(name: string, party?: string): NormalizedRecordDraft["officialHint"] {
  return {
    fullName: name,
    title: `Riksdagsledamot (${party || "partilös"})`,
    authoritySlug: "riksdagen",
    authorityName: "Sveriges riksdag",
    category: OfficialCategory.POLITICIAN,
  };
}

function identityFor(externalId: string, profileUrl?: string) {
  return {
    sourceKey: "riksdag:int_id",
    externalId,
    profileUrl,
  };
}

async function fetchAllMembers(rateLimitMs: number) {
  return paginateJson<RiksdagPerson>(
    (page) => `${getApiBase()}/personlista/?utformat=json&p=${page}&sz=100&sort=efternamn&sortorder=asc`,
    (payload) => {
      const data = payload as { personlista?: { person?: RiksdagPerson | RiksdagPerson[] } };
      return asArray(data.personlista?.person).filter((person) => person.intressent_id && fullName(person));
    },
    { rateLimitMs },
  );
}

async function fetchTravelForYear(year: number, rateLimitMs: number) {
  const rm = riksmål(year);
  return paginateJson<RiksdagTravelRow>(
    (page) => `${getApiBase()}/reslista/?utformat=json&rm=${rm}&p=${page}&sz=200`,
    (payload) => {
      const data = payload as { reslista?: { resa?: RiksdagTravelRow | RiksdagTravelRow[] } };
      return asArray(data.reslista?.resa).filter((row) => row.intressent_id && row.datum);
    },
    { maxPages: 30, rateLimitMs },
  );
}

async function fetchAssignments(rateLimitMs: number) {
  return paginateJson<RiksdagAssignment>(
    (page) => `${getApiBase()}/uppdrag/?utformat=json&p=${page}&sz=200`,
    (payload) => {
      const data = payload as { uppdrag?: { uppdrag?: RiksdagAssignment | RiksdagAssignment[] } };
      return asArray(data.uppdrag?.uppdrag).filter((row) => row.intressent_id && fullName(row));
    },
    { maxPages: 20, rateLimitMs },
  );
}

async function fetchInterests(rateLimitMs: number) {
  return paginateJson<RiksdagInterest>(
    (page) => `${getApiBase()}/intressent/?utformat=json&p=${page}&sz=200`,
    (payload) => {
      const data = payload as { intressent?: { intressent?: RiksdagInterest | RiksdagInterest[] } };
      return asArray(data.intressent?.intressent).filter((row) => row.intressent_id && fullName(row) && row.uppgift);
    },
    { maxPages: 20, rateLimitMs },
  );
}

export function buildRiksdagDrafts(options?: RiksdagConnectorOptions, rateLimitMs = 300) {
  return {
    async collect(): Promise<NormalizedRecordDraft[]> {
      const drafts: NormalizedRecordDraft[] = [];
      const travelFromYear = options?.travelFromYear ?? Number(process.env.RIKSDAG_TRAVEL_FROM_YEAR || "2018");
      const travelToYear = options?.travelToYear ?? new Date().getFullYear();

      const [members, assignments, interests] = await Promise.all([
        fetchAllMembers(rateLimitMs),
        fetchAssignments(rateLimitMs),
        fetchInterests(rateLimitMs),
      ]);

      for (const person of members) {
        const name = fullName(person);
        const externalId = person.intressent_id as string;
        const profileUrl = `${getApiBase()}/person/${externalId}`;

        drafts.push({
          connectorKey: CONNECTOR_KEY,
          category: PublicRecordCategory.ROLE,
          title: `${name} — riksdagsledamot`,
          summary: sanitizeRecordText(
            `${name} (${person.parti || "partilös"}) representerar ${person.valkrets || "Sverige"} i riksdagen.`,
          ),
          sourceKind: SourceKind.PUBLIC_REGISTRY,
          sourceUrl: profileUrl,
          sourceRecordId: externalId,
          legalBasis: "Riksdagens öppna data om ledamöter",
          payload: { party: person.parti, electoralDistrict: person.valkrets, status: person.status },
          identity: identityFor(externalId, profileUrl),
          officialHint: politicianHint(name, person.parti),
        });
      }

      for (const assignment of assignments) {
        const name = fullName(assignment);
        const externalId = assignment.intressent_id as string;
        drafts.push({
          connectorKey: CONNECTOR_KEY,
          category: PublicRecordCategory.ROLE,
          title: `${name} — ${assignment.roll_kod || assignment.typ || "uppdrag"}`,
          summary: sanitizeRecordText(
            `${name} har uppdrag ${assignment.roll_kod || assignment.typ || ""} i ${assignment.organ_namn || "riksdagen"}.`,
          ),
          occurredAt: assignment.from ? new Date(assignment.from) : undefined,
          sourceKind: SourceKind.PUBLIC_REGISTRY,
          sourceUrl: `${getApiBase()}/uppdrag/`,
          sourceRecordId: `${externalId}-${assignment.organ_namn}-${assignment.roll_kod}`,
          legalBasis: "Riksdagens öppna uppdragsdata",
          payload: {
            organ: assignment.organ_namn,
            role: assignment.roll_kod,
            type: assignment.typ,
          },
          identity: identityFor(externalId),
          officialHint: politicianHint(name, assignment.parti),
        });
      }

      for (const interest of interests) {
        const name = fullName(interest);
        const externalId = interest.intressent_id as string;
        drafts.push({
          connectorKey: CONNECTOR_KEY,
          category: PublicRecordCategory.COMPANY,
          title: `${name} — deklarerat uppdrag/intresse`,
          summary: sanitizeRecordText(`${name}: ${interest.uppgift} (${interest.typ || "intresse"})`),
          sourceKind: SourceKind.PUBLIC_REGISTRY,
          sourceUrl: `${getApiBase()}/intressent/`,
          sourceRecordId: `${externalId}-${interest.uppgift?.slice(0, 40)}`,
          legalBasis: "Riksdagens register över uppdrag och ekonomiska intressen",
          payload: { assignment: interest.uppgift, type: interest.typ },
          identity: identityFor(externalId),
          officialHint: politicianHint(name, interest.parti),
        });
      }

      for (let year = travelFromYear; year <= travelToYear; year += 1) {
        const travelRows = await fetchTravelForYear(year, rateLimitMs);
        for (const trip of travelRows) {
          const name = fullName(trip);
          const amount = trip.total || trip.ersattning || trip.traktamente;
          const externalId = trip.intressent_id as string;

          drafts.push({
            connectorKey: CONNECTOR_KEY,
            category: PublicRecordCategory.TRAVEL,
            title: `${name} — resa ${trip.datum || ""}`.trim(),
            summary: sanitizeRecordText(
              `${name} reste ${trip.fran || "?"} → ${trip.till || "?"} (${trip.syfte || trip.arende || "tjänsteresa"}). Ersättning: ${amount || "okänd"} kr.`,
            ),
            occurredAt: trip.datum ? new Date(trip.datum) : undefined,
            sourceKind: SourceKind.PUBLIC_REGISTRY,
            sourceUrl: `${getApiBase()}/reslista/?rm=${riksmål(year)}`,
            sourceRecordId: `${externalId}-${trip.datum}-${trip.till}-${year}`,
            legalBasis: "Riksdagens reseredovisning (öppna data)",
            payload: { from: trip.fran, to: trip.till, purpose: trip.syfte || trip.arende, amount, year },
            identity: identityFor(externalId),
            officialHint: politicianHint(name, trip.parti),
          });

          if (amount) {
            drafts.push({
              connectorKey: CONNECTOR_KEY,
              category: PublicRecordCategory.INCOME,
              title: `${name} — offentlig reseersättning ${trip.datum || ""}`.trim(),
              summary: sanitizeRecordText(
                `Offentligt redovisad reseersättning/traktamente: ${amount} kr (${riksmål(year)}).`,
              ),
              occurredAt: trip.datum ? new Date(trip.datum) : undefined,
              sourceKind: SourceKind.PUBLIC_REGISTRY,
              sourceUrl: `${getApiBase()}/reslista/?rm=${riksmål(year)}`,
              sourceRecordId: `${externalId}-income-${trip.datum}-${amount}-${year}`,
              legalBasis: "Riksdagens öppna reseredovisning",
              payload: { amount, kind: "travel_allowance", year },
              identity: identityFor(externalId),
              officialHint: politicianHint(name, trip.parti),
            });
          }
        }
        if (rateLimitMs > 0) await sleep(rateLimitMs);
      }

      return drafts;
    },
  };
}

export const riksdagConnector: WatchdogConnector = {
  key: CONNECTOR_KEY,
  label: "Riksdagen",
  async run(context: ConnectorContext) {
    await ensureRiksdagAuthority(context);
    return buildRiksdagDrafts(undefined, context.rateLimitMs).collect();
  },
};

export async function ensureRiksdagAuthority(context: ConnectorContext) {
  await context.prisma.authority.upsert({
    where: { slug: "riksdagen" },
    update: { name: "Sveriges riksdag" },
    create: {
      name: "Sveriges riksdag",
      slug: "riksdagen",
      level: "Riksdag",
      region: "Nationell",
      category: AuthorityCategory.MINISTRY,
      summary: "Sveriges riksdag — ledamöter, uppdrag och reseredovisningar via öppna data.",
    },
  });
}
