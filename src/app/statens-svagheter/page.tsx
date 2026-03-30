import type { Metadata } from "next";
import { listWikiPages } from "@/lib/civic-features";
import { LoopholesWikiClient } from "./Client";

export const metadata: Metadata = {
  title: "Statens svagheter",
  description: "Community-driven wiki för lagliga kryphål, byråkratiska mönster och praktiska tips med versionering och moderation.",
};

export default async function LoopholesWikiPage() {
  const initialItems = await listWikiPages();

  return (
    <div className="shell space-y-10 pb-20 pt-10 md:pt-14">
      <section className="space-y-5 reveal">
        <p className="eyebrow">Statens svagheter</p>
        <h1 className="max-w-4xl font-title text-5xl leading-none sm:text-6xl">En versionsstyrd wiki för byråkratiska svagheter, praktiska knep och rättssäkra genvägar.</h1>
        <p className="max-w-3xl text-(--muted) text-lg leading-8">Varje ny revision går via moderation. Taggar, diskussioner och röstning gör innehållet självrensande över tid.</p>
      </section>
      <LoopholesWikiClient initialItems={initialItems} />
    </div>
  );
}