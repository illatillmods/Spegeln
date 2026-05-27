import { IntakeLifecycleStatus } from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";

export type PressFeedItem = {
  id: string;
  title: string;
  summary: string;
  aiSeverity: string;
  aiPriorityScore: number;
  pressReleaseDraft?: string;
  authorityName?: string;
  officialName?: string;
  publishedAt: string;
  reportUrl: string;
};

export async function listPressFeed(limit = 20): Promise<PressFeedItem[]> {
  const prisma = getPrismaClient();
  if (!prisma) {
    return [];
  }

  const records = await prisma.authorityFailureReport.findMany({
    where: { lifecycleStatus: IntakeLifecycleStatus.PUBLISHED },
    include: {
      authority: { select: { name: true } },
      official: { select: { fullName: true } },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return records.map((record) => ({
    id: record.id,
    title: record.title,
    summary: record.summary,
    aiSeverity: record.aiSeverity,
    aiPriorityScore: record.aiPriorityScore,
    pressReleaseDraft: record.pressReleaseDraft || undefined,
    authorityName: record.authority?.name || undefined,
    officialName: record.official?.fullName || undefined,
    publishedAt: (record.publishedAt || record.createdAt).toISOString(),
    reportUrl: `/rapporter/${record.id}`,
  }));
}
