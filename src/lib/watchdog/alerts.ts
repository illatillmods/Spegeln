import { AlertSeverity } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

export async function emitIngestAlerts(prisma: PrismaClient, newRecordIds: string[]) {
  if (newRecordIds.length === 0) {
    return { alertsCreated: 0 };
  }

  const records = await prisma.publicRecord.findMany({
    where: { id: { in: newRecordIds } },
    include: {
      official: {
        select: {
          id: true,
          fullName: true,
          authorityId: true,
        },
      },
    },
  });

  let alertsCreated = 0;

  for (const record of records) {
    const authorityId = record.authorityId || record.official?.authorityId;
    const officialId = record.officialId || record.official?.id;

    const watchFilters = [
      ...(authorityId ? [{ authorityId, officialId: null as string | null }] : []),
      ...(officialId ? [{ officialId }] : []),
    ];

    if (watchFilters.length === 0) continue;

    const watches = await prisma.watch.findMany({
      where: {
        alertsEnabled: true,
        OR: watchFilters,
      },
      select: { userId: true, authorityId: true, officialId: true },
    });

    if (watches.length === 0) continue;

    const existing = await prisma.alert.findFirst({
      where: {
        authorityId: authorityId || watches[0].authorityId,
        title: record.official ? `Ny offentlig post: ${record.official.fullName}` : record.title,
        detectedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });

    if (existing) continue;

    await prisma.alert.create({
      data: {
        authorityId: authorityId || watches[0].authorityId,
        severity: AlertSeverity.MEDIUM,
        title: record.official ? `Ny offentlig post: ${record.official.fullName}` : record.title,
        summary: record.summary.slice(0, 500),
      },
    });

    alertsCreated += 1;
  }

  return { alertsCreated };
}
