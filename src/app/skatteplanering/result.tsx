import React from "react";

export default function SkatteplaneringResult({ strategies, disclaimer }: { strategies: { title: string; description: string; legal: boolean }[]; disclaimer: string }) {
  return (
    <section className="space-y-6 reveal">
      <article className="surface rounded-4xl p-6 md:p-8">
        <h2 className="font-title text-4xl">Dina skatteoptimeringsmöjligheter</h2>
        <div className="mt-6 space-y-4">
          {strategies.map((strategy, index) => (
            <article className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/80 p-5" key={`${strategy.title}-${index}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="text-xl font-semibold text-(--foreground)">{strategy.title}</h3>
                {strategy.legal ? <span className="tag">Laglig strategi</span> : null}
              </div>
              <p className="mt-3 text-(--muted) text-sm leading-7">{strategy.description}</p>
            </article>
          ))}
        </div>
      </article>

      <article className="surface rounded-4xl p-6 text-(--muted) text-sm leading-7 md:p-8">
        {disclaimer}
      </article>
    </section>
  );
}
