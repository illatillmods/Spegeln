import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { PublicRecordCategory, SourceKind } from "@prisma/client";

export type NormalizedRecordDraft = {
  category: PublicRecordCategory;
  title: string;
  summary: string;
  payload?: Record<string, unknown>;
  occurredAt?: Date;
  sourceKind: SourceKind;
  sourceUrl?: string;
  sourceRecordId?: string;
  legalBasis?: string;
  connectorKey: string;
  officialId?: string;
  authorityId?: string;
  identity?: {
    sourceKey: string;
    externalId: string;
    profileUrl?: string;
  };
  officialHint?: {
    fullName: string;
    title: string;
    authoritySlug: string;
    authorityName: string;
    category?: import("@prisma/client").OfficialCategory;
    photoUrl?: string;
  };
};

export function buildContentHash(draft: Pick<NormalizedRecordDraft, "title" | "summary" | "category" | "sourceRecordId" | "connectorKey">) {
  const payload = [
    draft.connectorKey,
    draft.category,
    draft.title.trim(),
    draft.summary.trim(),
    draft.sourceRecordId || "",
  ].join("|");

  return createHash("sha256").update(payload).digest("hex");
}

export async function upsertPublicRecord(prisma: PrismaClient, draft: NormalizedRecordDraft) {
  const contentHash = buildContentHash(draft);

  const existing = await prisma.publicRecord.findUnique({
    where: {
      connectorKey_contentHash: {
        connectorKey: draft.connectorKey,
        contentHash,
      },
    },
  });

  if (existing) {
    return { record: existing, created: false };
  }

  const record = await prisma.publicRecord.create({
    data: {
      category: draft.category,
      title: draft.title,
      summary: draft.summary,
      payload: draft.payload as import("@prisma/client").Prisma.InputJsonValue | undefined,
      occurredAt: draft.occurredAt,
      sourceKind: draft.sourceKind,
      sourceUrl: draft.sourceUrl,
      sourceRecordId: draft.sourceRecordId,
      legalBasis: draft.legalBasis,
      contentHash,
      connectorKey: draft.connectorKey,
      officialId: draft.officialId,
      authorityId: draft.authorityId,
    },
  });

  return { record, created: true };
}

export async function persistRecordDrafts(prisma: PrismaClient, drafts: NormalizedRecordDraft[]) {
  let recordsCreated = 0;
  let recordsSkipped = 0;
  const newRecordIds: string[] = [];

  for (const draft of drafts) {
    const { record, created } = await upsertPublicRecord(prisma, draft);
    if (created) {
      recordsCreated += 1;
      newRecordIds.push(record.id);
    } else {
      recordsSkipped += 1;
    }
  }

  return { recordsCreated, recordsSkipped, newRecordIds };
}

export function maskPrivateAddress(text: string) {
  const streetPattern = /\b([A-ZÅÄÖ][a-zåäö]+(?:gatan|vägen|stigen|torget|plan))\s+\d+[A-Za-z]?\b/g;
  return text.replace(streetPattern, "[maskerad adress]");
}

export function sanitizeRecordText(text: string) {
  return maskPrivateAddress(text.trim().replace(/\s+/g, " "));
}
