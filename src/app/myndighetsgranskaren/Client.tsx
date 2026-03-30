"use client";

import { useState } from "react";
import type { FailureReportView } from "@/lib/civic-features";

type Props = {
  initialItems: FailureReportView[];
};

function filesToEvidence(files: FileList | null) {
  return Array.from(files || []).map((file) => ({
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    byteSize: file.size,
    assetKind: file.type.startsWith("image/") ? "IMAGE" : file.type.startsWith("video/") ? "VIDEO" : "DOCUMENT",
  }));
}

export function AuthorityFailuresClient({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [alias, setAlias] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/myndighetsgranskaren/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          anonymousAlias: alias,
          evidence: filesToEvidence(files),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Kunde inte skapa ärendet.");
      }

      setItems((current) => [data as FailureReportView, ...current].slice(0, 8));
      setTitle("");
      setSummary("");
      setAlias("");
      setFiles(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Kunde inte skapa ärendet.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
      <form className="surface rounded-4xl p-6 md:p-8 space-y-4" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Anonymt uppladdningsflöde</p>
          <h2 className="mt-2 font-title text-4xl">Rapportera fel, maktmissbruk och skandaler.</h2>
        </div>
        <input className="input" placeholder="Kort titel" value={title} onChange={(event) => setTitle(event.target.value)} />
        <textarea className="input min-h-40" placeholder="Beskriv händelsen, vad du såg och varför det är allvarligt." value={summary} onChange={(event) => setSummary(event.target.value)} />
        <input className="input" placeholder="Valfritt alias" value={alias} onChange={(event) => setAlias(event.target.value)} />
        <input className="input" multiple onChange={(event) => setFiles(event.target.files)} type="file" />
        <p className="text-(--muted) text-sm leading-7">Text, bild, dokument och video kan skickas in. I denna kodbas sparas filmanifest och granskningsspår; produktion bör kopplas till krypterad objektlagring.</p>
        {error ? <div className="rounded-3xl border border-[rgba(153,27,27,0.25)] bg-white/80 px-4 py-3 text-sm text-[rgb(127,29,29)]">{error}</div> : null}
        <button className="btn-primary" disabled={pending} type="submit">{pending ? "Analyserar..." : "Skicka anonym rapport"}</button>
      </form>

      <section className="space-y-4">
        {items.map((item) => (
          <article className="surface rounded-4xl p-5" key={item.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">{item.anonymousAlias || "Anonym källa"}</p>
                <h3 className="mt-2 text-2xl font-semibold">{item.title}</h3>
              </div>
              <span className="tag">{item.aiSeverity} / {item.aiPriorityScore}</span>
            </div>
            <p className="mt-3 text-(--muted) text-sm leading-7">{item.summary}</p>
            <p className="mt-3 text-sm">{item.aiSummary}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-(--muted)">
              <span className="tag">{item.lifecycleStatus}</span>
              <span className="tag">Bevis: {item.evidenceCount}</span>
              {item.authorityName ? <span className="tag">{item.authorityName}</span> : null}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}