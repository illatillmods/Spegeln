import type { Metadata } from "next";
import {
  dashboardSignals,
  governancePrinciples,
  heroMetrics,
  stackChoices,
  workflowSteps,
} from "@/lib/site-content";

const toneClasses = {
  teal: "tone-teal",
  amber: "tone-amber",
  ink: "tone-ink",
};

export const metadata: Metadata = {
  title: "Plattform",
  description: "Operativ vy över hur Spegeln bevakar, granskar och publicerar med juridiska kontrollpunkter.",
};

export default function PlatformPage() {
  return (
    <div className="shell space-y-20 pb-20 pt-10 md:pt-14">
      <section className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-start">
        <div className="space-y-5 reveal">
          <p className="eyebrow">Plattformsvy</p>
          <h1 className="max-w-3xl font-title text-5xl leading-none sm:text-6xl">
            Ett kontrollrum för bevakning, rapportering och publik dialog.
          </h1>
          <p className="max-w-2xl text-(--muted) text-lg leading-8">
            Spegeln ska hjälpa redaktioner och analysgrupper att hålla ihop öppna källor, tips, juridik och publicering utan att förlora spårbarheten mellan signal och slutsats.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 reveal" style={{ animationDelay: "120ms" }}>
          {heroMetrics.map((metric) => (
            <article className="surface rounded-[1.6rem] p-5" key={metric.label}>
              <p className="text-(--foreground) text-3xl font-semibold">{metric.value}</p>
              <p className="text-(--foreground) mt-2 text-sm font-medium">{metric.label}</p>
              <p className="mt-2 text-(--muted) text-sm leading-6">{metric.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-4">
          {dashboardSignals.map((signal, index) => (
            <article className={`surface rounded-[1.8rem] p-6 reveal ${toneClasses[signal.tone]}`} key={signal.authority} style={{ animationDelay: `${index * 110}ms` }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">{signal.region}</p>
                  <h2 className="mt-2 font-title text-3xl">{signal.authority}</h2>
                </div>
                <span className="tag">{signal.severity}</span>
              </div>
              <p className="mt-4 text-(--muted) text-sm leading-7">{signal.summary}</p>
              <ul className="text-(--foreground) mt-5 space-y-3 text-sm leading-6">
                {signal.items.map((item) => (
                  <li className="flex gap-3" key={item}>
                    <span className="signal-dot mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="surface-strong rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "140ms" }}>
          <p className="eyebrow">Publiceringskedja</p>
          <h2 className="mt-3 font-title text-4xl">Fem steg från signal till ansvarig publicering.</h2>
          <div className="mt-8 space-y-4">
            {workflowSteps.map((step, index) => (
              <article className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/70 p-5" key={step.title}>
                <div className="flex items-start gap-4">
                  <span className="bg-(--foreground) flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-(--foreground) text-xl font-semibold">{step.title}</h3>
                    <p className="mt-2 text-(--muted) text-sm leading-7">{step.description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="surface rounded-4xl p-6 md:p-8 reveal">
          <p className="eyebrow">Styrningsprinciper</p>
          <h2 className="mt-3 font-title text-4xl">Förtroende byggs med spärrar, inte slogans.</h2>
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
          <p className="eyebrow">Teknisk ryggrad</p>
          <h2 className="mt-3 font-title text-4xl">Vad som bär produkten nu och senare.</h2>
          <div className="mt-6 space-y-4">
            {stackChoices.map((choice) => (
              <div className={`rounded-3xl border border-[rgba(22,32,42,0.08)] p-5 ${toneClasses[choice.tone]}`} key={choice.title}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-(--foreground) text-xl font-semibold">{choice.title}</h3>
                  <span className="tag">{choice.status}</span>
                </div>
                <p className="mt-3 text-(--muted) text-sm leading-7">{choice.description}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}