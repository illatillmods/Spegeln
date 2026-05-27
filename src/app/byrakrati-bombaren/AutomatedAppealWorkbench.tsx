"use client";

import { useState } from "react";
import type { AutomatedAppealView } from "@/lib/civic-features";
import { readTextFromFiles, uploadEvidenceFiles } from "@/lib/upload-evidence";
import { EntityPicker, type EntityOption } from "@/components/ui/EntityPicker";
import { FileUploadZone } from "@/components/ui/FileUploadZone";
import { FormError, LoadingButton } from "@/components/ui/FormControls";
import { EmptyState } from "@/components/ui/EmptyState";

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
  const [recipient, setRecipient] = useState<EntityOption | null>(null);
  const [selectedRecipients, setSelectedRecipients] = useState<EntityOption[]>([]);
  const [files, setFiles] = useState<FileList | null>(null);
  const [submissionMode, setSubmissionMode] = useState<"draft" | "submit">("draft");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addRecipient(option: EntityOption | null) {
    if (!option || option.kind !== "authority") {
      return;
    }

    setSelectedRecipients((current) => (current.some((item) => item.id === option.id) ? current : [...current, option]));
    setRecipient(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const extracted = await readTextFromFiles(files);
    const mergedSummary = extracted ? `${sourceSummary}\n\n${extracted}`.trim() : sourceSummary;
    let evidence = filesToEvidence(files);

    try {
      evidence = await uploadEvidenceFiles(files);
    } catch {
      // metadata-only fallback
    }

    const response = await fetch("/api/byrakrati-bombaren/automated-appeal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceTitle,
        sourceSummary: mergedSummary,
        senderEmail,
        region: "Nationell",
        selectedAuthorityIds: selectedRecipients.map((item) => item.id),
        submissionMode,
        evidence,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Kunde inte generera överklagandebunt.");
      setPending(false);
      return;
    }

    setItems((current) => [data as AutomatedAppealView, ...current].slice(0, 6));
    setSourceTitle("");
    setSourceSummary("");
    setSenderEmail("");
    setSelectedRecipients([]);
    setFiles(null);
    setPending(false);
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
      <form className="surface rounded-4xl p-6 md:p-8 space-y-4" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Automatiserad överklagare</p>
          <h2 className="mt-2 font-title text-4xl">Låt AI skriva överklagande, klagomål och handlingbegäran från ett beslut.</h2>
        </div>
        <input className="input" placeholder="Beslutstitel" required value={sourceTitle} onChange={(event) => setSourceTitle(event.target.value)} />
        <textarea className="input min-h-40" placeholder="Sammanfatta beslutet eller klistra in text från PDF." required value={sourceSummary} onChange={(event) => setSourceSummary(event.target.value)} />
        <input className="input" placeholder="E-post för automatisk submission" type="email" value={senderEmail} onChange={(event) => setSenderEmail(event.target.value)} />
        <div className="space-y-2">
          <p className="text-sm font-medium">Välj mottagarmyndigheter</p>
          <EntityPicker kind="authority" onChange={addRecipient} placeholder="Sök myndighet" value={recipient} />
          <div className="flex flex-wrap gap-2">
            {selectedRecipients.map((item) => (
              <button
                className="tag"
                key={item.id}
                onClick={() => setSelectedRecipients((current) => current.filter((entry) => entry.id !== item.id))}
                type="button"
              >
                {item.label} ×
              </button>
            ))}
          </div>
        </div>
        <FileUploadZone helper="PDF, bild eller dokument som underlag till AI-analysen." multiple onChange={setFiles} />
        <div className="grid grid-cols-2 gap-3">
          <button className={`btn-secondary ${submissionMode === "draft" ? "ring-2 ring-[rgba(15,118,110,0.2)]" : ""}`} onClick={() => setSubmissionMode("draft")} type="button">
            Bara utkast
          </button>
          <button className={`btn-secondary ${submissionMode === "submit" ? "ring-2 ring-[rgba(194,107,20,0.2)]" : ""}`} onClick={() => setSubmissionMode("submit")} type="button">
            Skapa och skicka
          </button>
        </div>
        {error ? <FormError message={error} /> : null}
        <LoadingButton loading={pending} loadingLabel="Genererar..." type="submit">
          Generera överklagandebunt
        </LoadingButton>
      </form>

      <div className="space-y-4">
        {items.length === 0 ? (
          <EmptyState description="Generera ditt första utkast till vänster." title="Inga AI-ärenden ännu" />
        ) : (
          items.map((item) => (
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
          ))
        )}
      </div>
    </section>
  );
}
