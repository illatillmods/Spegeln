import React from "react";
import Link from "next/link";
import { getProtestModule } from "@/lib/module-manifest";

const mod = getProtestModule("skatteplanering")!;

export default function SkatteplaneringPage() {
  const highlights = [
    {
      title: "Snabb onboarding",
      summary: "Fyll i inkomst, tillgångar och övriga upplysningar i ett enda formulär utan att fastna i sidomenyer.",
    },
    {
      title: "AI-genererade strategier",
      summary: "Resultatvyn grupperar möjliga upplägg direkt efter analysen så att användaren kan bedöma värdet snabbt.",
    },
    {
      title: "Premiumlås på rätt nivå",
      summary: "Gratisflödet visar möjligheter direkt, medan fördjupad rapport och löpande optimering ligger bakom premium.",
    },
  ];

  return (
    <div className="shell space-y-12 pb-20 pt-10 md:pt-14">
      <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
        <div className="space-y-5 reveal">
          <p className="eyebrow">{mod.eyebrow}</p>
          <h1 className="max-w-4xl font-title text-5xl leading-none sm:text-6xl">{mod.title}</h1>
          <p className="max-w-3xl text-(--muted) text-lg leading-8">
            {mod.description} {mod.extremLangfinger}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="btn-primary" href="/skatteplanering/onboarding">Kom igång</Link>
            <Link className="btn-secondary" href="/prissattning">Se premiumplaner</Link>
          </div>
        </div>

        <article className="surface-strong rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "120ms" }}>
          <p className="eyebrow">Flöde</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="metric-card">
              <p className="eyebrow">Steg 1</p>
              <p className="mt-1 text-xl font-semibold">Input</p>
            </div>
            <div className="metric-card">
              <p className="eyebrow">Steg 2</p>
              <p className="mt-1 text-xl font-semibold">AI-analys</p>
            </div>
            <div className="metric-card">
              <p className="eyebrow">Steg 3</p>
              <p className="mt-1 text-xl font-semibold">Rapport</p>
            </div>
          </div>
          <p className="mt-5 text-(--muted) text-sm leading-7">
            Endast lagliga strategier. Ingen rådgivning om olagliga upplägg.
          </p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {highlights.map((item, index) => (
          <article className="surface rounded-[1.9rem] p-6 reveal" key={item.title} style={{ animationDelay: `${index * 90}ms` }}>
            <p className="eyebrow">Funktion</p>
            <h2 className="mt-2 font-title text-3xl">{item.title}</h2>
            <p className="mt-3 text-(--muted) text-sm leading-7">{item.summary}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
