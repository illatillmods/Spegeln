import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import type { WikiPageDetail } from "@/lib/civic/wiki";
import { serverApiJson } from "@/lib/server-api";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  const response = await serverApiJson<{ page: WikiPageDetail }>(
    `/api/statens-svagheter/pages/${encodeURIComponent(resolved.slug)}`,
    {},
    { allowStatuses: [404] },
  );

  if (!response) {
    return { title: "Artikel saknas" };
  }

  return {
    title: response.page.title,
    description: response.page.summary,
  };
}

export default async function WikiArticlePage({ params }: PageProps) {
  const resolved = await params;
  const response = await serverApiJson<{ page: WikiPageDetail }>(
    `/api/statens-svagheter/pages/${encodeURIComponent(resolved.slug)}`,
    {},
    { allowStatuses: [404] },
  );

  if (!response) {
    return notFound();
  }

  const page = response.page;

  return (
    <>
      <Breadcrumbs
        items={[
          { href: "/", label: "Start" },
          { href: "/statens-svagheter", label: "Statens svagheter" },
          { label: page.title },
        ]}
      />
      <article className="shell max-w-4xl space-y-8 pb-20 pt-4 md:pt-6">
        <header className="space-y-4">
          <p className="eyebrow">{page.category}</p>
          <h1 className="font-title text-5xl leading-none">{page.title}</h1>
          <p className="text-(--muted) text-lg leading-8">{page.summary}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {page.tags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
            <span className="tag">Score {page.score}</span>
            <span className="tag">Rev {page.revisionNumber}</span>
          </div>
        </header>
        <div className="surface rounded-4xl p-6 md:p-8 prose prose-neutral max-w-none whitespace-pre-wrap text-sm leading-7">
          {page.bodyMarkdown}
        </div>
        <Link className="btn-secondary" href="/statens-svagheter">
          Tillbaka till wikin
        </Link>
      </article>
    </>
  );
}
