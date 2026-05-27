import { getPrismaClient } from "@/lib/prisma";

export async function getAccountOverview(userId: string) {
  const prisma = getPrismaClient();
  if (!prisma) {
    return { batches: 0, reports: 0, videos: 0, wiki: 0, tax: 0, watches: 0 };
  }

  const [batches, reports, videos, wiki, tax, watches] = await Promise.all([
    prisma.massAppealBatch.count({ where: { userId } }),
    prisma.authorityFailureReport.count({ where: { submittedByUserId: userId } }),
    prisma.reverseSurveillanceSubmission.count(),
    prisma.loopholeWikiRevision.count({ where: { authorUserId: userId } }),
    prisma.aiAnalysisJob.count({ where: { userId, featureKey: "tax.optimize" } }),
    prisma.watch.count({ where: { userId } }),
  ]);

  return { batches, reports, videos, wiki, tax, watches };
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
