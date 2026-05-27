"use client";

import Link from "next/link";
import { useState } from "react";

export default function ReportPremiumLock() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setPending(true);
    setError(null);

    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchaseKey: "plus_monthly", paymentMethod: "CARD" }),
    });
    const data = (await response.json()) as { url?: string; error?: string };

    if (!response.ok || !data.url) {
      setError(data.error || "Kunde inte starta betalning.");
      setPending(false);
      return;
    }

    window.location.href = data.url;
  }

  return (
    <article className="surface rounded-4xl p-6 md:p-8 tone-amber reveal">
      <p className="eyebrow">Premium krävs</p>
      <h2 className="mt-2 font-title text-4xl">Detaljerad rapport och löpande optimering ligger i premium.</h2>
      <p className="mt-3 text-(--muted) text-sm leading-7">
        Analysen kan användas direkt, men fördjupade rapporter och fortsatt optimering kräver ett premiumabonnemang.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="btn-primary" disabled={pending} onClick={() => void startCheckout()} type="button">
          {pending ? "Startar..." : "Uppgradera till Premium"}
        </button>
        <Link className="btn-secondary" href="/prissattning">
          Se priser
        </Link>
      </div>
      {error ? <p className="mt-4 text-sm text-(--muted)">{error}</p> : null}
    </article>
  );
}
