import { getPrismaClient } from "@/lib/prisma";
import { runWatchdogIngestionFromUrl } from "@/lib/watchdog-ingestion";
import { runConnector, type ConnectorRunResult, type WatchdogConnector } from "@/lib/watchdog/connectors/base";
import { buildRiksdagDrafts, riksdagConnector } from "@/lib/watchdog/connectors/riksdag";
import { regeringConnector } from "@/lib/watchdog/connectors/regering";
import { domstolConnector } from "@/lib/watchdog/connectors/domstol";
import { bolagConnector } from "@/lib/watchdog/connectors/bolag";
import { upphandlingConnector } from "@/lib/watchdog/connectors/upphandling";
import { propertyConnector } from "@/lib/watchdog/connectors/property";
import { polisOpenConnector } from "@/lib/watchdog/connectors/polis-open";

const ALL_CONNECTORS: WatchdogConnector[] = [
  riksdagConnector,
  regeringConnector,
  domstolConnector,
  bolagConnector,
  upphandlingConnector,
  propertyConnector,
  polisOpenConnector,
];

export function getConfiguredConnectorKeys() {
  const raw = process.env.WATCHDOG_CONNECTORS?.trim();
  if (!raw) {
    return ALL_CONNECTORS.map((connector) => connector.key);
  }

  return raw
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
}

export function listWatchdogConnectors() {
  return ALL_CONNECTORS.map((connector) => ({
    key: connector.key,
    label: connector.label,
    enabled: getConfiguredConnectorKeys().includes(connector.key),
  }));
}

function getRateLimitMs() {
  const parsed = Number(process.env.INGEST_RATE_LIMIT_MS || "500");
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 500;
}

export async function runWatchdogOrchestrator(options?: {
  connectorKeys?: string[];
  riksdagTravelFromYear?: number;
  riksdagTravelToYear?: number;
}) {
  const prisma = getPrismaClient();
  if (!prisma) {
    return { skipped: true, reason: "DATABASE_URL saknas." };
  }

  const keys = options?.connectorKeys || getConfiguredConnectorKeys();
  const connectors = ALL_CONNECTORS.filter((connector) => keys.includes(connector.key));
  const context = {
    prisma,
    rateLimitMs: getRateLimitMs(),
  };

  if (options?.riksdagTravelFromYear && keys.includes("riksdag")) {
    const index = connectors.findIndex((connector) => connector.key === "riksdag");
    if (index >= 0) {
      connectors[index] = {
        ...riksdagConnector,
        async run(ctx) {
          return buildRiksdagDrafts(
            {
              travelFromYear: options.riksdagTravelFromYear,
              travelToYear: options.riksdagTravelToYear,
            },
            ctx.rateLimitMs,
          ).collect();
        },
      };
    }
  }

  const runs: ConnectorRunResult[] = [];
  let totalCreated = 0;
  let totalSkipped = 0;

  for (const connector of connectors) {
    const result = await runConnector(connector, context);
    runs.push(result);
    totalCreated += result.recordsCreated;
    totalSkipped += result.recordsSkipped;
  }

  let legacyImport: Awaited<ReturnType<typeof runWatchdogIngestionFromUrl>> | null = null;
  const legacyUrl = process.env.WATCHDOG_INGEST_URL?.trim();
  if (legacyUrl) {
    try {
      legacyImport = await runWatchdogIngestionFromUrl(legacyUrl);
    } catch (error) {
      runs.push({
        connectorKey: "legacy-json",
        recordsCreated: 0,
        recordsSkipped: 0,
        error: error instanceof Error ? error.message : "Legacy import misslyckades.",
        newRecordIds: [],
      });
    }
  }

  return {
    skipped: false,
    connectorsRun: runs.length,
    recordsCreated: totalCreated,
    recordsSkipped: totalSkipped,
    runs,
    legacyImport,
  };
}

export async function runWatchdogBackfill(fromYear = 2018) {
  return runWatchdogOrchestrator({
    connectorKeys: ["riksdag"],
    riksdagTravelFromYear: fromYear,
    riksdagTravelToYear: new Date().getFullYear(),
  });
}

export async function getIngestRunHistory(limit = 20) {
  const prisma = getPrismaClient();
  if (!prisma) return [];

  return prisma.ingestRun.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}

export async function getIngestReviewQueue(limit = 20) {
  const prisma = getPrismaClient();
  if (!prisma) return [];

  return prisma.ingestReviewItem.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getLatestPublicRecords(limit = 24) {
  const prisma = getPrismaClient();
  if (!prisma) return [];

  return prisma.publicRecord.findMany({
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: {
      official: {
        select: {
          id: true,
          fullName: true,
          title: true,
        },
      },
      authority: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });
}
