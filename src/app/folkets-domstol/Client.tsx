"use client";

import { useState } from "react";
import type { ConfidenceBoardEntry } from "@/lib/civic-features";

type Props = {
  initialItems: ConfidenceBoardEntry[];
};

export function PublicConfidenceClient({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [targetId, setTargetId] = useState("");
  const [kind, setKind] = useState<"official" | "authority">("authority");
  const [direction, setDirection] = useState<"UP" | "DOWN">("DOWN");
  const [alias, setAlias] = useState("");
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  async function submitVote() {
    setPending(true);
    await fetch("/api/folkets-domstol/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kind === "official" ? { officialId: targetId, anonymousAlias: alias, direction } : { authorityId: targetId, anonymousAlias: alias, direction }),
    });
    const response = await fetch("/api/folkets-domstol/board");
    const data = await response.json();
    setItems(Array.isArray(data.items) ? data.items : initialItems);
    setPending(false);
  }

  async function submitTestimonial(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    await fetch("/api/folkets-domstol/testimonials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kind === "official" ? { officialId: targetId, anonymousAlias: alias, headline, body } : { authorityId: targetId, anonymousAlias: alias, headline, body }),
    });
    setHeadline("");
    setBody("");
    setPending(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="surface rounded-4xl p-6 md:p-8">
        <p className="eyebrow">Publik ranking och trend</p>
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <article className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/80 p-4" key={item.targetId}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">{item.targetLabel}</h3>
                  <p className="mt-1 text-(--muted) text-sm">{item.kind === "official" ? "Tjänsteman" : "Myndighet"}</p>
                </div>
                <span className="tag">Förtroende {item.confidenceScore}%</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-(--muted)">
                <span className="tag">Upp {item.upvotes}</span>
                <span className="tag">Ned {item.downvotes}</span>
                <span className="tag">Vittnesmål {item.testimonials}</span>
                <span className="tag">Trend {item.trend > 0 ? `+${item.trend}` : item.trend}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="space-y-5">
        <section className="surface rounded-4xl p-6 md:p-8">
          <p className="eyebrow">Rösta anonymt</p>
          <div className="mt-4 space-y-3">
            <select className="input" value={kind} onChange={(event) => setKind(event.target.value as "official" | "authority")}>
              <option value="authority">Myndighet</option>
              <option value="official">Tjänsteman</option>
            </select>
            <input className="input" placeholder="Authority eller official id" value={targetId} onChange={(event) => setTargetId(event.target.value)} />
            <input className="input" placeholder="Valfritt alias" value={alias} onChange={(event) => setAlias(event.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <button className="btn-secondary" onClick={() => setDirection("UP")} type="button">Förtroende upp</button>
              <button className="btn-secondary" onClick={() => setDirection("DOWN")} type="button">Förtroende ned</button>
            </div>
            <button className="btn-primary" disabled={pending} onClick={submitVote} type="button">Registrera röst</button>
          </div>
        </section>

        <form className="surface rounded-4xl p-6 md:p-8 space-y-3" onSubmit={submitTestimonial}>
          <p className="eyebrow">Anonyma vittnesmål</p>
          <input className="input" placeholder="Rubrik" value={headline} onChange={(event) => setHeadline(event.target.value)} />
          <textarea className="input min-h-32" placeholder="Beskriv erfarenheten. Vittnesmålet går först till moderation." value={body} onChange={(event) => setBody(event.target.value)} />
          <button className="btn-primary" disabled={pending} type="submit">Skicka vittnesmål</button>
        </form>
      </div>
    </div>
  );
}