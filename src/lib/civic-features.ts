export { getWikiPageBySlug } from "@/lib/civic/wiki";
export { getAccountOverview, deleteUserWatch, listUserWatches, upsertUserWatch } from "@/lib/civic/account";
export { getTaxAnalysisById, listTaxAnalyses, saveTaxAnalysis } from "@/lib/civic/tax-analyses";
export {
  createReverseSurveillanceSubmission,
  getReverseSurveillanceById,
  listReverseSurveillance,
  type ReverseSurveillanceInput,
  type ReverseSurveillanceView,
} from "@/lib/civic/reverse-surveillance";
import { createHash } from "node:crypto";
import {
  AppealArtifactKind,
  AppealAutomationStatus,
  EvidenceAssetKind,
  IntakeLifecycleStatus,
  ModerationDecision,
  SeverityLevel,
  TrustVoteDirection,
} from "@prisma/client";
import {
  requestAutomatedAppealBundle,
  requestFailureTriage,
  requestPressReleaseDraft,
  type AutomatedAppealResult,
  type EvidenceManifest,
} from "@/lib/ai-worker";
import { sendMassAppeal } from "@/lib/mass-appeals";
import { getPrismaClient } from "@/lib/prisma";

type EvidenceAssetInput = EvidenceManifest;

export type FailureReportInput = {
  authorityId?: string;
  officialId?: string;
  title: string;
  summary: string;
  anonymousAlias?: string;
  incidentDate?: string;
  countryCode?: string;
  regionCode?: string;
  evidence: EvidenceAssetInput[];
};

export type FailureReportView = {
  id: string;
  title: string;
  summary: string;
  authorityName?: string;
  authorityCategory?: string;
  authoritySlug?: string;
  officialName?: string;
  anonymousAlias?: string;
  aiSeverity: string;
  aiPriorityScore: number;
  aiSummary?: string;
  lifecycleStatus: string;
  pressReleaseDraft?: string;
  evidenceCount: number;
  createdAt: string;
};

export type ConfidenceVoteInput = {
  authorityId?: string;
  officialId?: string;
  anonymousAlias?: string;
  direction: "UP" | "DOWN";
  countryCode?: string;
  regionCode?: string;
};

export type ConfidenceTestimonialInput = {
  authorityId?: string;
  officialId?: string;
  anonymousAlias?: string;
  headline: string;
  body: string;
  countryCode?: string;
  regionCode?: string;
};

export type ConfidenceBoardEntry = {
  targetId: string;
  targetLabel: string;
  kind: "authority" | "official";
  confidenceScore: number;
  upvotes: number;
  downvotes: number;
  testimonials: number;
  trend: number;
};

export type WikiDraftInput = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  bodyMarkdown: string;
  changeSummary?: string;
  anonymousAlias?: string;
  countryCode?: string;
  regionCode?: string;
  locale?: string;
};

export type WikiPageView = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  score: number;
  revisionCount: number;
  latestExcerpt: string;
};

export type AutomatedAppealInput = {
  authorityId?: string;
  officialId?: string;
  sourceTitle: string;
  sourceSummary: string;
  senderName?: string;
  senderEmail?: string;
  senderRole?: string;
  region?: string;
  selectedAuthorityIds?: string[];
  submissionMode?: "draft" | "submit";
  countryCode?: string;
  regionCode?: string;
  locale?: string;
  evidence: EvidenceAssetInput[];
};

export type AutomatedAppealView = {
  id: string;
  sourceTitle: string;
  parsedDecisionSummary?: string;
  riskSummary?: string;
  status: string;
  artifactCount: number;
  submittedBatchId?: string;
  createdAt: string;
  artifacts: Array<{
    id: string;
    kind: string;
    title: string;
    subjectLine: string;
    body: string;
  }>;
};

type ActorContext = {
  userId?: string;
  email?: string;
  subscriptionTier?: "FREE" | "PLUS" | "PRO" | "CIVIC_LAB";
  fingerprintSource?: string;
  ipAddress?: string | null;
};

function hashFingerprint(source?: string | null) {
  if (!source) {
    return null;
  }

  return createHash("sha256").update(source).digest("hex");
}

function normalizeText(value: string | undefined, maxLength: number) {
  return (value || "").trim().slice(0, maxLength);
}

function normalizeArray(values: string[] | undefined) {
  return (values || []).map((value) => value.trim()).filter(Boolean).slice(0, 8);
}

