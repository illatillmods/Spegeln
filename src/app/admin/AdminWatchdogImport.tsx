"use client";

import { useEffect, useState } from "react";

const sampleRows = [
  {
    authorityName: "Polismyndigheten",
    authoritySlug: "polismyndigheten",
    officialName: "Anna Svensson",
    officialTitle: "Polisinspektör",
    category: "LAW_ENFORCEMENT",
    region: "Stockholm",
  },
];

type IngestRun = {
  id: string;
  connectorKey: string;
  status: string;
  recordsCreated: number;
  recordsSkipped: number;
  error?: string | null;
  startedAt: string;
  finishedAt?: string | null;
};

type ConnectorInfo = {
  key: string;
  label: string;
  enabled: boolean;
};

type ReviewItem = {
  id: string;
  connectorKey: string;
  title: string;
  summary: string;
  suggestedName?: string | null;
  suggestedTitle?: string | null;
  createdAt: string;
};

export function AdminWatchdogImport() {
  const [rowsJson, setRowsJson] = useState(JSON.stringify(sampleRows, null, 2));
  const [result, setResult] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [ingestPending, setIngestPending] = useState(false);
  const [runs, setRuns] = useState<IngestRun[]>([]);
  const [connectors, setConnectors] = useState<ConnectorInfo[]>([]);
  const [reviewQueue, setReviewQueue] = useState<ReviewItem[]>([]);

  async function loadIngestStatus() {
    const response = await fetch("/api/admin/watchdog/ingest-status");
    if (!response.ok) return;
    const data = await response.json();
    setRuns(Array.isArray(data.runs) ? data.runs : []);
    setConnectors(Array.isArray(data.connectors) ? data.connectors : []);
    setReviewQueue(Array.isArray(data.reviewQueue) ? data.reviewQueue : []);
  }

  useEffect(() => {
    void loadIngestStatus();
  }, []);

  async function handleImport() {
    setPending(true);
    setResult(null);

    try {
      const rows = JSON.parse(rowsJson) as unknown[];
      const response = await fetch("/api/admin/watchdog/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Import misslyckades.");
      }

      setResult(
        `Importerade ${data.total} rader (${data.createdAuthorities} nya myndigheter, ${data.createdOfficials} nya tjänstepersoner, ${data.updatedOfficials ?? 0} uppdaterade).`,
      );
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Import misslyckades.");
    } finally {
      setPending(false);
    }
  }

  async function handleIngestRun() {
    setIngestPending(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/watchdog/ingest-run", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Ingestion misslyckades.");
      }

      setResult(
        `Ingestion klar: ${data.recordsCreated} nya poster, ${data.recordsSkipped} hoppade över (${data.connectorsRun} connectors).`,
      );
      await loadIngestStatus();
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Ingestion misslyckades.");
    } finally {
      setIngestPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="surface rounded-4xl p-6 md:p-8">
        <p className="eyebrow">Data-ingestion</p>
        <h2 className="mt-2 font-title text-3xl">Importera myndigheter och tjänstepersoner</h2>
        <p className="mt-3 text-(--muted) text-sm leading-7">
          Klistra in JSON-rader med fält: authorityName, authoritySlug, officialName, officialTitle, category, region.
          Schemalagd ingestion körs via <code className="text-xs">POST /api/admin/watchdog/ingest-cron</code> med header{" "}
          <code className="text-xs">x-cron-secret</code> och env <code className="text-xs">WATCHDOG_CONNECTORS</code>.
        </p>
        <textarea className="input mt-4 min-h-48 font-mono text-xs" onChange={(event) => setRowsJson(event.target.value)} value={rowsJson} />
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="btn-primary" disabled={pending} onClick={() => void handleImport()} type="button">
            {pending ? "Importerar..." : "Kör import"}
          </button>
          <button className="btn-secondary" disabled={ingestPending} onClick={() => void handleIngestRun()} type="button">
            {ingestPending ? "Kör connectors..." : "Kör connector-orkestrator"}
          </button>
        </div>
        {result ? <p className="mt-4 text-sm leading-7 text-(--muted)">{result}</p> : null}
      </section>

      <section className="surface rounded-4xl p-6 md:p-8">
        <p className="eyebrow">Connectors</p>
        <h2 className="mt-2 font-title text-3xl">Aktiva källor</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {connectors.map((connector) => (
            <span className={`tag ${connector.enabled ? "" : "opacity-50"}`} key={connector.key}>
              {connector.label} ({connector.key}){connector.enabled ? "" : " — av"}
            </span>
          ))}
        </div>
      </section>

      <section className="surface rounded-4xl p-6 md:p-8">
        <p className="eyebrow">Ingest-historik</p>
        <h2 className="mt-2 font-title text-3xl">Senaste körningar</h2>
        <div className="mt-4 space-y-3">
          {runs.length === 0 ? (
            <p className="text-(--muted) text-sm">Inga ingest-körningar registrerade ännu.</p>
          ) : (
            runs.slice(0, 12).map((run) => (
              <article className="rounded-2xl border border-[rgba(22,32,42,0.08)] bg-white/75 p-4 text-sm" key={run.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{run.connectorKey}</p>
                  <span className="tag">{run.status}</span>
                </div>
                <p className="mt-2 text-(--muted)">
                  {run.recordsCreated} skapade · {run.recordsSkipped} hoppade ·{" "}
                  {new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(run.startedAt))}
                </p>
                {run.error ? <p className="mt-2 text-red-700">{run.error}</p> : null}
              </article>
            ))
          )}
        </div>
      </section>

      <section className="surface rounded-4xl p-6 md:p-8">
        <p className="eyebrow">Granskningskö</p>
        <h2 className="mt-2 font-title text-3xl">Omatchade poster</h2>
        <div className="mt-4 space-y-3">
          {reviewQueue.length === 0 ? (
            <p className="text-(--muted) text-sm">Inga poster väntar på manuell entity-matchning.</p>
          ) : (
            reviewQueue.map((item) => (
              <article className="rounded-2xl border border-[rgba(22,32,42,0.08)] bg-white/75 p-4 text-sm" key={item.id}>
                <p className="font-semibold">{item.title}</p>
                <p className="mt-2 text-(--muted)">{item.summary}</p>
                {item.suggestedName ? (
                  <p className="mt-2 text-xs">
                    Förslag: {item.suggestedName}
                    {item.suggestedTitle ? ` · ${item.suggestedTitle}` : ""}
                  </p>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
