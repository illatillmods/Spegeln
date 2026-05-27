import { getPrismaClient } from "@/lib/prisma";

export type AccountNotification = {
  id: string;
  kind: "batch" | "report" | "appeal" | "video" | "wiki";
  title: string;
  summary: string;
  href: string;
  createdAt: string;
  status: string;
};

export async function getAccountOverview(userId: string) {
  const prisma = getPrismaClient();
  if (!prisma) {
    return { batches: 0, reports: 0, videos: 0, wiki: 0, tax: 0, watches: 0 };
  }

  const [batches, reports, videos, wiki, tax, watches] = await Promise.all([
    prisma.massAppealBatch.count({ where: { userId } }),
    prisma.authorityFailureReport.count({ where: { submittedByUserId: userId } }),
    prisma.reverseSurveillanceSubmission.count({ where: { uploaderFingerprintHash: { not: null } } }),
    prisma.loopholeWikiRevision.count({ where: { authorUserId: userId } }),
    prisma.aiAnalysisJob.count({ where: { userId, featureKey: "tax.optimize" } }),
    prisma.watch.count({ where: { userId } }),
  ]);

  return { batches, reports, videos, wiki, tax, watches };
}

export async function listAccountNotifications(userId: string, limit = 12): Promise<AccountNotification[]> {
  const prisma = getPrismaClient();
  if (!prisma) {
    return [];
  }

  const [batches, reports, appeals, wikiRevisions] = await Promise.all([
    prisma.massAppealBatch.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, deliveryMode: true, createdAt: true, appealType: true },
    }),
    prisma.authorityFailureReport.findMany({
      where: { submittedByUserId: userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, title: true, lifecycleStatus: true, createdAt: true },
    }),
    prisma.automatedAppealJob.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, sourceTitle: true, status: true, createdAt: true },
    }),
    prisma.loopholeWikiRevision.findMany({
      where: { authorUserId: userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        moderationDecision: true,
        createdAt: true,
        page: { select: { slug: true } },
      },
    }),
  ]);

  const notifications: AccountNotification[] = [
    ...batches.map((batch) => ({
      id: `batch-${batch.id}`,
      kind: "batch" as const,
      title: `Massutskick: ${batch.appealType}`,
      summary: `Utskick via ${batch.deliveryMode}.`,
      href: "/byrakrati-bombaren",
      createdAt: batch.createdAt.toISOString(),
      status: batch.deliveryMode,
    })),
    ...reports.map((report) => ({
      id: `report-${report.id}`,
      kind: "report" as const,
      title: report.title,
      summary: `Rapportstatus ${report.lifecycleStatus}.`,
      href: `/rapporter/${report.id}`,
      createdAt: report.createdAt.toISOString(),
      status: report.lifecycleStatus,
    })),
    ...appeals.map((appeal) => ({
      id: `appeal-${appeal.id}`,
      kind: "appeal" as const,
      title: appeal.sourceTitle,
      summary: `Överklagandestatus ${appeal.status}.`,
      href: "/automatiserad-overklagare",
      createdAt: appeal.createdAt.toISOString(),
      status: appeal.status,
    })),
    ...wikiRevisions.map((revision) => ({
      id: `wiki-${revision.id}`,
      kind: "wiki" as const,
      title: revision.title,
      summary: `Wiki-revision ${revision.moderationDecision}.`,
      href: `/statens-svagheter/${revision.page.slug}`,
      createdAt: revision.createdAt.toISOString(),
      status: revision.moderationDecision,
    })),
  ];

  return notifications
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, limit);
}

export async function listUserWatches(userId: string) {
  const prisma = getPrismaClient();
  if (!prisma) {
    return [];
  }

  const watches = await prisma.watch.findMany({
    where: { userId },
    include: { authority: { select: { id: true, name: true, slug: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return watches.map((watch) => ({
    id: watch.id,
    authorityId: watch.authorityId,
    authorityName: watch.authority.name,
    authoritySlug: watch.authority.slug,
    cadence: watch.cadence,
    alertsEnabled: watch.alertsEnabled,
    updatedAt: watch.updatedAt.toISOString(),
  }));
}

export async function upsertUserWatch(input: {
  userId: string;
  authorityId: string;
  cadence: "DAILY" | "HOURLY" | "REALTIME";
  alertsEnabled?: boolean;
}) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new Error("DATABASE_URL saknas.");
  }

  return prisma.watch.upsert({
    where: {
      userId_authorityId: {
        userId: input.userId,
        authorityId: input.authorityId,
      },
    },
    update: {
      cadence: input.cadence,
      alertsEnabled: input.alertsEnabled ?? true,
    },
    create: {
      userId: input.userId,
      authorityId: input.authorityId,
      cadence: input.cadence,
      alertsEnabled: input.alertsEnabled ?? true,
    },
  });
}

export async function deleteUserWatch(userId: string, watchId: string) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new Error("DATABASE_URL saknas.");
  }

  await prisma.watch.deleteMany({
    where: { id: watchId, userId },
  });

  return { ok: true };
}
