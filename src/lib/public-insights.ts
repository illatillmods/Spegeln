import { unstable_cache } from "next/cache";
import { AuthorityCategory, LeaderboardWindow, Prisma } from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";

export type LeaderboardWindowKey = "weekly" | "monthly" | "all-time";
export type DashboardPeriodKey = "7d" | "30d" | "90d";

export type LeaderboardEntry = {
  rank: number;
  alias: string;
  score: number;
  complaintsWithResponse: number;
  investigationsReported: number;
  peerEndorsements: number;
  upvotes: number;
};

export type DashboardItem = {
  authorityId: string;
  authorityName: string;
  slug: string;
  category: string;
  regionCode: string | null;
  countryCode: string;
  complaints: number;
  investigations: number;
  reports: number;
  attentionScore: number;
  resolutionRate: number;
};

export type AuthorityScorecardView = {
  authorityId: string;
  authorityName: string;
  slug: string;
  category: string;
  regionCode: string | null;
  countryCode: string;
  overallScore: number;
  transparencyScore: number;
  responseTimeScore: number;
  complaintsScore: number;
  resolutionScore: number;
  methodologyVersion: string;
  explanation: {
    inputs: Record<string, number>;
    formulas: string[];
    note: string;
  };
};

export type PublicDatasetFilters = {
  countryCode?: string;
  regionCode?: string;
  category?: AuthorityCategory | "";
  period?: DashboardPeriodKey;
};

const DEFAULT_COUNTRY = "SE";
const SCORECARD_METHOD_VERSION = "watchdog-v1";

const mockLeaderboard: Record<LeaderboardWindowKey, LeaderboardEntry[]> = {
  weekly: [
    { rank: 1, alias: "Medborgare-ALFA", score: 41, complaintsWithResponse: 2, investigationsReported: 1, peerEndorsements: 5, upvotes: 3 },
    { rank: 2, alias: "Insyn-BJORK", score: 36, complaintsWithResponse: 1, investigationsReported: 1, peerEndorsements: 4, upvotes: 3 },
    { rank: 3, alias: "Granskare-NORD", score: 28, complaintsWithResponse: 2, investigationsReported: 0, peerEndorsements: 2, upvotes: 3 },
  ],
  monthly: [
    { rank: 1, alias: "Medborgare-ALFA", score: 84, complaintsWithResponse: 4, investigationsReported: 3, peerEndorsements: 8, upvotes: 7 },
    { rank: 2, alias: "Insyn-BJORK", score: 63, complaintsWithResponse: 3, investigationsReported: 2, peerEndorsements: 5, upvotes: 4 },
    { rank: 3, alias: "Granskare-NORD", score: 49, complaintsWithResponse: 3, investigationsReported: 1, peerEndorsements: 4, upvotes: 5 },
  ],
  "all-time": [
    { rank: 1, alias: "Medborgare-ALFA", score: 142, complaintsWithResponse: 8, investigationsReported: 5, peerEndorsements: 13, upvotes: 14 },
    { rank: 2, alias: "Insyn-BJORK", score: 119, complaintsWithResponse: 6, investigationsReported: 4, peerEndorsements: 11, upvotes: 9 },
    { rank: 3, alias: "Granskare-NORD", score: 93, complaintsWithResponse: 5, investigationsReported: 3, peerEndorsements: 8, upvotes: 10 },
  ],
};

const mockDashboard: DashboardItem[] = [
  {
    authorityId: "demo-polisen",
    authorityName: "Polismyndigheten",
    slug: "polismyndigheten",
    category: "POLICE",
    regionCode: "SE-AB",
    countryCode: "SE",
    complaints: 18,
    investigations: 6,
    reports: 4,
    attentionScore: 86,
    resolutionRate: 0.44,
  },
  {
    authorityId: "demo-fk",
    authorityName: "Försäkringskassan",
    slug: "forsakringskassan",
    category: "AGENCY",
    regionCode: "SE-AB",
    countryCode: "SE",
    complaints: 14,
    investigations: 3,
    reports: 2,
    attentionScore: 58,
    resolutionRate: 0.57,
  },
  {
    authorityId: "demo-stockholm",
    authorityName: "Stockholms stad",
    slug: "stockholms-stad",
    category: "MUNICIPALITY",
    regionCode: "SE-AB",
    countryCode: "SE",
    complaints: 11,
    investigations: 4,
    reports: 3,
    attentionScore: 55,
    resolutionRate: 0.62,
  },
];

