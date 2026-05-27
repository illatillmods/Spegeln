import type { Metadata } from "next";
import type { WikiPageView } from "@/lib/civic-features";
import { serverApiJson } from "@/lib/server-api";
import { LoopholesWikiClient } from "./Client";

export const metadata: Metadata = {
  title: "Statens svagheter",
  description: "Community-driven wiki för byråkratins svaga punkter, kryphål och praktiska motdrag.",
};

export default async function LoopholesWikiPage() {
  const response = await serverApiJson<{ items: WikiPageView[] }>("/api/statens-svagheter/pages");
  const initialItems = response.items;

  return (
    <div className="shell space-y-10 pb-20 pt-10 md:pt-14">
      <section className="space-y-5 reveal">
        <p className="eyebrow">Statens svagheter</p>
        <h1 className="max-w-4xl font-title text-5xl leading-none sm:text-6xl">En versionsstyrd wiki för byråkratins svaga punkter, praktiska motdrag och allt systemet helst ser utspritt.</h1>
        <p className="max-w-3xl text-(--muted) text-lg leading-8">Nya revisioner ska vässa innehållet, inte putsa bort udden. Här samlas kryphål, processmönster och idéer som går att skicka vidare.</p>
      </section>
      <LoopholesWikiClient initialItems={initialItems} />
    </div>
  );
}