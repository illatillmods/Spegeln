import { getDisclosureBoundaries } from "@/lib/disclosure-policy";
import { getPrismaClient } from "@/lib/prisma";
import {
  AlertSeverity,
  ModerationDecision,
  SeverityLevel,
  SourceKind,
  TrustVoteDirection,
  type AuthorityCategory,
} from "@prisma/client";

export type WatchChannel = "email" | "browser" | "rss";
export type WatchCadence = "REALTIME" | "HOURLY" | "DAILY";

export type WatchTargetSummary = {
  targetId: string;
  targetType: "official" | "authority";
  targetName: string;
  recommendedCadence: WatchCadence;
  defaultChannels: WatchChannel[];
  note: string;
};

export type WatchdogSnapshot = {
  totalTrackedRecords: number;
  officialsCovered: number;
  authoritiesCovered: number;
  publishedReports: number;
  liveAlerts: number;
  dailySyncCoverage: string;
  publicSourceFamilies: string[];
  guardrails: string[];
};

export type WatchAuthorityCard = {
  id: string;
  slug: string;
  name: string;
  category: string;
  region: string;
  summary: string;
  monitoredOfficials: number;
  totalSignals: number;
  publishedReports: number;
  openAlerts: number;
  lastSyncAt: string;
  focusAreas: string[];
  sourceMix: string[];
  watchTarget: WatchTargetSummary;
};

export type WatchDirectoryPerson = {
  id: string;
  fullName: string;
  title: string;
  authorityName: string;
  authoritySlug: string;
  summary: string;
  totalSignals: number;
  monitoredSources: number;
  publishedReports: number;
  openAlerts: number;
  lastSyncAt: string;
};

export type WatchCoverageItem = {
  id: string;
  label: string;
  category: string;
  cadence: string;
  status: string;
  lastActivityAt: string;
  note: string;
  sourceUrl?: string | null;
  legalBasis?: string;
};

export type WatchPublicFact = {
  id: string;
  label: string;
  values: string[];
  note: string;
};

export type WatchRelationship = {
  id: string;
  name: string;
  category: string;
  relationship: string;
  publicBasis: string;
  overlap: string;
  recordCount: number;
};

export type WatchDisclosureBoundary = {
  id: string;
  label: string;
  status: "Visas" | "Maskas" | "Blockeras";
  reason: string;
};

export type WatchVerdict = {
  court: string;
  description: string;
  date: string;
};

export type WatchTimelineEvent = {
  id: string;
  date: string;
  title: string;
  description: string;
  category: string;
  source: string;
  impact: string;
  connectedEntities: string[];
  amount?: string;
  highlight?: boolean;
};

export type WatchAlertItem = {
  id: string;
  date: string;
  message: string;
  severity: "info" | "warning" | "critical";
  source: string;
  trigger: string;
};

export type WatchRecordDigest = {
  id: string;
  category: string;
  title: string;
  date: string;
  source: string;
  summary: string;
};

export type WatchPatternSignal = {
  id: string;
  title: string;
  summary: string;
  status: "Bekräftad" | "Framväxande";
};

export type WatchTrustSnapshot = {
  confidenceScore: number;
  upvotes: number;
  downvotes: number;
  testimonials: number;
};

export type WatchCourtTestimonial = {
  headline: string;
  body: string;
  createdAt: string;
};

export type WatchProfile = {
  id: string;
  fullName: string;
  title: string;
  authorityId: string;
  authorityName: string;
  authoritySlug: string;
  summary: string;
  statusNote: string;
  totalSignals: number;
  monitoredSources: number;
  publishedReports: number;
  openAlerts: number;
  complaints: number;
  failureReports: number;
  lastDailySyncAt: string;
  refreshPolicy: string;
  coverage: WatchCoverageItem[];
  publicFacts: WatchPublicFact[];
  relationships: WatchRelationship[];
  disclosureBoundaries: WatchDisclosureBoundary[];
  patternSignals: WatchPatternSignal[];
  timeline: WatchTimelineEvent[];
  alerts: WatchAlertItem[];
  recordDigests: WatchRecordDigest[];
  verdicts: WatchVerdict[];
  trust: WatchTrustSnapshot;
  courtTestimonials: WatchCourtTestimonial[];
  watchTarget: WatchTargetSummary;
};