const mockScorecards: AuthorityScorecardView[] = [
  {
    authorityId: "demo-polisen",
    authorityName: "Polismyndigheten",
    slug: "polismyndigheten",
    category: "POLICE",
    regionCode: "SE-AB",
    countryCode: "SE",
    overallScore: 52,
    transparencyScore: 49,
    responseTimeScore: 57,
    complaintsScore: 44,
    resolutionScore: 58,
    methodologyVersion: SCORECARD_METHOD_VERSION,
    explanation: {
      inputs: { complaints: 18, responded: 9, resolved: 8, publishedReports: 4, avgResponseHours: 118 },
      formulas: [
        "transparency = 35 + min(30, publicReports * 8) + min(35, respondedComplaints * 3)",
        "response = 100 - round(avgResponseHours / 10)",
        "complaints = 100 - min(70, complaints * 3)",
        "resolution = round((resolved / complaints) * 100)",
      ],
      note: "Transparens använder en reproducerbar proxy tills plattformen har ett separat dataset för offentlighetsförfrågningar och rådataöppenhet.",
    },
  },
  {
    authorityId: "demo-fk",
    authorityName: "Försäkringskassan",
    slug: "forsakringskassan",
    category: "AGENCY",
    regionCode: "SE-AB",
    countryCode: "SE",
    overallScore: 61,
    transparencyScore: 58,
    responseTimeScore: 63,
    complaintsScore: 58,
    resolutionScore: 65,
    methodologyVersion: SCORECARD_METHOD_VERSION,
    explanation: {
      inputs: { complaints: 14, responded: 10, resolved: 8, publishedReports: 2, avgResponseHours: 93 },
      formulas: [
        "transparency = 35 + min(30, publicReports * 8) + min(35, respondedComplaints * 3)",
        "response = 100 - round(avgResponseHours / 10)",
        "complaints = 100 - min(70, complaints * 3)",
        "resolution = round((resolved / complaints) * 100)",
      ],
      note: "Metoden är avsiktligt enkel och fullt reproducerbar från de anonymiserade aggregerade händelserna.",
    },
  },
];

function normalizeWindow(windowValue?: string | null): LeaderboardWindowKey {
  if (windowValue === "monthly" || windowValue === "all-time") {
    return windowValue;
  }

  return "weekly";
}

function normalizePeriod(periodValue?: string | null): DashboardPeriodKey {
  if (periodValue === "7d" || periodValue === "90d") {
    return periodValue;
  }

  return "30d";
}

function getWindowBounds(windowKey: LeaderboardWindowKey) {
  const end = new Date();
  const start = new Date(end);

  if (windowKey === "weekly") {
    start.setDate(end.getDate() - 7);
  } else if (windowKey === "monthly") {
    start.setDate(end.getDate() - 30);
  } else {
    start.setFullYear(2020, 0, 1);
  }

  return { start, end };
}

function getPeriodStart(periodKey: DashboardPeriodKey) {
  const start = new Date();
  const days = periodKey === "7d" ? 7 : periodKey === "90d" ? 90 : 30;
  start.setDate(start.getDate() - days);
  return start;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pseudonymizeUser(alias: string | null | undefined, userId: string) {
  if (alias) {
    return alias;
  }

  return `Medborgare-${userId.slice(-6).toUpperCase()}`;
}

function fixedWindowStart(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours()));
}

function normalizeCategory(categoryValue?: string | null) {
  if (!categoryValue) {
    return "";
  }

  const normalized = categoryValue.toUpperCase();
  const allowedValues = Object.values(AuthorityCategory);
  return allowedValues.includes(normalized as AuthorityCategory) ? (normalized as AuthorityCategory) : "";
}

