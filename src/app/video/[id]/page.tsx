import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getProtestModule } from "@/lib/module-manifest";
import type { ReverseSurveillanceView } from "@/lib/civic/reverse-surveillance";
import { serverApiJson } from "@/lib/server-api";
import { VideoDetailPlayer } from "./VideoDetailPlayer";

type PageProps = {
  params: Promise<{ id: string }>;
};

const motbevakning = getProtestModule("motbevakning")!;

export default async function VideoDetailPage({ params }: PageProps) {
  const resolved = await params;
  const response = await serverApiJson<{ item: ReverseSurveillanceView }>(
    `/api/reverse-surveillance/submissions/${encodeURIComponent(resolved.id)}`,
    {},
    { allowStatuses: [404] },
  );

  if (!response) {
    return notFound();
  }

  const item = response.item;
  const videoAsset = item.evidenceAssets?.find((asset) => asset.mimeType.startsWith("video/") || asset.mimeType.startsWith("audio/"));

  return (
    <>
      <Breadcrumbs
        items={[
          { href: "/", label: "Start" },
          { href: "/reverse-surveillance", label: motbevakning.shortTitle },
          { label: item.title },
        ]}
      />
      <article className="shell max-w-4xl space-y-6 pb-20 pt-4 md:pt-6">
        <header className="space-y-3">
          <p className="eyebrow">{motbevakning.shortTitle}</p>
          <h1 className="font-title text-5xl leading-none">{item.title}</h1>
          <p className="text-(--muted) text-lg leading-8">{item.summary}</p>
        </header>
        <div className="surface rounded-4xl p-6 space-y-4">
          <VideoDetailPlayer
            itemId={item.id}
            mimeType={videoAsset?.mimeType}
            playbackUrl={videoAsset?.playbackUrl}
            redactionPlan={item.redactionPlan}
            title={item.title}
          />
          <p className="text-sm leading-7">{item.riskSummary}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="tag">{item.lifecycleStatus}</span>
            <span className="tag">{item.redactionStatus}</span>
            {item.authorityName ? <span className="tag">{item.authorityName}</span> : null}
          </div>
          <p className="text-(--muted) text-sm leading-7">{item.socialCaption}</p>
        </div>
        <Link className="btn-secondary" href="/reverse-surveillance">
          Tillbaka till motbevakning
        </Link>
      </article>
    </>
  );
}

export const metadata: Metadata = {
  title: "Motbevakning — videospår",
};
