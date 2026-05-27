"use client";

import { useState } from "react";

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

export function AdminWatchdogImport() {
  const [rowsJson, setRowsJson] = useState(JSON.stringify(sampleRows, null, 2));
  const [result, setResult] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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

      setResult(`Importerade ${data.total} rader (${data.createdAuthorities} nya myndigheter, ${data.createdOfficials} tjänstepersoner).`);
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Import misslyckades.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="surface rounded-4xl p-6 md:p-8">
      <p className="eyebrow">Data-ingestion</p>
      <h2 className="mt-2 font-title text-3xl">Importera myndigheter och tjänstepersoner</h2>
      <p className="mt-3 text-(--muted) text-sm leading-7">
        Klistra in JSON-rader med fält: authorityName, authoritySlug, officialName, officialTitle, category, region.
        Schemalagd ingestion körs via <code className="text-xs">POST /api/admin/watchdog/ingest-cron</code> med header <code className="text-xs">x-cron-secret</code> och env <code className="text-xs">WATCHDOG_INGEST_URL</code>.
      </p>
      <textarea className="input mt-4 min-h-48 font-mono text-xs" onChange={(event) => setRowsJson(event.target.value)} value={rowsJson} />
      <button className="btn-primary mt-4" disabled={pending} onClick={() => void handleImport()} type="button">
        {pending ? "Importerar..." : "Kör import"}
      </button>
      {result ? <p className="mt-4 text-sm leading-7 text-(--muted)">{result}</p> : null}
    </section>
  );
}