function toAssetKind(kind: EvidenceAssetInput["assetKind"]) {
  return EvidenceAssetKind[kind];
}

function resolveEvidenceStorageKey(asset: EvidenceAssetInput, index: number, prefix: string) {
  if (asset.storageKey) {
    return asset.storageKey;
  }

  return `pending://${prefix}/${Date.now()}-${index}-${asset.fileName}`;
}

function severityFromAi(value: string) {
  return SeverityLevel[value as keyof typeof SeverityLevel] || SeverityLevel.MEDIUM;
}

function mapFailureReport(record: {
  id: string;
  title: string;
  summary: string;
  anonymousAlias: string | null;
  aiSeverity: SeverityLevel;
  aiPriorityScore: number;
  aiSummary: string | null;
  lifecycleStatus: IntakeLifecycleStatus;
  pressReleaseDraft: string | null;
  createdAt: Date;
  authority: { name: string; category: string; slug: string } | null;
  official: { fullName: string } | null;
  evidenceAssets: Array<{ id: string }>;
}): FailureReportView {
  return {
    id: record.id,
    title: record.title,
    summary: record.summary,
    authorityName: record.authority?.name || undefined,
    authorityCategory: record.authority?.category || undefined,
    authoritySlug: record.authority?.slug || undefined,
    officialName: record.official?.fullName || undefined,
    anonymousAlias: record.anonymousAlias || undefined,
    aiSeverity: record.aiSeverity,
    aiPriorityScore: record.aiPriorityScore,
    aiSummary: record.aiSummary || undefined,
    lifecycleStatus: record.lifecycleStatus,
    pressReleaseDraft: record.pressReleaseDraft || undefined,
    evidenceCount: record.evidenceAssets.length,
    createdAt: record.createdAt.toISOString(),
  };
}

