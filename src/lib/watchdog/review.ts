import { IngestReviewStatus } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { upsertOfficialFromRow } from "@/lib/watchdog-import";
import { persistRecordDrafts } from "@/lib/watchdog/records";
import { PublicRecordCategory, SourceKind } from "@prisma/client";

export async function approveIngestReviewItem(prisma: PrismaClient, itemId: string) {
  const item = await prisma.ingestReviewItem.findUnique({ where: { id: itemId } });
  if (!item || item.status !== IngestReviewStatus.PENDING) {
    throw new Error("Granskningsposten hittades inte eller är redan hanterad.");
  }

  let officialId: string | undefined;
  let authorityId: string | undefined;

  if (item.suggestedName && item.authoritySlug) {
    const authority = await prisma.authority.findUnique({ where: { slug: item.authoritySlug } });
    if (authority) {
      const { official } = await upsertOfficialFromRow(
        prisma,
        {
          authorityName: authority.name,
          authoritySlug: authority.slug,
          officialName: item.suggestedName,
          officialTitle: item.suggestedTitle || "Offentlig roll",
        },
        authority.id,
      );
      officialId = official.id;
      authorityId = authority.id;
    }
  }

  const { recordsCreated } = await persistRecordDrafts(prisma, [
    {
      connectorKey: item.connectorKey,
      category: PublicRecordCategory.OTHER,
      title: item.title,
      summary: item.summary,
      payload: item.payload ? (item.payload as Record<string, unknown>) : undefined,
      sourceKind: SourceKind.PUBLIC_REGISTRY,
      officialId,
      authorityId,
    },
  ]);

  await prisma.ingestReviewItem.update({
    where: { id: itemId },
    data: { status: IngestReviewStatus.APPROVED },
  });

  return { approved: true, recordsCreated, officialId };
}

export async function rejectIngestReviewItem(prisma: PrismaClient, itemId: string) {
  const item = await prisma.ingestReviewItem.findUnique({ where: { id: itemId } });
  if (!item || item.status !== IngestReviewStatus.PENDING) {
    throw new Error("Granskningsposten hittades inte eller är redan hanterad.");
  }

  await prisma.ingestReviewItem.update({
    where: { id: itemId },
    data: { status: IngestReviewStatus.REJECTED },
  });

  return { rejected: true };
}
