import type { Metadata } from "next";
import { getConfidenceBoard } from "@/lib/civic-features";
import { PublicConfidenceClient } from "./Client";

export const metadata: Metadata = {
  title: "Folkets domstol",
  description: "Publik förtroendeomröstning, vittnesmål och trenddata för myndigheter och tjänstemän.",
};

export default async function PublicConfidencePage() {
  const initialItems = await getConfidenceBoard();

  return (
    <div className="shell space-y-10 pb-20 pt-10 md:pt-14">
      <section className="space-y-5 reveal">
        <p className="eyebrow">Folkets domstol</p>
        <h1 className="max-w-4xl font-title text-5xl leading-none sm:text-6xl">Anonym förtroendevotering med öppna trender och modererade vittnesmål.</h1>
        <p className="max-w-3xl text-(--muted) text-lg leading-8">Gratis för alla att rösta i. Premiumvärdet ligger i fördjupad analys, längre historik och mer avancerad trendtolkning.</p>
      </section>
      <PublicConfidenceClient initialItems={initialItems} />
    </div>
  );
}