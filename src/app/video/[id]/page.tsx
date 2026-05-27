import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import type { ReverseSurveillanceView } from "@/lib/civic/reverse-surveillance";
import { serverApiJson } from "@/lib/server-api";

type PageProps = {
  params: Promise<{ id: string }>;
};

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

  return (
    <>
      <Breadcrumbs
        items={[
          { href: "/", label: "Start" },
          { href: "/reverse-surveillance", label: "Reverse Surveillance" },
          { label: item.title },
        ]}
      />
      <article className="shell max-w-4xl space-y-6 pb-20 pt-4 md:pt-6">
        <header className="space-y-3">
          <p className="eyebrow">Videospår</p>
          <h1 className="font-title text-5xl leading-none">{item.title}</h1>
          <p className="text-(--muted) text-lg leading-8">{item.summary}</p>
        </header>
        <div className="surface rounded-4xl p-6 space-y-4">
          <p className="text-sm leading-7">{item.riskSummary}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="tag">{item.lifecycleStatus}</span>
            <span className="tag">{item.redactionStatus}</span>
            {item.authorityName ? <span className="tag">{item.authorityName}</span> : null}
          </div>
          {item.evidenceAssets?.length ? (
            <ul className="space-y-2 text-sm leading-7 text-(--muted)">
              {item.evidenceAssets.map((asset) => (
                <li key={asset.id}>
                  {asset.fileName} ({asset.mimeType})
                  {asset.storageKey.startsWith("file://") ? " — lagrad lokalt på servern" : " — väntar på objektlagring"}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="text-(--muted) text-sm leading-7">{item.socialCaption}</p>
        </div>
        <Link className="btn-secondary" href="/reverse-surveillance">
          Tillbaka till videokön
        </Link>
      </article>
    </>
  );
}

export const metadata: Metadata = {
  title: "Videospår",
};
