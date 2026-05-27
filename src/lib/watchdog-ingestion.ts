import { importWatchdogRows, type WatchdogImportRow } from "@/lib/watchdog-import";

type RemoteOfficialRow = {
  authorityName?: string;
  authoritySlug?: string;
  officialName?: string;
  officialTitle?: string;
  region?: string;
};

export async function runWatchdogIngestionFromUrl(url: string) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`Ingestion misslyckades: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as RemoteOfficialRow[] | { rows?: RemoteOfficialRow[] };
  const rows = Array.isArray(payload) ? payload : Array.isArray(payload.rows) ? payload.rows : [];

  const normalized: WatchdogImportRow[] = rows
    .map((row) => ({
      authorityName: row.authorityName?.trim() || "",
      authoritySlug: row.authoritySlug?.trim() || "",
      officialName: row.officialName?.trim() || "",
      officialTitle: row.officialTitle?.trim() || "Offentlig roll",
      region: row.region?.trim() || "Nationell",
    }))
    .filter((row) => row.authorityName && row.authoritySlug && row.officialName);

  if (normalized.length === 0) {
    return { createdAuthorities: 0, createdOfficials: 0, total: 0, skipped: true };
  }

  return importWatchdogRows(normalized);
}

export async function runConfiguredWatchdogIngestion() {
  const url = process.env.WATCHDOG_INGEST_URL;
  if (!url) {
    return { skipped: true, reason: "WATCHDOG_INGEST_URL saknas." };
  }

  const result = await runWatchdogIngestionFromUrl(url);
  return { skipped: false, ...result };
}