export async function listAuthorityFailureReports(limit = 6): Promise<FailureReportView[]> {
  const prisma = getPrismaClient();
  if (!prisma) {
    return [];
  }

  const records = await prisma.authorityFailureReport.findMany({
    where: {
      OR: [
        { lifecycleStatus: IntakeLifecycleStatus.PUBLISHED },
        { lifecycleStatus: IntakeLifecycleStatus.LEGAL_REVIEW },
      ],
    },
    include: {
      authority: { select: { name: true, category: true, slug: true } },
      official: { select: { fullName: true } },
      evidenceAssets: { select: { id: true } },
    },
    orderBy: [{ aiPriorityScore: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return records.map(mapFailureReport);
}

export async function getAuthorityFailureReportById(id: string): Promise<FailureReportView | null> {
  const prisma = getPrismaClient();
  if (!prisma) {
    return null;
  }

  const record = await prisma.authorityFailureReport.findUnique({
    where: { id },
    include: {
      authority: { select: { name: true, category: true, slug: true } },
      official: { select: { fullName: true } },
      evidenceAssets: { select: { id: true } },
    },
  });

  return record ? mapFailureReport(record) : null;
}

export async function createAuthorityFailureReport(input: FailureReportInput, actor: ActorContext): Promise<FailureReportView> {
  const title = normalizeText(input.title, 160);
  const summary = normalizeText(input.summary, 4000);
  if (!title || !summary) {
    throw new Error("Titel och sammanfattning krävs.");
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    throw new Error("DATABASE_URL saknas. Granskningsärenden kräver databaspersistens.");
  }

  const triage = await requestFailureTriage({
    title,
    summary,
    countryCode: input.countryCode || "SE",
    locale: "sv-SE",
    evidence: input.evidence,
  });
  const pressRelease = await requestPressReleaseDraft({
    title,
    summary,
    severity: triage.severity,
    locale: "sv-SE",
  });

  const record = await prisma.authorityFailureReport.create({
    data: {
      authorityId: input.authorityId,
      officialId: input.officialId,
      submittedByUserId: actor.userId,
      countryCode: input.countryCode || "SE",
      regionCode: input.regionCode || null,
      anonymousAlias: normalizeText(input.anonymousAlias, 80) || null,
      reporterFingerprintHash: hashFingerprint(actor.fingerprintSource),
      title,
      summary,
      incidentDate: input.incidentDate ? new Date(input.incidentDate) : null,
      lifecycleStatus: IntakeLifecycleStatus.AI_TRIAGED,
      aiSeverity: severityFromAi(triage.severity),
      aiPriorityScore: triage.priorityScore,
      aiSummary: triage.summary,
      pressReleaseDraft: pressRelease.bodyMarkdown,
      moderationDecision: ModerationDecision.PENDING,
      legalReviewDecision: ModerationDecision.PENDING,
      evidenceAssets: {
        create: input.evidence.map((asset, index) => ({
          assetKind: toAssetKind(asset.assetKind),
          fileName: normalizeText(asset.fileName, 180),
          mimeType: normalizeText(asset.mimeType, 140),
          byteSize: asset.byteSize,
          storageKey: resolveEvidenceStorageKey(asset, index, "failure"),
          extractedText: asset.extractedText?.slice(0, 5000),
        })),
      },
      reviewItems: {
        create: {
          targetType: "authority_failure_report",
          status: IntakeLifecycleStatus.MODERATION,
        },
      },
    },
    include: {
      authority: { select: { name: true, category: true, slug: true } },
      official: { select: { fullName: true } },
      evidenceAssets: { select: { id: true } },
    },
  });

  return mapFailureReport(record);
}

export async function getConfidenceBoard(limit = 10): Promise<ConfidenceBoardEntry[]> {
  const prisma = getPrismaClient();
  if (!prisma) {
    return [];
  }

  const [votes, testimonials] = await Promise.all([
    prisma.officialConfidenceVote.findMany({
      include: {
        authority: { select: { id: true, name: true } },
        official: { select: { id: true, fullName: true, authority: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 600,
    }),
    prisma.confidenceTestimonial.findMany({
      where: { moderationDecision: ModerationDecision.APPROVED },
      select: { authorityId: true, officialId: true },
      take: 300,
    }),
  ]);

  const now = Date.now();
  const currentWindowStart = now - 30 * 24 * 60 * 60 * 1000;
  const previousWindowStart = now - 60 * 24 * 60 * 60 * 1000;
  const entries = new Map<string, ConfidenceBoardEntry & { currentDelta: number; previousDelta: number }>();

  for (const vote of votes) {
    const kind = vote.officialId ? "official" : "authority";
    const targetId = vote.officialId || vote.authorityId;
    if (!targetId) {
      continue;
    }

    const targetLabel = vote.official
      ? `${vote.official.fullName}, ${vote.official.authority.name}`
      : vote.authority?.name || "Okänd aktör";
    const current = entries.get(targetId) || {
      targetId,
      targetLabel,
      kind,
      confidenceScore: 50,
      upvotes: 0,
      downvotes: 0,
      testimonials: 0,
      trend: 0,
      currentDelta: 0,
      previousDelta: 0,
    };

    if (vote.direction === TrustVoteDirection.UP) {
      current.upvotes += 1;
    } else {
      current.downvotes += 1;
    }

    const createdAt = vote.createdAt.getTime();
    if (createdAt >= currentWindowStart) {
      current.currentDelta += vote.direction === TrustVoteDirection.UP ? 1 : -1;
    } else if (createdAt >= previousWindowStart) {
      current.previousDelta += vote.direction === TrustVoteDirection.UP ? 1 : -1;
    }

    entries.set(targetId, current);
  }

  for (const testimonial of testimonials) {
    const targetId = testimonial.officialId || testimonial.authorityId;
    if (!targetId) {
      continue;
    }

    const current = entries.get(targetId);
    if (current) {
      current.testimonials += 1;
    }
  }

  return Array.from(entries.values())
    .map((entry) => {
      const totalVotes = entry.upvotes + entry.downvotes;
      return {
        targetId: entry.targetId,
        targetLabel: entry.targetLabel,
        kind: entry.kind,
        upvotes: entry.upvotes,
        downvotes: entry.downvotes,
        testimonials: entry.testimonials,
        confidenceScore: totalVotes === 0 ? 50 : Math.round((entry.upvotes / totalVotes) * 100),
        trend: entry.currentDelta - entry.previousDelta,
      } satisfies ConfidenceBoardEntry;
    })
    .sort((left, right) => left.confidenceScore - right.confidenceScore)
    .slice(0, limit);
}

export async function submitConfidenceVote(input: ConfidenceVoteInput, actor: ActorContext) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new Error("DATABASE_URL saknas. Röster kräver databaspersistens.");
  }

  await prisma.officialConfidenceVote.create({
    data: {
      authorityId: input.authorityId,
      officialId: input.officialId,
      userId: actor.userId,
      countryCode: input.countryCode || "SE",
      regionCode: input.regionCode || null,
      anonymousAlias: normalizeText(input.anonymousAlias, 80) || null,
      voterFingerprintHash: hashFingerprint(actor.fingerprintSource),
      direction: input.direction === "UP" ? TrustVoteDirection.UP : TrustVoteDirection.DOWN,
    },
  });

  return { ok: true };
}

export async function submitConfidenceTestimonial(input: ConfidenceTestimonialInput, actor: ActorContext) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new Error("DATABASE_URL saknas. Vittnesmål kräver databaspersistens.");
  }

  await prisma.confidenceTestimonial.create({
    data: {
      authorityId: input.authorityId,
      officialId: input.officialId,
      countryCode: input.countryCode || "SE",
      regionCode: input.regionCode || null,
      anonymousAlias: normalizeText(input.anonymousAlias, 80) || null,
      authorFingerprintHash: hashFingerprint(actor.fingerprintSource),
      headline: normalizeText(input.headline, 140),
      body: normalizeText(input.body, 3000),
      moderationDecision: ModerationDecision.PENDING,
    },
  });

  return { ok: true };
}

export async function listWikiPages(limit = 10): Promise<WikiPageView[]> {
  const prisma = getPrismaClient();
  if (!prisma) {
    return [];
  }

  const pages = await prisma.loopholeWikiPage.findMany({
    where: { status: { in: ["PUBLISHED", "DRAFT"] } },
    include: {
      revisions: {
        where: { moderationDecision: ModerationDecision.APPROVED },
        orderBy: { revisionNumber: "desc" },
        take: 1,
      },
      votes: { select: { value: true } },
      _count: { select: { revisions: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  return pages.map((page) => ({
    id: page.id,
    slug: page.slug,
    title: page.title,
    summary: page.summary,
    category: page.category,
    tags: page.tags,
    score: page.votes.reduce((sum, vote) => sum + vote.value, 0),
    revisionCount: page._count.revisions,
    latestExcerpt: page.revisions[0]?.bodyMarkdown.slice(0, 180) || page.summary,
  }));
}

export async function createWikiDraft(input: WikiDraftInput, actor: ActorContext) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new Error("DATABASE_URL saknas. Wikiutkast kräver databaspersistens.");
  }

  const slug = normalizeText(input.slug, 80)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/(^-|-$)/g, "");

  await prisma.loopholeWikiPage.create({
    data: {
      slug,
      title: normalizeText(input.title, 140),
      summary: normalizeText(input.summary, 500),
      category: normalizeText(input.category, 80),
      tags: normalizeArray(input.tags),
      countryCode: input.countryCode || "SE",
      regionCode: input.regionCode || null,
      locale: input.locale || "sv-SE",
      status: "DRAFT",
      revisions: {
        create: {
          authorUserId: actor.userId,
          anonymousAlias: normalizeText(input.anonymousAlias, 80) || null,
          revisionNumber: 1,
          title: normalizeText(input.title, 140),
          bodyMarkdown: normalizeText(input.bodyMarkdown, 12000),
          changeSummary: normalizeText(input.changeSummary, 260) || null,
          moderationDecision: ModerationDecision.PENDING,
          reviewItems: {
            create: {
              targetType: "wiki_revision",
              status: IntakeLifecycleStatus.MODERATION,
            },
          },
        },
      },
    },
  });

  return { ok: true };
}

function choosePrimaryArtifact(bundle: AutomatedAppealResult) {
  return bundle.artifacts[0];
}

function artifactKindFromAi(kind: AutomatedAppealResult["artifacts"][number]["kind"]) {
  return AppealArtifactKind[kind];
}

export async function listAutomatedAppealJobs(limit = 6): Promise<AutomatedAppealView[]> {
  const prisma = getPrismaClient();
  if (!prisma) {
    return [];
  }

  const records = await prisma.automatedAppealJob.findMany({
    include: {
      generatedArtifacts: true,
      massAppealBatch: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return records.map((record) => ({
    id: record.id,
    sourceTitle: record.sourceTitle,
    parsedDecisionSummary: record.parsedDecisionSummary || undefined,
    riskSummary: record.aiRiskSummary || undefined,
    status: record.status,
    artifactCount: record.generatedArtifacts.length,
    submittedBatchId: record.massAppealBatch?.id,
    createdAt: record.createdAt.toISOString(),
    artifacts: record.generatedArtifacts.map((artifact) => ({
      id: artifact.id,
      kind: artifact.artifactKind,
      title: artifact.title,
      subjectLine: artifact.subjectLine,
      body: artifact.body,
    })),
  }));
}

export async function createAutomatedAppealJob(input: AutomatedAppealInput, actor: ActorContext): Promise<AutomatedAppealView> {
  const sourceTitle = normalizeText(input.sourceTitle, 180);
  const sourceSummary = normalizeText(input.sourceSummary, 5000);
  if (!sourceTitle || !sourceSummary) {
    throw new Error("Beslutstitel och sammanfattning krävs.");
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    throw new Error("DATABASE_URL saknas. Automatiserade överklaganden kräver databaspersistens.");
  }

  const bundle = await requestAutomatedAppealBundle({
    sourceTitle,
    sourceSummary,
    locale: input.locale || "sv-SE",
    countryCode: input.countryCode || "SE",
  });

  let batchId: string | undefined;

  const primaryArtifact = choosePrimaryArtifact(bundle);
  if (input.submissionMode === "submit" && input.senderEmail && input.selectedAuthorityIds && input.selectedAuthorityIds.length > 0) {
    const sentBatch = await sendMassAppeal(
      {
        appealType: primaryArtifact.suggestedAppealType,
        senderName: input.senderName || "",
        senderEmail: input.senderEmail,
        senderRole: input.senderRole || "",
        region: input.region || "Nationell",
        subject: primaryArtifact.title,
        caseReference: "",
        incidentSummary: bundle.parsedDecisionSummary,
        requestedAction: primaryArtifact.body,
        legalBasis: bundle.riskSummary,
        selectedAuthorityIds: input.selectedAuthorityIds,
        billingModel: "payg",
        urgency: "standard",
      },
      {
        actorKey: actor.fingerprintSource || input.senderEmail,
        ipAddress: actor.ipAddress,
        user: actor.userId && actor.email && actor.subscriptionTier
          ? { id: actor.userId, email: actor.email, subscriptionTier: actor.subscriptionTier }
          : null,
      },
    );
    batchId = sentBatch.id;
  }

  const record = await prisma.automatedAppealJob.create({
    data: {
      userId: actor.userId,
      authorityId: input.authorityId,
      officialId: input.officialId,
      massAppealBatchId: batchId,
      countryCode: input.countryCode || "SE",
      regionCode: input.regionCode || null,
      locale: input.locale || "sv-SE",
      sourceTitle,
      sourceSummary,
      parsedDecisionSummary: bundle.parsedDecisionSummary,
      aiRiskSummary: bundle.riskSummary,
      status: batchId ? AppealAutomationStatus.SUBMITTED : AppealAutomationStatus.DRAFTED,
      submissionMode: input.submissionMode || "draft",
      priceSek: batchId ? 39 : 0,
      sourceAssets: {
        create: input.evidence.map((asset, index) => ({
          assetKind: toAssetKind(asset.assetKind),
          fileName: normalizeText(asset.fileName, 180),
          mimeType: normalizeText(asset.mimeType, 140),
          byteSize: asset.byteSize,
          storageKey: resolveEvidenceStorageKey(asset, index, "appeals"),
          extractedText: asset.extractedText?.slice(0, 5000),
        })),
      },
      generatedArtifacts: {
        create: bundle.artifacts.map((artifact) => ({
          artifactKind: artifactKindFromAi(artifact.kind),
          title: artifact.title,
          subjectLine: artifact.subjectLine,
          body: artifact.body,
          targetAuthorities: normalizeArray(input.selectedAuthorityIds),
        })),
      },
    },
    include: {
      generatedArtifacts: true,
      massAppealBatch: { select: { id: true } },
    },
  });

  return {
    id: record.id,
    sourceTitle: record.sourceTitle,
    parsedDecisionSummary: record.parsedDecisionSummary || undefined,
    riskSummary: record.aiRiskSummary || undefined,
    status: record.status,
    artifactCount: record.generatedArtifacts.length,
    submittedBatchId: record.massAppealBatch?.id,
    createdAt: record.createdAt.toISOString(),
    artifacts: record.generatedArtifacts.map((artifact) => ({
      id: artifact.id,
      kind: artifact.artifactKind,
      title: artifact.title,
      subjectLine: artifact.subjectLine,
      body: artifact.body,
    })),
  };
}