function sourceKindLabel(kind: SourceKind) {
  const labels: Record<SourceKind, string> = {
    PUBLIC_REGISTRY: "Publikt register",
    COURT_RECORD: "Domstolshandling",
    PROCUREMENT: "Upphandling",
    NEWS: "Nyhetskälla",
    FOI_RESPONSE: "FOI-svar",
    TIP: "Tipsflöde",
    ARCHIVE: "Arkiv",
  };

  return labels[kind];
}

function authorityCategoryLabel(category: AuthorityCategory) {
  const labels: Record<AuthorityCategory, string> = {
    AGENCY: "Myndighet",
    MUNICIPALITY: "Kommun",
    REGION: "Region",
    COURT: "Domstol",
    POLICE: "Polis",
    REGULATOR: "Tillsyn",
    MINISTRY: "Departement",
    PUBLIC_COMPANY: "Offentligt bolag",
    OTHER: "Offentlig aktör",
  };

  return labels[category];
}

function alertSeverityLabel(severity: AlertSeverity): WatchAlertItem["severity"] {
  if (severity === AlertSeverity.CRITICAL || severity === AlertSeverity.HIGH) {
    return "critical";
  }

  if (severity === AlertSeverity.MEDIUM) {
    return "warning";
  }

  return "info";
}

function failureSeverityLabel(severity: SeverityLevel): WatchAlertItem["severity"] {
  if (severity === SeverityLevel.CRITICAL || severity === SeverityLevel.HIGH) {
    return "critical";
  }

  if (severity === SeverityLevel.MEDIUM) {
    return "warning";
  }

  return "info";
}

function latestIsoString(dates: Array<Date | string | null | undefined>) {
  const values = dates
    .filter((value): value is Date | string => Boolean(value))
    .map((value) => (value instanceof Date ? value.getTime() : new Date(value).getTime()))
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) {
    return new Date().toISOString();
  }

  return new Date(Math.max(...values)).toISOString();
}

function trustFromVotes(votes: Array<{ direction: TrustVoteDirection }>, testimonials: number): WatchTrustSnapshot {
  const upvotes = votes.filter((vote) => vote.direction === TrustVoteDirection.UP).length;
  const downvotes = votes.length - upvotes;
  const totalVotes = upvotes + downvotes;

  return {
    confidenceScore: totalVotes === 0 ? 50 : Math.round((upvotes / totalVotes) * 100),
    upvotes,
    downvotes,
    testimonials,
  };
}

function defaultChannelsForAuthority(category: string): WatchChannel[] {
  if (category === "Polis" || category === "Domstol") {
    return ["email", "browser"];
  }

  return ["email", "rss"];
}

function buildAuthorityWatchTarget(authorityId: string, authorityName: string, category: string): WatchTargetSummary {
  return {
    targetId: authorityId,
    targetType: "authority",
    targetName: authorityName,
    recommendedCadence: category === "Polis" ? "REALTIME" : "HOURLY",
    defaultChannels: defaultChannelsForAuthority(category),
    note: "Notifierar om nya öppna dokument, rapporter och verifierade alerts i myndighetsytan.",
  };
}

function buildOfficialWatchTarget(officialId: string, officialName: string): WatchTargetSummary {
  return {
    targetId: officialId,
    targetType: "official",
    targetName: officialName,
    recommendedCadence: "HOURLY",
    defaultChannels: ["email", "browser"],
    note: "Bevakningen följer nya klagomål, publicerade rapporter och alerts kopplade till tjänsterollen.",
  };
}

function buildDisclosureBoundaries(): WatchDisclosureBoundary[] {
  return getDisclosureBoundaries();
}

