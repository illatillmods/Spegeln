"use client";

import Link from "next/link";
import { useState } from "react";
import type { FailureReportView } from "@/lib/civic-features";
import { uploadEvidenceFiles } from "@/lib/upload-evidence";
import { FileUploadZone } from "@/components/ui/FileUploadZone";
import { FormError, LoadingButton } from "@/components/ui/FormControls";
import { EmptyState } from "@/components/ui/EmptyState";

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

async function buildEvidence(files: FileList | null) {
  if (!files || files.length === 0) {
    return [];
  }

  try {
    return await uploadEvidenceFiles(files);
  } catch {
    return filesToEvidence(files);
  }
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
          evidence: await buildEvidence(files),
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
          <h2 className="mt-2 font-title text-4xl">Exponera makthavare. Publicera automatiskt.</h2>
        </div>
        <p className="text-(--muted) text-sm leading-7">
          Graverande rapporter publiceras automatiskt efter AI-triage. Pressfeed för journalister:{" "}
          <a className="underline" href="/api/public/press-feed" rel="noreferrer" target="_blank">
            /api/public/press-feed
          </a>
        </p>
        <input className="input" placeholder="Kort titel" required value={title} onChange={(event) => setTitle(event.target.value)} />
        <textarea className="input min-h-40" placeholder="Beskriv händelsen." required value={summary} onChange={(event) => setSummary(event.target.value)} />
        <input className="input" placeholder="Valfritt alias" value={alias} onChange={(event) => setAlias(event.target.value)} />
        <FileUploadZone helper="Text, bild, dokument och video." multiple onChange={setFiles} />
        {error ? <FormError message={error} /> : null}
        <LoadingButton loading={pending} loadingLabel="Analyserar..." type="submit">
          Skicka anonym rapport
        </LoadingButton>
      </form>

      <section className="space-y-4">
        {items.length === 0 ? (
          <EmptyState description="Var först med att lämna in ett granskningsärende." title="Inga publicerade ärenden" />
        ) : (
          items.map((item) => (
            <Link className="block surface rounded-4xl p-5 transition hover:-translate-y-0.5" href={`/rapporter/${item.id}`} key={item.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">{item.anonymousAlias || "Anonym källa"}</p>
                  <h3 className="mt-2 text-2xl font-semibold">{item.title}</h3>
                </div>
                <span className="tag">{item.lifecycleStatus}</span>
                <span className="tag">{item.aiSeverity}</span>
              </div>
              <p className="mt-3 text-(--muted) text-sm leading-7">{item.summary}</p>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
