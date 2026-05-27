import type { Metadata } from "next";
import type { ReverseSurveillanceView } from "@/lib/civic-features";
import { serverApiJson } from "@/lib/server-api";
import { ReverseSurveillanceClient } from "./Client";

export const metadata: Metadata = {
  title: "Reverse Surveillance",
  description: "Videospår, motbilder och delningspaket för samhällsgranskning.",
};

export default async function ReverseSurveillancePage() {
  const response = await serverApiJson<{ items: ReverseSurveillanceView[] }>("/api/reverse-surveillance/submissions");
  const initialItems = response.items;

  return (
    <div className="shell space-y-10 pb-20 pt-10 md:pt-14">
      <section className="space-y-5 reveal">
        <p className="eyebrow">Reverse Surveillance</p>
        <h1 className="max-w-4xl font-title text-5xl leading-none sm:text-6xl">Ladda upp motbilder som spräcker myndigheternas version.</h1>
        <p className="max-w-3xl text-(--muted) text-lg leading-8">Här samlas videospår, händelseförlopp och material som annars försvinner bakom tjänsteutövarnas egna formuleringar. Poängen är att bygga en motbild som går att sprida vidare.</p>
      </section>
      <ReverseSurveillanceClient initialItems={initialItems} />
    </div>
  );
}