export async function getWatchdogAuthorities(): Promise<WatchAuthorityCard[]> {
  const prisma = getPrismaClient();

  if (!prisma) {
    return [];
  }

  const authorities = await prisma.authority.findMany({
    include: {
      sources: {
        select: {
          id: true,
          name: true,
          sourceKind: true,
        },
      },
      alerts: {
        select: { detectedAt: true },
        orderBy: { detectedAt: "desc" },
        take: 1,
      },
      complaints: {
        select: { updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
      reports: {
        select: { updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
      failureReports: {
        select: { updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          officials: true,
          alerts: true,
          complaints: true,
          reports: true,
          failureReports: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 24,
  });

  return authorities.map((authority) => {
    const category = authorityCategoryLabel(authority.category);
    const sourceMix = Array.from(new Set(authority.sources.map((source) => sourceKindLabel(source.sourceKind))));
    const focusAreas = authority.sources.map((source) => source.name).slice(0, 3);
    const totalSignals =
      authority._count.alerts +
      authority._count.complaints +
      authority._count.reports +
      authority._count.failureReports;

    return {
      id: authority.id,
      slug: authority.slug,
      name: authority.name,
      category,
      region: authority.region || authority.regionCode || authority.countryCode,
      summary:
        authority.summary ||
        `${authority.name} samlar live-signaler från rapporter, klagomål, alerts och anslutna källfamiljer i samma bevakningsyta.`,
      monitoredOfficials: authority._count.officials,
      totalSignals,
      publishedReports: authority._count.reports,
      openAlerts: authority._count.alerts,
      lastSyncAt: latestIsoString([
        authority.updatedAt,
        authority.alerts[0]?.detectedAt,
        authority.complaints[0]?.updatedAt,
        authority.reports[0]?.updatedAt,
        authority.failureReports[0]?.updatedAt,
      ]),
      focusAreas: focusAreas.length > 0 ? focusAreas : [category, "Publika signaler", "Rapporter"],
      sourceMix: sourceMix.length > 0 ? sourceMix : ["Publikt register", "Rapportflöde"],
      watchTarget: buildAuthorityWatchTarget(authority.id, authority.name, category),
    };
  });
}

export async function getWatchdogPeople(): Promise<WatchDirectoryPerson[]> {
  const prisma = getPrismaClient();

  if (!prisma) {
    return [];
  }

  const officials = await prisma.official.findMany({
    include: {
      authority: {
        include: {
          sources: {
            select: { id: true },
          },
          alerts: {
            select: { detectedAt: true },
            orderBy: { detectedAt: "desc" },
            take: 1,
          },
          _count: {
            select: {
              alerts: true,
              reports: true,
            },
          },
        },
      },
      complaints: {
        select: { updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
      failureReports: {
        select: { updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          complaints: true,
          failureReports: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 60,
  });

  return officials.map((official) => ({
    id: official.id,
    fullName: official.fullName,
    title: official.title,
    authorityName: official.authority.name,
    authoritySlug: official.authority.slug,
    summary:
      official.riskNote ||
      `${official.title} i ${official.authority.name}. Profilen visar öppna klagomål, publicerade rapporter och aktuella alerts från myndighetsytan.`,
    totalSignals:
      official._count.complaints +
      official._count.failureReports +
      official.authority._count.reports +
      official.authority._count.alerts,
    monitoredSources: official.authority.sources.length,
    publishedReports: official.authority._count.reports,
    openAlerts: official.authority._count.alerts,
    lastSyncAt: latestIsoString([
      official.updatedAt,
      official.authority.updatedAt,
      official.authority.alerts[0]?.detectedAt,
      official.complaints[0]?.updatedAt,
      official.failureReports[0]?.updatedAt,
    ]),
  }));
}

export async function getWatchdogSnapshot(): Promise<WatchdogSnapshot> {
  const prisma = getPrismaClient();

  if (!prisma) {
    return {
      totalTrackedRecords: 0,
      officialsCovered: 0,
      authoritiesCovered: 0,
      publishedReports: 0,
      liveAlerts: 0,
      dailySyncCoverage:
        "Livevyn uppdateras från databasen med nya offentliga poster, rapporter, klagomål och granskningsärenden så snart de kopplats till rätt spår.",
      publicSourceFamilies: [],
      guardrails: [
        "Visar offentliga poster, publika rapporter och metadata som redan kopplats till plattformens öppna spår.",
        "Privata hemadresser, familjeuppgifter och obekräftad rådata kapas bort så att fokus stannar på offentlig maktutövning.",
        "Hög allvarlighetsgrad i feeden betyder att spåret bränner, inte att någon redan är dömd.",
      ],
    };
  }

  const [officialsCovered, authoritiesCovered, liveAlerts, publishedReports, complaints, failureReports, sources] = await Promise.all([
    prisma.official.count(),
    prisma.authority.count(),
    prisma.alert.count(),
    prisma.report.count(),
    prisma.complaint.count(),
    prisma.authorityFailureReport.count(),
    prisma.monitoringSource.findMany({
      select: { sourceKind: true },
      distinct: ["sourceKind"],
    }),
  ]);

  return {
    totalTrackedRecords: liveAlerts + publishedReports + complaints + failureReports,
    officialsCovered,
    authoritiesCovered,
    publishedReports,
    liveAlerts,
    dailySyncCoverage:
      "Livevyn uppdateras från databasen med nya offentliga poster, rapporter, klagomål och granskningsärenden så snart de kopplats till rätt spår.",
    publicSourceFamilies:
      sources.length > 0 ? sources.map((source) => sourceKindLabel(source.sourceKind)) : ["Publikt register", "Rapportflöde"],
    guardrails: [
      "Visar offentliga poster, publika rapporter och metadata som redan kopplats till plattformens öppna spår.",
      "Privata hemadresser, familjeuppgifter och obekräftad rådata kapas bort så att fokus stannar på offentlig maktutövning.",
      "Hög allvarlighetsgrad i feeden betyder att spåret bränner, inte att någon redan är dömd.",
    ],
  };
}

export async function getWatchdogProfile(id: string): Promise<WatchProfile | null> {
  const prisma = getPrismaClient();

  if (!prisma) {
    return null;
  }

  const official = await prisma.official.findUnique({
    where: { id },
    include: {
      authority: {
        include: {
          sources: {
            select: {
              id: true,
              name: true,
              sourceKind: true,
              baseUrl: true,
              description: true,
              legalBasisNote: true,
              updatedAt: true,
            },
          },
          alerts: {
            select: {
              id: true,
              title: true,
              summary: true,
              severity: true,
              detectedAt: true,
            },
            orderBy: { detectedAt: "desc" },
            take: 6,
          },
          reports: {
            select: {
              id: true,
              title: true,
              slug: true,
              summary: true,
              status: true,
              publishedAt: true,
              updatedAt: true,
            },
            orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
            take: 8,
          },
          _count: {
            select: {
              alerts: true,
              reports: true,
            },
          },
        },
      },
      complaints: {
        include: {
          publicReport: {
            select: {
              slug: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      },
      failureReports: {
        orderBy: { createdAt: "desc" },
        take: 8,
      },
      confidenceVotes: {
        select: {
          direction: true,
        },
      },
      testimonials: {
        where: { moderationDecision: ModerationDecision.APPROVED },
        select: {
          createdAt: true,
          headline: true,
          body: true,
        },
        orderBy: { createdAt: "desc" },
        take: 4,
      },
      _count: {
        select: {
          complaints: true,
          failureReports: true,
        },
      },
    },
  });

  if (!official) {
    return null;
  }

  const trust = trustFromVotes(official.confidenceVotes, official.testimonials.length);
  const recordDigests = [
    ...official.failureReports.map((item) => ({
      id: `failure-${item.id}`,
      category: "Granskningsärende",
      title: item.title,
      date: item.createdAt.toISOString(),
      source: official.authority.name,
      summary: item.summary,
    })),
    ...official.complaints.map((item) => ({
      id: `complaint-${item.id}`,
      category: "Klagomål",
      title: item.title,
      date: item.createdAt.toISOString(),
      source: official.authority.name,
      summary: item.summary,
    })),
    ...official.authority.reports.map((item) => ({
      id: `report-${item.id}`,
      category: item.status === "PUBLISHED" ? "Publik rapport" : "Rapportutkast",
      title: item.title,
      date: (item.publishedAt || item.updatedAt).toISOString(),
      source: official.authority.name,
      summary: item.summary,
    })),
  ]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 8);

  const timeline = [
    ...official.authority.alerts.map((alert) => ({
      id: `alert-${alert.id}`,
      date: alert.detectedAt.toISOString(),
      title: alert.title,
      description: alert.summary,
      category: "Alert",
      source: official.authority.name,
      impact: "Signal lagd i den operativa bevakningskön.",
      connectedEntities: [official.authority.name],
      highlight: alert.severity === AlertSeverity.CRITICAL || alert.severity === AlertSeverity.HIGH,
    })),
    ...official.failureReports.map((item) => ({
      id: `failure-${item.id}`,
      date: item.createdAt.toISOString(),
      title: item.title,
      description: item.summary,
      category: "Granskningsärende",
      source: official.authority.name,
      impact: `${item.aiSeverity} prioritet ${item.aiPriorityScore}.`,
      connectedEntities: [official.fullName],
      highlight: item.aiSeverity === SeverityLevel.CRITICAL || item.aiSeverity === SeverityLevel.HIGH,
    })),
    ...official.complaints.map((item) => ({
      id: `complaint-${item.id}`,
      date: item.createdAt.toISOString(),
      title: item.title,
      description: item.summary,
      category: "Klagomål",
      source: official.authority.name,
      impact: item.resolvedAt ? "Ärendet har markerats som löst." : item.officialResponseAt ? "Myndigheten har svarat i ärendet." : "Väntar på svar eller vidare handläggning.",
      connectedEntities: [official.fullName],
      highlight: !item.resolvedAt,
    })),
    ...official.authority.reports.map((item) => ({
      id: `report-${item.id}`,
      date: (item.publishedAt || item.updatedAt).toISOString(),
      title: item.title,
      description: item.summary,
      category: item.status === "PUBLISHED" ? "Publik rapport" : "Rapportutkast",
      source: official.authority.name,
      impact: item.status === "PUBLISHED" ? "Rapporten är publicerad i plattformen." : `Rapportstatus ${item.status}.`,
      connectedEntities: [official.authority.name],
      highlight: item.status === "LEGAL_REVIEW",
    })),
  ].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

  const alerts = official.authority.alerts.length > 0
    ? official.authority.alerts.map((alert) => ({
        id: alert.id,
        date: alert.detectedAt.toISOString(),
        message: alert.title,
        severity: alertSeverityLabel(alert.severity),
        source: official.authority.name,
        trigger: alert.summary,
      }))
    : official.failureReports.slice(0, 3).map((item) => ({
        id: item.id,
        date: item.createdAt.toISOString(),
        message: item.title,
        severity: failureSeverityLabel(item.aiSeverity),
        source: official.authority.name,
        trigger: item.summary,
      }));

  const patternSignals: WatchPatternSignal[] = [];

  if (official._count.complaints > 0) {
    const unresolvedComplaints = official.complaints.filter((item) => !item.resolvedAt).length;
    patternSignals.push({
      id: `${official.id}-complaints`,
      title: "Klagomålsmönster i profilflödet",
      summary:
        unresolvedComplaints > 0
          ? `${unresolvedComplaints} öppna klagomål väntar fortfarande på lösning eller full återkoppling.`
          : "Historiska klagomål finns registrerade men är markerade som besvarade eller lösta.",
      status: unresolvedComplaints > 0 ? "Bekräftad" : "Framväxande",
    });
  }

  if (official._count.failureReports > 0) {
    const severeCases = official.failureReports.filter(
      (item) => item.aiSeverity === SeverityLevel.CRITICAL || item.aiSeverity === SeverityLevel.HIGH,
    ).length;
    patternSignals.push({
      id: `${official.id}-failures`,
      title: "AI-triagerade granskningsärenden",
      summary:
        severeCases > 0
          ? `${severeCases} ärenden har markerats som hög eller kritisk prioritet i granskningskön.`
          : "Profilen har registrerade granskningsärenden, men utan akut AI-prioritering just nu.",
      status: severeCases > 0 ? "Bekräftad" : "Framväxande",
    });
  }

  if (official.authority.reports.some((item) => item.status === "LEGAL_REVIEW")) {
    patternSignals.push({
      id: `${official.id}-legal-review`,
      title: "Rapporter som väntar på nästa tryckvåg",
      summary: "Det finns rapportutkast eller underlag som ännu inte släppts publikt men redan bygger upp nästa våg av press.",
      status: "Framväxande",
    });
  }

  return {
    id: official.id,
    fullName: official.fullName,
    title: official.title,
    authorityId: official.authority.id,
    authorityName: official.authority.name,
    authoritySlug: official.authority.slug,
    summary:
      official.riskNote ||
      `${official.title} på ${official.authority.name}. Profilen sammanställer klagomål, granskningsärenden, publika rapporter och aktiva alerts från den anslutna myndighetsytan.`,
    statusNote:
      official.authority.alerts.length > 0
        ? `${official.authority.alerts.length} live alerts är aktiva i myndighetsytan just nu.`
        : "Inga separata myndighetsalerts ligger ute just nu; feeden bygger i stället på klagomål, rapporter och granskningsärenden.",
    totalSignals:
      official._count.complaints +
      official._count.failureReports +
      official.authority._count.reports +
      official.authority._count.alerts,
    monitoredSources: official.authority.sources.length,
    publishedReports: official.authority._count.reports,
    openAlerts: alerts.length,
    complaints: official._count.complaints,
    failureReports: official._count.failureReports,
    lastDailySyncAt: latestIsoString([
      official.updatedAt,
      official.authority.updatedAt,
      official.authority.alerts[0]?.detectedAt,
      official.failureReports[0]?.updatedAt,
      official.complaints[0]?.updatedAt,
      official.authority.reports[0]?.updatedAt,
    ]),
    refreshPolicy: "Profilerna uppdateras från databasen när nya alerts, rapporter, klagomål eller granskningar ger mer bränsle till spåret.",
    coverage: official.authority.sources.map((source) => ({
      id: source.id,
      label: source.name,
      category: sourceKindLabel(source.sourceKind),
      cadence: source.sourceKind === SourceKind.FOI_RESPONSE ? "När nya svar registreras" : "Löpande när nya poster skrivs in",
      status: "Aktiv",
      lastActivityAt: source.updatedAt.toISOString(),
      note: source.description || `Källfamiljen ${source.name} är kopplad till myndighetsytan och används i granskningsflödet.`,
      sourceUrl: source.baseUrl,
      legalBasis: source.legalBasisNote || "Källan används som offentlig grund för att bygga profil, tidslinje och vidare tryck.",
    })),
    publicFacts: [
      {
        id: `${official.id}-role`,
        label: "Tjänsteroll och ansvarsyta",
        values: [`${official.title} · ${official.authority.name}`],
        note: "Tjänsterollen visas för att koppla offentliga poster till korrekt beslutsnivå och myndighetskontext.",
      },
      {
        id: `${official.id}-published`,
        label: "Publika rapporter och diarieförda poster",
        values: [
          `${official.authority._count.reports} publicerade eller aktiva rapportspår`,
          `${official._count.complaints} klagomål i granskningsflödet`,
          `${official._count.failureReports} granskningsärenden`,
        ],
        note: "Visar bara poster som redan finns i plattformens granskade datalager eller i myndighetens offentliga källkedja.",
      },
      {
        id: `${official.id}-sources`,
        label: "Anslutna offentliga källfamiljer",
        values:
          official.authority.sources.length > 0
            ? Array.from(new Set(official.authority.sources.map((source) => sourceKindLabel(source.sourceKind))))
            : ["Publika rapporter", "Klagomålsflöde"],
        note: "Källfamiljer beskriver vilken typ av offentlig dokumentation som driver profilen. De är inte i sig bevis för ansvar.",
      },
    ],
    relationships: [
      {
        id: `${official.id}-authority`,
        name: official.authority.name,
        category: "Myndighet",
        relationship: "Tjänsteroll och beslutsmiljö",
        publicBasis: "Myndighetsregister och offentlig organisationsdata",
        overlap: "Profilen ankras till den myndighet där offentliga klagomål, rapporter och alerts registreras.",
        recordCount:
          official._count.complaints + official._count.failureReports + official.authority._count.reports + official.authority._count.alerts,
      },
      ...official.authority.sources.slice(0, 5).map((source) => ({
        id: `${official.id}-${source.id}`,
        name: source.name,
        category: sourceKindLabel(source.sourceKind),
        relationship: "Verifierad offentlig källa i granskningskedjan",
        publicBasis: source.legalBasisNote || "Registrerad bevakningskälla med definierat granskningsändamål",
        overlap:
          source.description ||
          `Källfamiljen ${source.name} används för att verifiera offentliga poster kopplade till tjänsterollen och myndighetsytan.`,
        recordCount: 1,
      })),
    ],
    disclosureBoundaries: buildDisclosureBoundaries(),
    patternSignals: patternSignals.length > 0
      ? patternSignals
      : [{
          id: `${official.id}-baseline`,
          title: "Baslinje etablerad",
          summary: "Profilen är ansluten till liveflödet men har ännu inte tillräckligt många händelser för tydliga mönstersignaler.",
          status: "Framväxande",
        }],
    timeline,
    alerts,
    recordDigests,
    verdicts: [],
    trust,
    courtTestimonials: official.testimonials.map((item) => ({
      headline: item.headline,
      body: item.body,
      createdAt: item.createdAt.toISOString(),
    })),
    watchTarget: buildOfficialWatchTarget(official.id, official.fullName),
  };
}