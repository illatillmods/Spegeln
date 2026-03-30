"use client";

import { useState } from "react";
import type { AutomatedAppealView } from "@/lib/civic-features";

type Props = {
  initialItems: AutomatedAppealView[];
};

function filesToEvidence(files: FileList | null) {
  return Array.from(files || []).map((file) => ({
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    byteSize: file.size,
    assetKind: file.type.startsWith("image/") ? "IMAGE" : "DOCUMENT",
  }));
}

export function AutomatedAppealWorkbench({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceSummary, setSourceSummary] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [selectedAuthorityIds, setSelectedAuthorityIds] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [submissionMode, setSubmissionMode] = useState<"draft" | "submit">("draft");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const response = await fetch("/api/byrakrati-bombaren/automated-appeal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceTitle,
        sourceSummary,
        senderEmail,
        region: "Nationell",
        selectedAuthorityIds: selectedAuthorityIds.split(",").map((value) => value.trim()).filter(Boolean),
        submissionMode,
        evidence: filesToEvidence(files),
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setItems((current) => [data as AutomatedAppealView, ...current].slice(0, 6));
      setSourceTitle("");
      setSourceSummary("");
      setSenderEmail("");
      setSelectedAuthorityIds("");
      setFiles(null);
    }
    setPending(false);
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
      <form className="surface rounded-4xl p-6 md:p-8 space-y-4" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Automatiserad överklagare</p>
          <h2 className="mt-2 font-title text-4xl">Låt AI skriva överklagande, klagomål och handlingbegäran från ett beslut.</h2>
        </div>
        <input className="input" placeholder="Beslutstitel" value={sourceTitle} onChange={(event) => setSourceTitle(event.target.value)} />
        <textarea className="input min-h-40" placeholder="Sammanfatta beslutet eller klistra in OCR-texten här." value={sourceSummary} onChange={(event) => setSourceSummary(event.target.value)} />
        <input className="input" placeholder="E-post för automatisk submission" value={senderEmail} onChange={(event) => setSenderEmail(event.target.value)} />
        <input className="input" placeholder="Valda mottagare, kommaseparerade ids" value={selectedAuthorityIds} onChange={(event) => setSelectedAuthorityIds(event.target.value)} />
        <input className="input" multiple onChange={(event) => setFiles(event.target.files)} type="file" />
        <div className="grid grid-cols-2 gap-3">
          <button className={`btn-secondary ${submissionMode === "draft" ? "ring-2 ring-[rgba(15,118,110,0.2)]" : ""}`} onClick={() => setSubmissionMode("draft")} type="button">Bara utkast</button>
          <button className={`btn-secondary ${submissionMode === "submit" ? "ring-2 ring-[rgba(194,107,20,0.2)]" : ""}`} onClick={() => setSubmissionMode("submit")} type="button">Skapa och skicka</button>
        </div>
        <button className="btn-primary" disabled={pending} type="submit">{pending ? "Genererar..." : "Generera överklagandebunt"}</button>
      </form>

      <div className="space-y-4">
        {items.map((item) => (
          <article className="surface rounded-4xl p-5" key={item.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">{item.status}</p>
                <h3 className="mt-2 text-2xl font-semibold">{item.sourceTitle}</h3>
              </div>
              <span className="tag">Artefakter {item.artifactCount}</span>
            </div>
            <p className="mt-3 text-(--muted) text-sm leading-7">{item.parsedDecisionSummary}</p>
            <p className="mt-3 text-sm leading-7">{item.riskSummary}</p>
            <div className="mt-4 space-y-3">
              {item.artifacts.slice(0, 2).map((artifact) => (
                <div className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/80 p-4" key={artifact.id}>
                  <div className="font-semibold">{artifact.title}</div>
                  <div className="mt-1 text-(--muted) text-sm">{artifact.subjectLine}</div>
                  <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-7">{artifact.body}</pre>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}