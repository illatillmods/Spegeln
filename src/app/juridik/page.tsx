import type { Metadata } from "next";
import {
  ethicalAdRules,
  governancePrinciples,
  launchChecklist,
  legalPillars,
} from "@/lib/site-content";
import { protestModules } from "@/lib/module-manifest";

const toneClasses = {
  teal: "tone-teal",
  amber: "tone-amber",
  ink: "tone-ink",
};

export const metadata: Metadata = {
  title: "Manifest",
  description: "Spegelns manifest för protest, maximal insyn och öppet mottryck mot etablissemanget.",
};

export default function LegalPage() {
  return (
    <div className="shell space-y-20 pb-20 pt-10 md:pt-14">
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div className="space-y-5 reveal">
          <p className="eyebrow">Manifest</p>
          <h1 className="max-w-3xl font-title text-5xl leading-none sm:text-6xl">
            Vi byggde inte Spegeln för att låta rimliga.
          </h1>
          <p className="max-w-2xl text-(--muted) text-lg leading-8">
            Sajten finns för att skava mot myndighetsspråk, dra dokument ur skuggorna och göra institutionell bekvämlighet dyrare. Den är byggd för protest, maximal insyn och öppet mottryck.
          </p>
        </div>

        <aside className="surface-strong rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "120ms" }}>
          <p className="eyebrow">Ingen neutral pose</p>
          <h2 className="mt-3 font-title text-4xl">Det här är ett långfinger mot stängda dörrar.</h2>
          <p className="mt-4 text-(--muted) text-sm leading-7">
            Profiler, batcher, video, wiki och scorecards finns här för att samla spår, förstärka mönster och göra det lättare att fortsätta trycka när myndigheter hoppas att frågan ska dö.
          </p>
          <ul className="text-(--foreground) mt-6 space-y-3 text-sm leading-7">
            {launchChecklist.slice(0, 3).map((item) => (
              <li className="flex gap-3" key={item}>
                <span className="signal-dot mt-2 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="space-y-4">
        <p className="eyebrow reveal">Åtta frontlinjer</p>
        <h2 className="font-title text-4xl reveal">Verktygen som vänder kameran mot makten.</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {protestModules.map((module, index) => (
            <article className="surface rounded-[1.9rem] p-6 reveal" key={module.id} style={{ animationDelay: `${index * 80}ms` }}>
              <p className="eyebrow">{module.shortTitle}</p>
              <h3 className="mt-2 font-title text-3xl">{module.title}</h3>
              <p className="mt-3 text-(--muted) text-sm leading-7">{module.extremLangfinger}</p>
              <p className="mt-3 text-(--muted) text-xs leading-6">{module.lagligt}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {legalPillars.map((pillar, index) => (
          <article className={`surface rounded-[1.9rem] p-6 reveal ${toneClasses[pillar.tone]}`} key={pillar.title} style={{ animationDelay: `${index * 100}ms` }}>
            <p className="eyebrow">Front</p>
            <h2 className="mt-3 font-title text-3xl">{pillar.title}</h2>
            <p className="mt-4 text-(--muted) text-sm leading-7">{pillar.description}</p>
            <ul className="text-(--foreground) mt-5 space-y-3 text-sm leading-6">
              {pillar.points.map((point) => (
                <li className="flex gap-3" key={point}>
                  <span className="signal-dot mt-2 shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="surface rounded-4xl p-6 md:p-8 reveal">
          <p className="eyebrow">Drivkrafter</p>
          <h2 className="mt-3 font-title text-4xl">Fyra saker Spegeln tänker göra mot makten.</h2>
          <ul className="text-(--foreground) mt-6 space-y-4 text-sm leading-7">
            {governancePrinciples.map((principle) => (
              <li className="flex gap-3" key={principle}>
                <span className="signal-dot mt-2 shrink-0" />
                <span>{principle}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="surface rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "120ms" }}>
          <p className="eyebrow">Finansiering</p>
          <h2 className="mt-3 font-title text-4xl">Pengar ska hålla trycket igång, inte putsa budskapet.</h2>
          <ul className="text-(--foreground) mt-6 space-y-4 text-sm leading-7">
            {ethicalAdRules.map((rule) => (
              <li className="flex gap-3" key={rule}>
                <span className="signal-dot mt-2 shrink-0" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="surface-strong rounded-[2.2rem] p-6 md:p-8 reveal">
        <p className="eyebrow">Nästa offensiv</p>
        <h2 className="mt-3 max-w-4xl font-title text-4xl sm:text-5xl">
          Det som ska göra plattformen ännu svårare att ignorera.
        </h2>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {launchChecklist.map((item) => (
            <article className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/75 p-5" key={item}>
              <p className="text-(--foreground) text-sm leading-7">{item}</p>
            </article>
          ))}
        </div>
        <p className="mt-6 text-(--muted) text-sm leading-7">
          Fokus ligger på fler öppna spår, råare export, starkare community och mindre friktion mellan upptäckt och offentlig press.
        </p>
      </section>
    </div>
  );
}