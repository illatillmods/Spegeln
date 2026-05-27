import type { Metadata } from "next";
import type { ReverseSurveillanceView } from "@/lib/civic-features";
import { getProtestModule } from "@/lib/module-manifest";
import { serverApiJson } from "@/lib/server-api";
import { ReverseSurveillanceClient } from "./Client";

const mod = getProtestModule("motbevakning")!;

export const metadata: Metadata = {
  title: mod.shortTitle,
  description: mod.description,
};

export default async function ReverseSurveillancePage() {
  const response = await serverApiJson<{ items: ReverseSurveillanceView[] }>("/api/reverse-surveillance/submissions");
  const initialItems = response.items;

  return (
    <div className="shell space-y-10 pb-20 pt-10 md:pt-14">
      <section className="space-y-5 reveal">
        <p className="eyebrow">{mod.eyebrow}</p>
        <h1 className="max-w-4xl font-title text-5xl leading-none sm:text-6xl">{mod.title}</h1>
        <p className="max-w-3xl text-(--muted) text-lg leading-8">{mod.description} {mod.extremLangfinger}</p>
      </section>
      <ReverseSurveillanceClient initialItems={initialItems} />
    </div>
  );
}