function toLeaderboardWindowEnum(windowKey: LeaderboardWindowKey): LeaderboardWindow {
  if (windowKey === "monthly") {
    return LeaderboardWindow.MONTHLY;
  }

  if (windowKey === "all-time") {
    return LeaderboardWindow.ALL_TIME;
  }

  return LeaderboardWindow.WEEKLY;
}

function parseUpvoteCount(metadata: Prisma.JsonValue | null | undefined) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return 0;
  }

  const rawValue = metadata["upvotes"];
  return typeof rawValue === "number" ? rawValue : 0;
}

function toScorecardExplanation(value: Prisma.JsonValue): AuthorityScorecardView["explanation"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      inputs: {},
      formulas: [],
      note: "Ingen metodik sparad.",
    };
  }

  const inputsValue = value["inputs"];
  const formulasValue = value["formulas"];
  const noteValue = value["note"];

  const inputs = !inputsValue || typeof inputsValue !== "object" || Array.isArray(inputsValue)
    ? {}
    : Object.fromEntries(
        Object.entries(inputsValue).filter((entry): entry is [string, number] => typeof entry[1] === "number"),
      );

  const formulas = Array.isArray(formulasValue)
    ? formulasValue.filter((formula): formula is string => typeof formula === "string")
    : [];

  return {
    inputs,
    formulas,
    note: typeof noteValue === "string" ? noteValue : "Ingen metodik sparad.",
  };
}

export function parsePublicFilters(searchParams: URLSearchParams): Required<PublicDatasetFilters> {
  return {
    countryCode: searchParams.get("country") || DEFAULT_COUNTRY,
    regionCode: searchParams.get("region") || "",
    category: normalizeCategory(searchParams.get("category")),
    period: normalizePeriod(searchParams.get("period")),
  };
}

export async function getLeaderboard(windowValue?: string, countryCode = DEFAULT_COUNTRY) {
  const normalizedWindow = normalizeWindow(windowValue);
  const cacheKey = JSON.stringify({ normalizedWindow, countryCode });

  return unstable_cache(
    async () => getLeaderboardInternal(normalizedWindow, countryCode),
    ["public-leaderboard", cacheKey],
    { revalidate: 60 },
  )();
}

