import type { AuthorityScorecardView } from "@/lib/public-insights";

type ScorecardGridProps = {
  items: AuthorityScorecardView[];
};

export function ScorecardGrid({ items }: ScorecardGridProps) {
  return (
    <section className="surface rounded-4xl p-6 md:p-8">
      <p className="eyebrow">Automatiska scorecards</p>
      <h2 className="mt-2 font-title text-4xl">Myndighetskort med öppna formler</h2>
      <p className="mt-4 max-w-2xl text-(--muted) text-sm leading-7">
        Varje kort visar hur poängen räknas ut. Det gör granskningen transparent, reproducerbar och enklare att överpröva när metodiken utvecklas mellan länder eller jurisdiktioner.
      </p>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <article className="rounded-4xl border border-[rgba(22,32,42,0.08)] bg-white/78 p-5" key={item.authorityId}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">{item.category}</p>
                <h3 className="mt-2 font-title text-3xl">{item.authorityName}</h3>
              </div>
              <div className="rounded-3xl bg-(--foreground) px-4 py-3 text-right text-white">
                <p className="eyebrow text-white/70">Totalpoäng</p>
                <p className="mt-1 text-3xl font-semibold">{item.overallScore}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="metric-card">
                <p className="eyebrow">Transparens</p>
                <p className="mt-1 text-2xl font-semibold">{item.transparencyScore}</p>
              </div>
              <div className="metric-card">
                <p className="eyebrow">Svarstid</p>
                <p className="mt-1 text-2xl font-semibold">{item.responseTimeScore}</p>
              </div>
              <div className="metric-card">
                <p className="eyebrow">Klagomålstryck</p>
                <p className="mt-1 text-2xl font-semibold">{item.complaintsScore}</p>
              </div>
              <div className="metric-card">
                <p className="eyebrow">Lösningsgrad</p>
                <p className="mt-1 text-2xl font-semibold">{item.resolutionScore}</p>
              </div>
            </div>
            <div className="mt-5 rounded-3xl bg-(--ink-soft) p-4 text-sm">
              <p className="font-semibold">Metodik: {item.methodologyVersion}</p>
              <p className="mt-2 text-(--muted)">{item.explanation.note}</p>
              <ul className="mt-3 space-y-2 text-(--foreground)">
                {item.explanation.formulas.map((formula) => (
                  <li key={formula}>{formula}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}