import { LeaderboardEntry } from "@/lib/public-insights";

type LeaderboardPanelProps = {
  title: string;
  windowLabel: string;
  items: LeaderboardEntry[];
};

export function LeaderboardPanel({ title, windowLabel, items }: LeaderboardPanelProps) {
  return (
    <section className="surface rounded-4xl p-6 md:p-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Gamifierat deltagande</p>
          <h2 className="mt-2 font-title text-4xl">{title}</h2>
        </div>
        <span className="tag">{windowLabel}</span>
      </div>
      <p className="mt-4 max-w-2xl text-(--muted) text-sm leading-7">
        Poängen bygger på klagomål som leder till officiella svar, publicerade granskningar och pseudonymiserade uppvärderingar från andra användare. Inga riktiga namn exponeras publikt.
      </p>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <article className="grid gap-4 rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/75 p-4 md:grid-cols-[88px_1fr_180px] md:items-center" key={item.alias}>
            <div>
              <p className="eyebrow">Placering</p>
              <p className="mt-1 text-3xl font-semibold">#{item.rank}</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold">{item.alias}</h3>
              <p className="mt-1 text-(--muted) text-sm">
                {item.complaintsWithResponse} svar, {item.investigationsReported} publicerade granskningar, {item.peerEndorsements} endorsers, {item.upvotes} uppvotes.
              </p>
            </div>
            <div className="rounded-3xl bg-(--accent-soft) px-4 py-3 text-right">
              <p className="eyebrow">Effektpoäng</p>
              <p className="mt-1 text-3xl font-semibold">{item.score}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}