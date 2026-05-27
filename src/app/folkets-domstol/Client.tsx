"use client";

import { useState } from "react";
import type { ConfidenceBoardEntry } from "@/lib/civic-features";
import { EntityPicker, type EntityOption } from "@/components/ui/EntityPicker";
import { FormError, LoadingButton } from "@/components/ui/FormControls";
import { EmptyState } from "@/components/ui/EmptyState";

type Props = {
  initialItems: ConfidenceBoardEntry[];
  initialTarget?: EntityOption | null;
};

export function PublicConfidenceClient({ initialItems, initialTarget = null }: Props) {
  const [items, setItems] = useState(initialItems);
  const [target, setTarget] = useState<EntityOption | null>(initialTarget);
  const [direction, setDirection] = useState<"UP" | "DOWN">("DOWN");
  const [alias, setAlias] = useState("");
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitVote() {
    if (!target) {
      setError("Välj en person eller myndighet först.");
      return;
    }

    setPending(true);
    setError(null);
    const payload =
      target.kind === "official"
        ? { officialId: target.id, anonymousAlias: alias, direction }
        : { authorityId: target.id, anonymousAlias: alias, direction };

    const response = await fetch("/api/folkets-domstol/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error || "Rösten kunde inte registreras.");
      setPending(false);
      return;
    }

    const boardResponse = await fetch("/api/folkets-domstol/board");
    const data = await boardResponse.json();
    setItems(Array.isArray(data.items) ? data.items : initialItems);
    setPending(false);
  }

  async function submitTestimonial(event: React.FormEvent) {
    event.preventDefault();
    if (!target) {
      setError("Välj en person eller myndighet först.");
      return;
    }

    setPending(true);
    setError(null);
    const payload =
      target.kind === "official"
        ? { officialId: target.id, anonymousAlias: alias, headline, body }
        : { authorityId: target.id, anonymousAlias: alias, headline, body };

    const response = await fetch("/api/folkets-domstol/testimonials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error || "Vittnesmålet kunde inte skickas.");
    } else {
      setHeadline("");
      setBody("");
    }

    setPending(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="surface rounded-4xl p-6 md:p-8">
        <p className="eyebrow">Publik tryckmätning</p>
        <div className="mt-5 space-y-3">
          {items.length === 0 ? (
            <EmptyState description="Rösta på en profil eller myndighet för att starta tryckmätningen." title="Ingen data ännu" />
          ) : (
            items.map((item) => (
              <article className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/80 p-4" key={item.targetId}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">{item.targetLabel}</h3>
                    <p className="mt-1 text-(--muted) text-sm">{item.kind === "official" ? "Tjänsteroll" : "Myndighet"}</p>
                  </div>
                  <span className="tag">Tryck {item.confidenceScore}%</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-(--muted)">
                  <span className="tag">Upp {item.upvotes}</span>
                  <span className="tag">Ned {item.downvotes}</span>
                  <span className="tag">Vittnesmål {item.testimonials}</span>
                  <span className="tag">Trend {item.trend > 0 ? `+${item.trend}` : item.trend}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <div className="space-y-5">
        {error ? <FormError message={error} /> : null}
        <section className="surface rounded-4xl p-6 md:p-8">
          <p className="eyebrow">Rösta anonymt</p>
          <div className="mt-4 space-y-3">
            <EntityPicker onChange={setTarget} value={target} />
            <input className="input" placeholder="Valfritt alias" value={alias} onChange={(event) => setAlias(event.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <button className={`btn-secondary ${direction === "UP" ? "ring-2 ring-[rgba(15,118,110,0.2)]" : ""}`} onClick={() => setDirection("UP")} type="button">
                Tryck upp
              </button>
              <button className={`btn-secondary ${direction === "DOWN" ? "ring-2 ring-[rgba(194,107,20,0.2)]" : ""}`} onClick={() => setDirection("DOWN")} type="button">
                Tryck ned
              </button>
            </div>
            <LoadingButton loading={pending} loadingLabel="Registrerar..." onClick={submitVote} type="button">
              Registrera röst
            </LoadingButton>
          </div>
        </section>

        <form className="surface rounded-4xl p-6 md:p-8 space-y-3" onSubmit={submitTestimonial}>
          <p className="eyebrow">Anonyma vittnesmål</p>
          <input className="input" placeholder="Rubrik" value={headline} onChange={(event) => setHeadline(event.target.value)} />
          <textarea className="input min-h-32" placeholder="Beskriv erfarenheten." value={body} onChange={(event) => setBody(event.target.value)} />
          <LoadingButton loading={pending} loadingLabel="Skickar..." type="submit">
            Skicka vittnesmål
          </LoadingButton>
        </form>
      </div>
    </div>
  );
}
