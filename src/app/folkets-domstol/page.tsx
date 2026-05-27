import type { Metadata } from "next";
import type { ConfidenceBoardEntry } from "@/lib/civic-features";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { serverApiJsonSafe } from "@/lib/server-api";
import { FolketsDomstolClientShell } from "./FolketsDomstolClientShell";

export const metadata: Metadata = {
  title: "Folkets domstol",
  description: "Publik tryckmätning, vittnesmål och trenddata för myndigheter och tjänstemän.",
};

type PageProps = {
  searchParams: Promise<{ target?: string; kind?: string }>;
};

export default async function PublicConfidencePage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const response = await serverApiJsonSafe<{ items: ConfidenceBoardEntry[] }>("/api/folkets-domstol/board", { items: [] });
  const initialItems = response.data.items;
  const initialTargetId = typeof resolved.target === "string" ? resolved.target : undefined;
  const initialTargetKind = resolved.kind === "authority" ? "authority" : "official";

  return (
    <>
      <Breadcrumbs items={[{ href: "/", label: "Start" }, { label: "Folkets domstol" }]} />
      <div className="shell space-y-10 pb-20 pt-4 md:pt-6">
        <section className="space-y-5 reveal">
          <p className="eyebrow">Folkets domstol</p>
          <h1 className="max-w-4xl font-title text-5xl leading-none sm:text-6xl">Anonym tryckmätning med öppna trender och vittnesmål.</h1>
          <p className="max-w-3xl text-(--muted) text-lg leading-8">Sök person eller myndighet — inga tekniska ID krävs.</p>
        </section>
        <FolketsDomstolClientShell
          initialItems={initialItems}
          initialTargetId={initialTargetId}
          initialTargetKind={initialTargetKind}
        />
      </div>
    </>
  );
}
