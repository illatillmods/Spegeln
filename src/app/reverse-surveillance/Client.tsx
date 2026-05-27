"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReverseSurveillanceView } from "@/lib/civic-features";
import { uploadEvidenceFiles } from "@/lib/upload-evidence";
import { FileUploadZone } from "@/components/ui/FileUploadZone";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingButton } from "@/components/ui/FormControls";

type Props = {
  initialItems: ReverseSurveillanceView[];
};

const statusLabels: Record<string, string> = {
  LEGAL_REVIEW: "UNDER TRYCK",
  PROCESSING: "I RÖRELSE",
};

function filesToEvidence(files: FileList | null) {
  return Array.from(files || []).map((file) => ({
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    byteSize: file.size,
    assetKind: file.type.startsWith("video/") ? "VIDEO" : file.type.startsWith("image/") ? "IMAGE" : "DOCUMENT",
  }));
}

export function ReverseSurveillanceClient({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [alias, setAlias] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    let evidence = filesToEvidence(files);
    try {
      evidence = await uploadEvidenceFiles(files);
    } catch {
      // fallback to metadata-only evidence
    }

    const response = await fetch("/api/reverse-surveillance/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        summary,
        anonymousAlias: alias,
        evidence,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setItems((current) => [data as ReverseSurveillanceView, ...current].slice(0, 8));
      setTitle("");
      setSummary("");
      setAlias("");
      setFiles(null);
    }
    setPending(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <form className="surface rounded-4xl p-6 md:p-8 space-y-3" onSubmit={handleSubmit}>
        <p className="eyebrow">Motbildsflöde</p>
        <h2 className="font-title text-4xl">Ladda upp video som spräcker tjänsteversionen.</h2>
        <input className="input" placeholder="Titel" required value={title} onChange={(event) => setTitle(event.target.value)} />
        <textarea className="input min-h-40" placeholder="Vad visar materialet?" required value={summary} onChange={(event) => setSummary(event.target.value)} />
        <input className="input" placeholder="Valfritt alias" value={alias} onChange={(event) => setAlias(event.target.value)} />
        <FileUploadZone accept="video/*,image/*" helper="Video och bilder granskas innan delning." multiple onChange={setFiles} />
        <LoadingButton loading={pending} type="submit">
          Skicka motbild
        </LoadingButton>
      </form>

      <section className="space-y-4">
        {items.length === 0 ? (
          <EmptyState description="Ladda upp första videospåret till vänster." title="Inga videor i kön" />
        ) : (
          items.map((item) => (
            <Link className="block surface rounded-4xl p-5 transition hover:-translate-y-0.5" href={`/video/${item.id}`} key={item.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">{item.authorityName || "Motbildsflöde"}</p>
                  <h3 className="mt-2 text-2xl font-semibold">{item.title}</h3>
                </div>
                <span className="tag">{statusLabels[item.lifecycleStatus] || item.redactionStatus}</span>
              </div>
              <p className="mt-3 text-(--muted) text-sm leading-7">{item.summary}</p>
              <p className="mt-3 text-sm leading-7">{item.riskSummary}</p>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
