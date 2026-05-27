import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import type { FailureReportView } from "@/lib/civic-features";
import { serverApiJson } from "@/lib/server-api";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReportDetailPage({ params }: PageProps) {
  const resolved = await params;
  const response = await serverApiJson<{ item: FailureReportView }>(
    `/api/myndighetsgranskaren/reports/${encodeURIComponent(resolved.id)}`,
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
          { href: "/myndighetsgranskaren", label: "Myndighetsgranskaren" },
          { label: item.title },
        ]}
      />
      <article className="shell max-w-4xl space-y-6 pb-20 pt-4 md:pt-6">
        <header className="space-y-3">
          <p className="eyebrow">{item.anonymousAlias || "Anonym källa"}</p>
          <h1 className="font-title text-5xl leading-none">{item.title}</h1>
          <p className="text-(--muted) text-lg leading-8">{item.summary}</p>
        </header>
        <div className="surface rounded-4xl p-6 space-y-4">
          <p className="text-sm leading-7">{item.aiSummary}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="tag">{item.aiSeverity}</span>
            <span className="tag">{item.lifecycleStatus}</span>
            {item.authorityName ? <span className="tag">{item.authorityName}</span> : null}
            <span className="tag">Bevis {item.evidenceCount}</span>
          </div>
        </div>
        <Link className="btn-secondary" href="/myndighetsgranskaren">
          Tillbaka till granskningskön
        </Link>
      </article>
    </>
  );
}

export const metadata: Metadata = {
  title: "Granskningsärende",
};
