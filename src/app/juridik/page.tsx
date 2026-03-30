import type { Metadata } from "next";
import {
  ethicalAdRules,
  governancePrinciples,
  launchChecklist,
  legalPillars,
} from "@/lib/site-content";

const toneClasses = {
  teal: "tone-teal",
  amber: "tone-amber",
  ink: "tone-ink",
};

export const metadata: Metadata = {
  title: "Juridik",
  description: "Juridiska skyddsräcken och granskningspunkter för Spegeln enligt svensk och EU-rättslig kontext.",
};

export default function LegalPage() {
  return (
    <div className="shell space-y-20 pb-20 pt-10 md:pt-14">
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div className="space-y-5 reveal">
          <p className="eyebrow">Juridisk inramning</p>
          <h1 className="max-w-3xl font-title text-5xl leading-none sm:text-6xl">
            Plattformen måste tåla granskning även när den granskar andra.
          </h1>
          <p className="max-w-2xl text-(--muted) text-lg leading-8">
            Den här implementationen innehåller produktmässiga skyddsräcken för GDPR, offentlig data, proportionalitet, automatiserade myndighetsutskick och ansvarig publicering. Det är inte juridisk rådgivning, utan ett underlag som ska granskas av svensk jurist före skarp drift.
          </p>
        </div>

        <aside className="surface-strong rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "120ms" }}>
          <p className="eyebrow">Viktig disclaimer</p>
          <h2 className="mt-3 font-title text-4xl">Ingen automatisk publicering av anklagelser.</h2>
          <p className="mt-4 text-(--muted) text-sm leading-7">
            Automatiserade modeller får stödja sortering, sammanfattning, prioritering och myndighetsutskick, men ska inte ensamma skapa offentliga påståenden om individer eller myndighetspersoner.
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

      <section className="grid gap-4 md:grid-cols-2">
        {legalPillars.map((pillar, index) => (
          <article className={`surface rounded-[1.9rem] p-6 reveal ${toneClasses[pillar.tone]}`} key={pillar.title} style={{ animationDelay: `${index * 100}ms` }}>
            <p className="eyebrow">Rättslig pelare</p>
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
          <p className="eyebrow">Redaktionella principer</p>
          <h2 className="mt-3 font-title text-4xl">Det här får inte bli ett ryktesverktyg.</h2>
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
          <p className="eyebrow">Annonsregler</p>
          <h2 className="mt-3 font-title text-4xl">Etisk annonsering kräver hårda gränser.</h2>
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
        <p className="eyebrow">Legal review points</p>
        <h2 className="mt-3 max-w-4xl font-title text-4xl sm:text-5xl">
          Punkter som bör granskas av svensk jurist och dataskyddsresurs innan lansering.
        </h2>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {launchChecklist.map((item) => (
            <article className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/75 p-5" key={item}>
              <p className="text-(--foreground) text-sm leading-7">{item}</p>
            </article>
          ))}
        </div>
        <p className="mt-6 text-(--muted) text-sm leading-7">
          Särskild uppmärksamhet bör läggas på ansvarsfördelning, behandling av personuppgifter i tips, eventuella sekretessfrågor, namnpublicering samt hur generativ AI används i beslutsstödet.
        </p>
      </section>
    </div>
  );
}