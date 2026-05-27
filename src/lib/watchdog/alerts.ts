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
    if (!authorityId) continue;

    const watches = await prisma.watch.findMany({
      where: {
        authorityId,
        alertsEnabled: true,
      },
      select: { userId: true },
    });

    if (watches.length === 0) continue;

    await prisma.alert.create({
      data: {
        authorityId,
        severity: AlertSeverity.MEDIUM,
        title: record.official ? `Ny offentlig post: ${record.official.fullName}` : record.title,
        summary: record.summary.slice(0, 500),
      },
    });

    alertsCreated += 1;
  }

  return { alertsCreated };
}
