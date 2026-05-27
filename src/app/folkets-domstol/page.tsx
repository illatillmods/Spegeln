import type { Metadata } from "next";
import type { ConfidenceBoardEntry } from "@/lib/civic-features";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getProtestModule } from "@/lib/module-manifest";
import { serverApiJsonSafe } from "@/lib/server-api";
import { FolketsDomstolClientShell } from "./FolketsDomstolClientShell";

const mod = getProtestModule("folkets-domstol")!;

export const metadata: Metadata = {
  title: mod.shortTitle,
  description: mod.description,
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
          <p className="eyebrow">{mod.eyebrow}</p>
          <h1 className="max-w-4xl font-title text-5xl leading-none sm:text-6xl">{mod.title}</h1>
          <p className="max-w-3xl text-(--muted) text-lg leading-8">{mod.description} {mod.extremLangfinger}</p>
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