async function getLeaderboardInternal(windowKey: LeaderboardWindowKey, countryCode: string) {
  const prisma = getPrismaClient();
  if (!prisma) {
    return mockLeaderboard[windowKey];
  }

  const { start, end } = getWindowBounds(windowKey);
  const snapshots = await prisma.leaderboardSnapshot.findMany({
    where: {
      window: toLeaderboardWindowEnum(windowKey),
      windowStart: { gte: start },
      windowEnd: { lte: end },
      user: { countryCode },
    },
    include: { user: { select: { id: true, publicAlias: true } } },
    orderBy: [{ rank: "asc" }, { score: "desc" }],
    take: 15,
  });

  if (snapshots.length > 0) {
    return snapshots.map((entry, index) => ({
      rank: entry.rank || index + 1,
      alias: pseudonymizeUser(entry.user?.publicAlias, entry.userId),
      score: entry.score,
      complaintsWithResponse: entry.complaintsWithResponse,
      investigationsReported: entry.investigationsReported,
      peerEndorsements: entry.peerEndorsements,
      upvotes: parseUpvoteCount(entry.metadata),
    }));
  }

  const [complaints, complaintVotes, investigations, investigationEndorsements, users] = await Promise.all([
    prisma.complaint.findMany({
      where: {
        countryCode,
        createdAt: { gte: start, lte: end },
      },
      select: {
        id: true,
        authorId: true,
        officialResponseAt: true,
      },
    }),
    prisma.complaintVote.findMany({
      where: {
        complaint: {
          countryCode,
          createdAt: { gte: start, lte: end },
        },
      },
      select: { complaintId: true },
    }),
    prisma.investigation.findMany({
      where: {
        countryCode,
        createdAt: { gte: start, lte: end },
      },
      select: {
        id: true,
        leadUserId: true,
        publishedAt: true,
        publicReportId: true,
        status: true,
      },
    }),
    prisma.investigationEndorsement.findMany({
      where: {
        investigation: {
          countryCode,
          createdAt: { gte: start, lte: end },
        },
      },
      select: {
        investigationId: true,
      },
    }),
    prisma.user.findMany({
      where: { countryCode },
      select: { id: true, publicAlias: true },
    }),
  ]);

  const complaintOwners = new Map<string, string>();
  const leaderboard = new Map<string, LeaderboardEntry>();
  const investigationOwners = new Map<string, string>();

  for (const complaint of complaints) {
    if (!complaint.authorId) {
      continue;
    }

    complaintOwners.set(complaint.id, complaint.authorId);
    const current = leaderboard.get(complaint.authorId) || {
      rank: 0,
      alias: complaint.authorId,
      score: 0,
      complaintsWithResponse: 0,
      investigationsReported: 0,
      peerEndorsements: 0,
      upvotes: 0,
    };

    if (complaint.officialResponseAt) {
      current.complaintsWithResponse += 1;
      current.score += 8;
    }

    leaderboard.set(complaint.authorId, current);
  }

  for (const vote of complaintVotes) {
    const complaintOwnerId = complaintOwners.get(vote.complaintId);
    if (!complaintOwnerId) {
      continue;
    }

    const current = leaderboard.get(complaintOwnerId);
    if (!current) {
      continue;
    }

    current.upvotes += 1;
    current.score += 2;
  }

  for (const investigation of investigations) {
    if (!investigation.leadUserId) {
      continue;
    }

    investigationOwners.set(investigation.id, investigation.leadUserId);
    const current = leaderboard.get(investigation.leadUserId) || {
      rank: 0,
      alias: investigation.leadUserId,
      score: 0,
      complaintsWithResponse: 0,
      investigationsReported: 0,
      peerEndorsements: 0,
      upvotes: 0,
    };

    if (investigation.publicReportId || investigation.publishedAt || investigation.status === "REPORTED" || investigation.status === "CLOSED") {
      current.investigationsReported += 1;
      current.score += 13;
    }

    leaderboard.set(investigation.leadUserId, current);
  }

  for (const endorsement of investigationEndorsements) {
    const investigationOwnerId = investigationOwners.get(endorsement.investigationId);
    if (!investigationOwnerId) {
      continue;
    }

    const current = leaderboard.get(investigationOwnerId);
    if (!current) {
      continue;
    }

    current.peerEndorsements += 1;
    current.score += 3;
  }

  const userAliases = new Map(users.map((user) => [user.id, user.publicAlias]));

  return Array.from(leaderboard.entries())
    .map(([userId, entry]) => ({
      ...entry,
      alias: pseudonymizeUser(userAliases.get(userId), userId),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 15)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function getDashboardSnapshot(filters: PublicDatasetFilters = {}) {
  const normalized: Required<PublicDatasetFilters> = {
    countryCode: filters.countryCode || DEFAULT_COUNTRY,
    regionCode: filters.regionCode || "",
    category: normalizeCategory(filters.category),
    period: normalizePeriod(filters.period),
  };
  const cacheKey = JSON.stringify(normalized);

  return unstable_cache(
    async () => getDashboardSnapshotInternal(normalized),
    ["public-dashboard", cacheKey],
    { revalidate: 30 },
  )();
}

async function getDashboardSnapshotInternal(filters: Required<PublicDatasetFilters>) {
  const prisma = getPrismaClient();
  if (!prisma) {
    return mockDashboard;
  }

  const authorityWhere: Prisma.AuthorityWhereInput = {
    countryCode: filters.countryCode,
  };
  if (filters.regionCode) {
    authorityWhere.regionCode = filters.regionCode;
  }
  if (filters.category) {
    authorityWhere.category = filters.category;
  }

  const start = getPeriodStart(filters.period);
  const [authorities, complaints, investigations, reports] = await Promise.all([
    prisma.authority.findMany({
      where: authorityWhere,
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        regionCode: true,
        countryCode: true,
      },
    }),
    prisma.complaint.findMany({
      where: {
        countryCode: filters.countryCode,
        createdAt: { gte: start },
      },
      select: {
        authorityId: true,
        resolvedAt: true,
      },
    }),
    prisma.investigation.findMany({
      where: {
        countryCode: filters.countryCode,
        createdAt: { gte: start },
      },
      select: {
        authorityId: true,
      },
    }),
    prisma.report.findMany({
      where: {
        authority: { countryCode: filters.countryCode },
        createdAt: { gte: start },
      },
      select: {
        authorityId: true,
      },
    }),
  ]);

  const complaintsByAuthority = new Map<string, { total: number; resolved: number }>();
  const investigationsByAuthority = new Map<string, number>();
  const reportsByAuthority = new Map<string, number>();

  for (const complaint of complaints) {
    const current = complaintsByAuthority.get(complaint.authorityId) || { total: 0, resolved: 0 };
    current.total += 1;
    if (complaint.resolvedAt) {
      current.resolved += 1;
    }
    complaintsByAuthority.set(complaint.authorityId, current);
  }

  for (const investigation of investigations) {
    investigationsByAuthority.set(investigation.authorityId, (investigationsByAuthority.get(investigation.authorityId) || 0) + 1);
  }

  for (const report of reports) {
    reportsByAuthority.set(report.authorityId, (reportsByAuthority.get(report.authorityId) || 0) + 1);
  }

  return authorities
    .map((authority) => {
      const complaintStats = complaintsByAuthority.get(authority.id) || { total: 0, resolved: 0 };
      const complaintCount = complaintStats.total;
      const investigationCount = investigationsByAuthority.get(authority.id) || 0;
      const reportCount = reportsByAuthority.get(authority.id) || 0;
      const attentionScore = complaintCount * 3 + investigationCount * 5 + reportCount * 2;

      return {
        authorityId: authority.id,
        authorityName: authority.name,
        slug: authority.slug,
        category: authority.category,
        regionCode: authority.regionCode,
        countryCode: authority.countryCode,
        complaints: complaintCount,
        investigations: investigationCount,
        reports: reportCount,
        attentionScore,
        resolutionRate: complaintCount === 0 ? 0 : complaintStats.resolved / complaintCount,
      } satisfies DashboardItem;
    })
    .sort((left, right) => right.attentionScore - left.attentionScore)
    .slice(0, 20);
}

export async function getAuthorityScorecards(filters: PublicDatasetFilters = {}) {
  const normalized: Required<PublicDatasetFilters> = {
    countryCode: filters.countryCode || DEFAULT_COUNTRY,
    regionCode: filters.regionCode || "",
    category: normalizeCategory(filters.category),
    period: normalizePeriod(filters.period),
  };
  const cacheKey = JSON.stringify(normalized);

  return unstable_cache(
    async () => getAuthorityScorecardsInternal(normalized),
    ["public-scorecards", cacheKey],
    { revalidate: 120 },
  )();
}

async function getAuthorityScorecardsInternal(filters: Required<PublicDatasetFilters>) {
  const prisma = getPrismaClient();
  if (!prisma) {
    return mockScorecards;
  }

  const authorityWhere: Prisma.AuthorityWhereInput = {
    countryCode: filters.countryCode,
  };
  if (filters.regionCode) {
    authorityWhere.regionCode = filters.regionCode;
  }
  if (filters.category) {
    authorityWhere.category = filters.category;
  }

  const now = new Date();
  const windowStart = getPeriodStart(filters.period);
  const latestScorecards = await prisma.authorityScorecard.findMany({
    where: {
      authority: authorityWhere,
      windowEnd: { lte: now },
      windowStart: { gte: windowStart },
    },
    include: {
      authority: {
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          regionCode: true,
          countryCode: true,
        },
      },
    },
    orderBy: [{ overallScore: "desc" }, { createdAt: "desc" }],
    take: 12,
  });

  if (latestScorecards.length > 0) {
    return latestScorecards.map((card) => ({
      authorityId: card.authority.id,
      authorityName: card.authority.name,
      slug: card.authority.slug,
      category: card.authority.category,
      regionCode: card.authority.regionCode,
      countryCode: card.authority.countryCode,
      overallScore: card.overallScore,
      transparencyScore: card.transparencyScore,
      responseTimeScore: card.responseTimeScore,
      complaintsScore: card.complaintsScore,
      resolutionScore: card.resolutionScore,
      methodologyVersion: card.methodologyVersion,
      explanation: toScorecardExplanation(card.explanation),
    }));
  }

  const [authorities, complaints, reports] = await Promise.all([
    prisma.authority.findMany({
      where: authorityWhere,
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        regionCode: true,
        countryCode: true,
      },
    }),
    prisma.complaint.findMany({
      where: {
        countryCode: filters.countryCode,
        createdAt: { gte: windowStart },
      },
      select: {
        authorityId: true,
        createdAt: true,
        officialResponseAt: true,
        resolvedAt: true,
      },
    }),
    prisma.report.findMany({
      where: {
        authority: { countryCode: filters.countryCode },
        createdAt: { gte: windowStart },
        status: "PUBLISHED",
      },
      select: {
        authorityId: true,
      },
    }),
  ]);

  return authorities
    .map((authority) => {
      const authorityComplaints = complaints.filter((complaint) => complaint.authorityId === authority.id);
      const publishedReports = reports.filter((report) => report.authorityId === authority.id).length;
      const complaintCount = authorityComplaints.length;
      const respondedComplaints = authorityComplaints.filter((complaint) => complaint.officialResponseAt).length;
      const resolvedComplaints = authorityComplaints.filter((complaint) => complaint.resolvedAt).length;
      const responseDurations = authorityComplaints
        .filter((complaint) => complaint.officialResponseAt)
        .map((complaint) => new Date(complaint.officialResponseAt as Date).getTime() - new Date(complaint.createdAt).getTime());
      const avgResponseHours = responseDurations.length === 0
        ? 240
        : Math.round(responseDurations.reduce((sum, duration) => sum + duration, 0) / responseDurations.length / 36e5);

      const transparencyScore = clamp(35 + Math.min(30, publishedReports * 8) + Math.min(35, respondedComplaints * 3), 0, 100);
      const responseTimeScore = clamp(100 - Math.round(avgResponseHours / 10), 0, 100);
      const complaintsScore = clamp(100 - Math.min(70, complaintCount * 3), 0, 100);
      const resolutionScore = complaintCount === 0 ? 100 : clamp(Math.round((resolvedComplaints / complaintCount) * 100), 0, 100);
      const overallScore = Math.round(
        transparencyScore * 0.3 +
        responseTimeScore * 0.25 +
        complaintsScore * 0.2 +
        resolutionScore * 0.25,
      );

      return {
        authorityId: authority.id,
        authorityName: authority.name,
        slug: authority.slug,
        category: authority.category,
        regionCode: authority.regionCode,
        countryCode: authority.countryCode,
        overallScore,
        transparencyScore,
        responseTimeScore,
        complaintsScore,
        resolutionScore,
        methodologyVersion: SCORECARD_METHOD_VERSION,
        explanation: {
          inputs: {
            complaints: complaintCount,
            respondedComplaints,
            resolvedComplaints,
            publishedReports,
            avgResponseHours,
          },
          formulas: [
            "transparency = 35 + min(30, publishedReports * 8) + min(35, respondedComplaints * 3)",
            "responseTime = 100 - round(avgResponseHours / 10)",
            "complaints = 100 - min(70, complaintCount * 3)",
            "resolution = round((resolvedComplaints / complaintCount) * 100)",
            "overall = 0.30 * transparency + 0.25 * responseTime + 0.20 * complaints + 0.25 * resolution",
          ],
          note: "Beräkningen är offentlig, versionsstyrd och använder endast anonymiserade aggregerade signaler. Transparens är en tydligt dokumenterad proxy tills separata FOI- och öppna data-mått finns i drift.",
        },
      } satisfies AuthorityScorecardView;
    })
    .sort((left, right) => right.overallScore - left.overallScore)
    .slice(0, 12);
}

export function getCurrentRateWindow() {
  return fixedWindowStart(new Date());
}