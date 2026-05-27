"use client";

import { useState } from "react";

type Props = {
  itemId: string;
  title: string;
  playbackUrl?: string | null;
  mimeType?: string;
  redactionPlan?: Array<{ label: string; timestamp?: string }>;
};

export function VideoDetailPlayer({ itemId, title, playbackUrl, mimeType, redactionPlan }: Props) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/video/${itemId}` : `/video/${itemId}`;

  async function copyShareLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {playbackUrl ? (
        <video className="w-full rounded-3xl bg-black" controls playsInline preload="metadata" src={playbackUrl}>
          <track kind="captions" />
          {mimeType ? null : null}
        </video>
      ) : (
        <p className="text-(--muted) text-sm leading-7">Videon bearbetas eller väntar på objektlagring.</p>
      )}

      {redactionPlan?.length ? (
        <div className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/80 p-4">
          <p className="eyebrow">Redigeringsplan</p>
          <ul className="mt-3 space-y-2 text-sm leading-7">
            {redactionPlan.map((marker) => (
              <li className="flex gap-3" key={`${marker.label}-${marker.timestamp || "na"}`}>
                <span className="signal-dot mt-2 shrink-0" />
                <span>
                  {marker.timestamp ? `${marker.timestamp} — ` : ""}
                  {marker.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button className="btn-secondary" onClick={() => void copyShareLink()} type="button">
          {copied ? "Länk kopierad" : "Kopiera delningslänk"}
        </button>
        <button
          className="btn-secondary"
          onClick={() => void navigator.clipboard.writeText(`<iframe src="${shareUrl}" title="${title}" width="640" height="360" allowfullscreen></iframe>`)}
          type="button"
        >
          Kopiera embed-kod
        </button>
      </div>
    </div>
  );
}
