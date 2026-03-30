import type { Metadata } from "next";
import { listReverseSurveillance } from "@/lib/civic-features";
import { ReverseSurveillanceClient } from "./Client";

export const metadata: Metadata = {
  title: "Reverse Surveillance",
  description: "Skyddad videointag, redaktionskö, maskningsplaner och delningspaket för samhällsgranskning.",
};

export default async function ReverseSurveillancePage() {
  const initialItems = await listReverseSurveillance();

  return (
    <div className="shell space-y-10 pb-20 pt-10 md:pt-14">
      <section className="space-y-5 reveal">
        <p className="eyebrow">Reverse Surveillance</p>
        <h1 className="max-w-4xl font-title text-5xl leading-none sm:text-6xl">Skyddad videouppladdning med maskningsplan, presspaket och realtidsvarning.</h1>
        <p className="max-w-3xl text-(--muted) text-lg leading-8">Funktionen är byggd för verifiering och ansvarig publicering. Viral distribution är sekundär till identitetsskydd, tredjemansmaskning och juridisk kontroll.</p>
      </section>
      <ReverseSurveillanceClient initialItems={initialItems} />
    </div>
  );
}