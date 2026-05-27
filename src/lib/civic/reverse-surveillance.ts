import { createHash } from "node:crypto";
import { EvidenceAssetKind, IntakeLifecycleStatus, type Prisma } from "@prisma/client";
import { requestReverseSurveillancePlan, type EvidenceManifest } from "@/lib/ai-worker";
import { getPrismaClient } from "@/lib/prisma";

export type ReverseSurveillanceInput = {
  authorityId?: string;
  officialId?: string;
  title: string;
  summary: string;
  anonymousAlias?: string;
  countryCode?: string;
  regionCode?: string;
  evidence: EvidenceManifest[];
};

export type ReverseSurveillanceView = {
  id: string;
  title: string;
  summary: string;
  authorityName?: string;
  authorityCategory?: string;
  authoritySlug?: string;
  officialName?: string;
  redactionStatus: string;
  redactionPolicy: string;
  riskSummary: string;
  socialCaption: string;
  lifecycleStatus: string;
  createdAt: string;
  evidenceAssets?: Array<{ id: string; fileName: string; mimeType: string; storageKey: string }>;
};

type ActorContext = {
  fingerprintSource?: string;
  ipAddress?: string | null;
};

function hashFingerprint(source?: string | null) {
  if (!source) return null;
  return createHash("sha256").update(source).digest("hex");
}

function normalizeText(value: string | undefined, maxLength: number) {
  return (value || "").trim().slice(0, maxLength);
}

function toAssetKind(kind: EvidenceManifest["assetKind"]) {
  return EvidenceAssetKind[kind];
}

function resolveStorageKey(asset: EvidenceManifest, index: number) {
  if (asset.storageKey) {
    return asset.storageKey;
  }

  return `pending://reverse/${Date.now()}-${index}-${asset.fileName}`;
}

function mapReverseRecord(record: {
  id: string;
  title: string;
  summary: string;
  redactionStatus: string;
  redactionPolicy: string;
  lifecycleStatus: string;
  sharePack: Prisma.JsonValue;
  createdAt: Date;
  authority: { name: string; category: string; slug: string } | null;
  official: { fullName: string } | null;
}): ReverseSurveillanceView {
  const sharePack = record.sharePack as Prisma.JsonObject | null;
  return {
    id: record.id,
    title: record.title,
    summary: record.summary,
    authorityName: record.authority?.name || undefined,
    authorityCategory: record.authority?.category || undefined,
    authoritySlug: record.authority?.slug || undefined,
    officialName: record.official?.fullName || undefined,
    redactionStatus: record.redactionStatus,
    redactionPolicy: record.redactionPolicy,
    riskSummary: typeof sharePack?.riskSummary === "string" ? sharePack.riskSummary : "Manuell verifiering krävs innan delning.",
    socialCaption: typeof sharePack?.socialCaption === "string" ? sharePack.socialCaption : "Nytt material i verifieringskön.",
    lifecycleStatus: record.lifecycleStatus,
    createdAt: record.createdAt.toISOString(),
  };
}

export async function listReverseSurveillance(limit = 6): Promise<ReverseSurveillanceView[]> {
  const prisma = getPrismaClient();
  if (!prisma) return [];

  const records = await prisma.reverseSurveillanceSubmission.findMany({
    include: {
      authority: { select: { name: true, category: true, slug: true } },
      official: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return records.map(mapReverseRecord);
}

export async function getReverseSurveillanceById(id: string): Promise<ReverseSurveillanceView | null> {
  const prisma = getPrismaClient();
  if (!prisma) return null;

  const record = await prisma.reverseSurveillanceSubmission.findUnique({
    where: { id },
    include: {
      authority: { select: { name: true, category: true, slug: true } },
      official: { select: { fullName: true } },
      evidenceAssets: { select: { id: true, fileName: true, mimeType: true, storageKey: true } },
    },
  });

  if (!record) return null;

  return {
    ...mapReverseRecord(record),
    evidenceAssets: record.evidenceAssets.map((asset) => ({
      id: asset.id,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      storageKey: asset.storageKey,
    })),
  };
}

export async function createReverseSurveillanceSubmission(
  input: ReverseSurveillanceInput,
  actor: ActorContext,
): Promise<ReverseSurveillanceView> {
  const title = normalizeText(input.title, 160);
  const summary = normalizeText(input.summary, 4000);
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("DATABASE_URL saknas. Videosubmissions kräver databaspersistens.");
  }

  const plan = await requestReverseSurveillancePlan({
    title,
    summary,
    locale: "sv-SE",
    evidence: input.evidence,
  });

  const record = await prisma.reverseSurveillanceSubmission.create({
    data: {
      authorityId: input.authorityId,
      officialId: input.officialId,
      countryCode: input.countryCode || "SE",
      regionCode: input.regionCode || null,
      anonymousAlias: normalizeText(input.anonymousAlias, 80) || null,
      uploaderFingerprintHash: hashFingerprint(actor.fingerprintSource),
      title,
      summary,
      lifecycleStatus: IntakeLifecycleStatus.LEGAL_REVIEW,
      redactionStatus: "PROCESSING",
      redactionPolicy: plan.redactionPolicy,
      sharePack: {
        riskSummary: plan.riskSummary,
        socialCaption: plan.sharePack.socialCaption,
        pressHeadline: plan.sharePack.pressHeadline,
        alertText: plan.sharePack.alertText,
      },
      evidenceAssets: {
        create: input.evidence.map((asset, index) => ({
          assetKind: toAssetKind(asset.assetKind),
          fileName: normalizeText(asset.fileName, 180),
          mimeType: normalizeText(asset.mimeType, 140),
          byteSize: asset.byteSize,
          storageKey: resolveStorageKey(asset, index),
          extractedText: asset.extractedText?.slice(0, 5000),
        })),
      },
      reviewItems: {
        create: {
          targetType: "reverse_surveillance_submission",
          status: IntakeLifecycleStatus.LEGAL_REVIEW,
        },
      },
    },
    include: {
      authority: { select: { name: true, category: true, slug: true } },
      official: { select: { fullName: true } },
    },
  });

  return mapReverseRecord(record);
}
