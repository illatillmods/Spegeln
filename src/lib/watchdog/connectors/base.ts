import type { PrismaClient } from "@prisma/client";
import { IngestRunStatus } from "@prisma/client";
import type { NormalizedRecordDraft } from "@/lib/watchdog/records";
import { persistRecordDrafts } from "@/lib/watchdog/records";
import { resolveRecordDrafts } from "@/lib/watchdog/entity-resolver";
import { emitIngestAlerts } from "@/lib/watchdog/alerts";

export type ConnectorContext = {
  prisma: PrismaClient;
  rateLimitMs: number;
};

export type ConnectorRunResult = {
  connectorKey: string;
  recordsCreated: number;
  recordsSkipped: number;
  error?: string;
  newRecordIds: string[];
};

export type WatchdogConnector = {
  key: string;
  label: string;
  run: (context: ConnectorContext) => Promise<NormalizedRecordDraft[]>;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runConnector(connector: WatchdogConnector, context: ConnectorContext): Promise<ConnectorRunResult> {
  const run = await context.prisma.ingestRun.create({
    data: {
      connectorKey: connector.key,
      status: IngestRunStatus.RUNNING,
    },
  });

  try {
    const maxAttempts = 3;
    let lastError: Error | null = null;
    let drafts: NormalizedRecordDraft[] = [];

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        drafts = await connector.run(context);
        lastError = null;
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Connector misslyckades.");
        if (attempt < maxAttempts) {
          await sleep(context.rateLimitMs * attempt);
        }
      }
    }

    if (lastError) {
      throw lastError;
    }

    await sleep(context.rateLimitMs);

    const resolved = await resolveRecordDrafts(context.prisma, drafts);
    const { recordsCreated, recordsSkipped, newRecordIds } = await persistRecordDrafts(context.prisma, resolved);

    await context.prisma.ingestRun.update({
      where: { id: run.id },
      data: {
        status: IngestRunStatus.SUCCEEDED,
        recordsCreated,
        recordsSkipped,
        finishedAt: new Date(),
      },
    });

    await emitIngestAlerts(context.prisma, newRecordIds);

    return {
      connectorKey: connector.key,
      recordsCreated,
      recordsSkipped,
      newRecordIds,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connector misslyckades.";
    await context.prisma.ingestRun.update({
      where: { id: run.id },
      data: {
        status: IngestRunStatus.FAILED,
        error: message,
        finishedAt: new Date(),
      },
    });

    return {
      connectorKey: connector.key,
      recordsCreated: 0,
      recordsSkipped: 0,
      error: message,
      newRecordIds: [],
    };
  }
}
