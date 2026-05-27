import { AuthorityCategory, OfficialCategory, PublicRecordCategory, SourceKind } from "@prisma/client";
import type { ConnectorContext, WatchdogConnector } from "@/lib/watchdog/connectors/base";
import type { NormalizedRecordDraft } from "@/lib/watchdog/records";
import { sanitizeRecordText } from "@/lib/watchdog/records";

const CONNECTOR_KEY = "riksdag";

type RiksdagPerson = {
  intressent_id?: string;
  hangar_id?: string;
  fornamn?: string;
  efternamn?: string;
  tilltalsnamn?: string;
  parti?: string;
  valkrets?: string;
  status?: string;
  fodd_ar?: string;
  kon?: string;
};

type RiksdagPersonList = {
  personlista?: {
    person?: RiksdagPerson | RiksdagPerson[];
  };
};

type RiksdagTravelRow = {
  hangar_id?: string;
  intressent_id?: string;
  fornamn?: string;
  efternamn?: string;
  parti?: string;
  valkrets?: string;
  arendetyp?: string;
  arende?: string;
  datum?: string;
  fran?: string;
  till?: string;
  syfte?: string;
  ersattning?: string;
  traktamente?: string;
  total?: string;
};

type RiksdagTravelList = {
  reslista?: {
    resa?: RiksdagTravelRow | RiksdagTravelRow[];
  };
};

function getApiBase() {
  return process.env.RIKSDAG_API_BASE?.replace(/\/$/, "") || "https://data.riksdagen.se";
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function fullName(person: Pick<RiksdagPerson, "fornamn" | "efternamn">) {
  return `${person.fornamn || ""} ${person.efternamn || ""}`.trim();
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(25_000),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function fetchMembers(): Promise<RiksdagPerson[]> {
  const payload = await fetchJson<RiksdagPersonList>(
    `${getApiBase()}/personlista/?utformat=json&p=3&sort=efternamn&sortorder=asc`,
  );
  return asArray(payload?.personlista?.person).filter((person) => person.intressent_id && fullName(person));
}

async function fetchTravel(year: number): Promise<RiksdagTravelRow[]> {
  const payload = await fetchJson<RiksdagTravelList>(
    `${getApiBase()}/reslista/?utformat=json&rm=${year - 1}/${year % 100}&p=1`,
  );
  return asArray(payload?.reslista?.resa).filter((row) => row.intressent_id && row.datum);
}

export const riksdagConnector: WatchdogConnector = {
  key: CONNECTOR_KEY,
  label: "Riksdagen",
  async run(_context: ConnectorContext) {
    const drafts: NormalizedRecordDraft[] = [];
    const members = await fetchMembers();
    const currentYear = new Date().getFullYear();
    const travelRows = await fetchTravel(currentYear);

    for (const person of members.slice(0, 200)) {
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
        legalBasis: "Riksdagens öppna data om ledamöter och uppdrag",
        payload: {
          party: person.parti,
          electoralDistrict: person.valkrets,
          status: person.status,
        },
        identity: {
          sourceKey: "riksdag:int_id",
          externalId,
          profileUrl,
        },
        officialHint: {
          fullName: name,
          title: `Riksdagsledamot (${person.parti || "partilös"})`,
          authoritySlug: "riksdagen",
          authorityName: "Sveriges riksdag",
          category: OfficialCategory.POLITICIAN,
        },
      });
    }

    for (const trip of travelRows.slice(0, 150)) {
      const name = fullName(trip);
      const amount = trip.total || trip.ersattning || trip.traktamente;
      const externalId = trip.intressent_id as string;

      drafts.push({
        connectorKey: CONNECTOR_KEY,
        category: PublicRecordCategory.TRAVEL,
        title: `${name} — resa ${trip.datum || ""}`.trim(),
        summary: sanitizeRecordText(
          `${name} reste ${trip.fran || "?"} → ${trip.till || "?"} (${trip.syfte || trip.arende || "tjänsteresa"}). Offentligt redovisad ersättning: ${amount || "okänd"} kr.`,
        ),
        occurredAt: trip.datum ? new Date(trip.datum) : undefined,
        sourceKind: SourceKind.PUBLIC_REGISTRY,
        sourceUrl: `${getApiBase()}/reslista/`,
        sourceRecordId: `${externalId}-${trip.datum}-${trip.till}`,
        legalBasis: "Riksdagens reseredovisning (öppna data)",
        payload: {
          from: trip.fran,
          to: trip.till,
          purpose: trip.syfte || trip.arende,
          amount,
          party: trip.parti,
        },
        identity: {
          sourceKey: "riksdag:int_id",
          externalId,
        },
        officialHint: {
          fullName: name,
          title: `Riksdagsledamot (${trip.parti || "partilös"})`,
          authoritySlug: "riksdagen",
          authorityName: "Sveriges riksdag",
          category: OfficialCategory.POLITICIAN,
        },
      });

      if (amount) {
        drafts.push({
          connectorKey: CONNECTOR_KEY,
          category: PublicRecordCategory.INCOME,
          title: `${name} — offentlig reseersättning ${trip.datum || ""}`.trim(),
          summary: sanitizeRecordText(
            `Offentligt redovisad reseersättning/traktamente: ${amount} kr för resa ${trip.fran || "?"} → ${trip.till || "?"}.`,
          ),
          occurredAt: trip.datum ? new Date(trip.datum) : undefined,
          sourceKind: SourceKind.PUBLIC_REGISTRY,
          sourceUrl: `${getApiBase()}/reslista/`,
          sourceRecordId: `${externalId}-income-${trip.datum}-${amount}`,
          legalBasis: "Riksdagens öppna reseredovisning",
          payload: { amount, kind: "travel_allowance" },
          identity: {
            sourceKey: "riksdag:int_id",
            externalId,
          },
          officialHint: {
            fullName: name,
            title: `Riksdagsledamot (${trip.parti || "partilös"})`,
            authoritySlug: "riksdagen",
            authorityName: "Sveriges riksdag",
            category: OfficialCategory.POLITICIAN,
          },
        });
      }
    }

    return drafts;
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
