"use client";

import { useState } from "react";
import type { ReverseSurveillanceView } from "@/lib/civic-features";

type Props = {
  initialItems: ReverseSurveillanceView[];
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/reverse-surveillance/submissions", {
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
    if (response.ok) {
      setItems((current) => [data as ReverseSurveillanceView, ...current].slice(0, 8));
      setTitle("");
      setSummary("");
      setAlias("");
      setFiles(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <form className="surface rounded-4xl p-6 md:p-8 space-y-3" onSubmit={handleSubmit}>
        <p className="eyebrow">Skyddad videointag</p>
        <h2 className="font-title text-4xl">Ladda upp ingripandevideo till granskningskön.</h2>
        <input className="input" placeholder="Titel" value={title} onChange={(event) => setTitle(event.target.value)} />
        <textarea className="input min-h-40" placeholder="Vad visar materialet och varför bör det granskas?" value={summary} onChange={(event) => setSummary(event.target.value)} />
        <input className="input" placeholder="Valfritt alias" value={alias} onChange={(event) => setAlias(event.target.value)} />
        <input className="input" multiple onChange={(event) => setFiles(event.target.files)} type="file" />
        <p className="text-(--muted) text-sm leading-7">Systemet planerar maskning av tredje man som standard. Eventuell publicering av identifierbara offentliga tjänsteutövare måste passera juridisk granskning först.</p>
        <button className="btn-primary" type="submit">Skicka skyddat material</button>
      </form>

      <section className="space-y-4">
        {items.map((item) => (
          <article className="surface rounded-4xl p-5" key={item.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">{item.authorityName || "Verifieringskö"}</p>
                <h3 className="mt-2 text-2xl font-semibold">{item.title}</h3>
              </div>
              <span className="tag">{item.redactionStatus}</span>
            </div>
            <p className="mt-3 text-(--muted) text-sm leading-7">{item.summary}</p>
            <p className="mt-3 text-sm leading-7">{item.riskSummary}</p>
            <div className="mt-4 rounded-3xl bg-white/80 p-4 text-sm leading-7">{item.redactionPolicy}</div>
          </article>
        ))}
      </section>
    </div>
  );
}