import type { Official, OfficialRelationship, PublicRecord } from "@prisma/client";
import { PublicRecordCategory } from "@prisma/client";
import type {
  WatchPublicFact,
  WatchRecordDigest,
  WatchRelationship,
  WatchTimelineEvent,
  WatchVerdict,
} from "@/lib/watchdog";

const categoryLabels: Record<PublicRecordCategory, string> = {
  ROLE: "Tjänsteroll",
  INCOME: "Offentlig ersättning",
  PROPERTY: "Verksamhetsadress",
  TRAVEL: "Resa",
  COURT: "Domstol",
  COMPANY: "Bolagsroll",
  RELATIONSHIP: "Relation",
  PROCUREMENT: "Upphandling",
  OTHER: "Offentlig post",
};

function formatAmount(payload: unknown) {
  if (!payload || typeof payload !== "object") return undefined;
  const amount = (payload as { amount?: string | number }).amount;
  if (!amount) return undefined;
  const numeric = typeof amount === "number" ? amount : Number(String(amount).replace(/\s/g, ""));
  if (!Number.isFinite(numeric)) return `${amount} kr`;
  return `${numeric.toLocaleString("sv-SE")} kr`;
}

export function buildPublicFactsFromRecords(records: PublicRecord[], official: Pick<Official, "id" | "title"> & { authority: { name: string } }) {
  const facts: WatchPublicFact[] = [
    {
      id: `${official.id}-role`,
      label: "Tjänsteroll och ansvarsyta",
      values: [`${official.title} · ${official.authority.name}`],
      note: "Tjänsterollen visas för att koppla offentliga poster till korrekt beslutsnivå.",
    },
  ];

  const incomeRecords = records.filter((record) => record.category === PublicRecordCategory.INCOME);
  if (incomeRecords.length > 0) {
    facts.push({
      id: `${official.id}-income`,
      label: "Offentligt redovisade ersättningar",
      values: incomeRecords.slice(0, 6).map((record) => {
        const amount = formatAmount(record.payload);
        return amount ? `${record.title} (${amount})` : record.title;
      }),
      note: "Visar bara ersättningar som redan är offentligt redovisade — inte fulla skatteunderlag.",
    });
  }

  const travelRecords = records.filter((record) => record.category === PublicRecordCategory.TRAVEL);
  if (travelRecords.length > 0) {
    facts.push({
      id: `${official.id}-travel`,
      label: "Resor (offentlig redovisning)",
      values: travelRecords.slice(0, 5).map((record) => record.title),
      note: "Resor hämtade från offentliga reseredovisningar och diarier.",
    });
  }

  const companyRecords = records.filter((record) => record.category === PublicRecordCategory.COMPANY);
  if (companyRecords.length > 0) {
    facts.push({
      id: `${official.id}-company`,
      label: "Bolag och styrelseuppdrag",
      values: companyRecords.slice(0, 5).map((record) => record.title),
      note: "Bolagsroller från offentlig registrering och årsredovisningar.",
    });
  }

  const propertyRecords = records.filter((record) => record.category === PublicRecordCategory.PROPERTY);
  if (propertyRecords.length > 0) {
    facts.push({
      id: `${official.id}-property`,
      label: "Verksamhetsadresser",
      values: propertyRecords.slice(0, 4).map((record) => record.summary),
      note: "Endast verksamhetsadresser och deklarerade tillgångar — privata bostadsadresser maskeras.",
    });
  }

  const courtRecords = records.filter((record) => record.category === PublicRecordCategory.COURT);
  if (courtRecords.length > 0) {
    facts.push({
      id: `${official.id}-court`,
      label: "Domstols- och beslutsspår",
      values: courtRecords.slice(0, 4).map((record) => record.title),
      note: "Publicerade domar och myndighetsomnämnanden från öppna källor.",
    });
  }

  return facts;
}

export function buildTimelineFromRecords(records: PublicRecord[]): WatchTimelineEvent[] {
  return records
    .filter((record) => record.occurredAt || record.publishedAt)
    .map((record) => ({
      id: `record-${record.id}`,
      date: (record.occurredAt || record.publishedAt).toISOString(),
      title: record.title,
      description: record.summary,
      category: categoryLabels[record.category],
      source: record.sourceUrl ? `Källa: ${record.sourceUrl}` : record.legalBasis || "Offentlig registerpost",
      impact: "Verifierad offentlig post i övervakningspipelinen.",
      connectedEntities: record.connectorKey ? [record.connectorKey] : [],
      amount: formatAmount(record.payload),
      highlight: record.category === PublicRecordCategory.INCOME || record.category === PublicRecordCategory.COURT,
    }))
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
}

export function buildRecordDigestsFromRecords(records: PublicRecord[]): WatchRecordDigest[] {
  return records.slice(0, 12).map((record) => ({
    id: record.id,
    category: categoryLabels[record.category],
    title: record.title,
    date: (record.occurredAt || record.publishedAt).toISOString(),
    source: record.sourceUrl || record.legalBasis || "Offentlig källa",
    summary: record.summary,
  }));
}

export function buildVerdictsFromRecords(records: PublicRecord[]): WatchVerdict[] {
  return records
    .filter((record) => record.category === PublicRecordCategory.COURT)
    .slice(0, 6)
    .map((record) => ({
      court: record.connectorKey === "domstol" ? "Domstol" : "Offentligt avgörande",
      description: record.title,
      date: (record.occurredAt || record.publishedAt).toISOString(),
    }));
}

export function buildRelationshipsFromRecords(
  relationships: Array<
    OfficialRelationship & {
      toOfficial?: { fullName: string; title: string } | null;
    }
  >,
  officialName: string,
): WatchRelationship[] {
  return relationships.map((relationship) => ({
    id: relationship.id,
    name: relationship.toOfficial?.fullName || relationship.toOrgName || "Okänd part",
    category: relationship.relationshipType,
    relationship: relationship.toOfficial
      ? `${officialName} ↔ ${relationship.toOfficial.fullName}`
      : `${officialName} ↔ ${relationship.toOrgName}`,
    publicBasis: relationship.publicBasis,
    overlap: relationship.sourceUrl ? `Källa: ${relationship.sourceUrl}` : relationship.publicBasis,
    recordCount: 1,
  }));
}

export async function deriveRelationshipsFromRecords(
  prisma: import("@prisma/client").PrismaClient,
  officialId: string,
  records: PublicRecord[],
) {
  const companyRecords = records.filter((record) => record.category === PublicRecordCategory.COMPANY);

  for (const record of companyRecords) {
    const payload = record.payload as { companyName?: string } | null;
    const orgName = payload?.companyName;
    if (!orgName) continue;

    const existing = await prisma.officialRelationship.findFirst({
      where: {
        fromOfficialId: officialId,
        toOrgName: orgName,
        relationshipType: "Styrelse-/bolagskoppling",
      },
    });

    if (existing) continue;

    await prisma.officialRelationship.create({
      data: {
        fromOfficialId: officialId,
        toOrgName: orgName,
        relationshipType: "Styrelse-/bolagskoppling",
        publicBasis: record.legalBasis || "Offentlig bolagsregistrering",
        sourceRecordId: record.id,
        sourceUrl: record.sourceUrl,
      },
    });
  }
}
