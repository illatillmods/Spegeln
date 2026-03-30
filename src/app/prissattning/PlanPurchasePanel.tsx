"use client";

import { useState, useTransition } from "react";
import { getPaymentMethodConfig, paymentMethodCatalog, type PaymentMethodId, type PurchaseKey } from "@/lib/payments";

type PlanPurchasePanelProps = {
  purchaseKey: PurchaseKey;
};

export function PlanPurchasePanel({ purchaseKey }: PlanPurchasePanelProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("CARD");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const paymentConfig = getPaymentMethodConfig(paymentMethod);

  return (
    <div className="space-y-3">
      <select className="select-field w-full" onChange={(event) => setPaymentMethod(event.target.value as PaymentMethodId)} value={paymentMethod}>
        {paymentMethodCatalog.map((method) => (
          <option key={method.id} value={method.id}>
            {method.label}
            {method.discountPercent > 0 ? ` (${method.discountPercent}% off)` : ""}
          </option>
        ))}
      </select>
      {paymentConfig ? <p className="text-(--muted) text-xs leading-6">{paymentConfig.description}</p> : null}
      <button
        className="btn-primary w-full"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            setError(null);
            setFeedback(null);

            const response = await fetch("/api/payments/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ purchaseKey, paymentMethod }),
            });

            const data = (await response.json()) as { error?: string; message?: string; url?: string };

            if (!response.ok) {
              setError(data.error || "Kunde inte starta betalning.");
              return;
            }

            if (data.url) {
              window.location.href = data.url;
              return;
            }

            setFeedback(data.message || "Betalningsförfrågan skapades.");
          });
        }}
        type="button"
      >
        {pending
          ? "Laddar..."
          : paymentConfig?.usesStripeCheckout
            ? `Betala med ${paymentConfig.label}`
            : `Begär ${paymentConfig?.label || "betalning"}`}
      </button>
      {feedback ? <p className="rounded-2xl bg-[rgba(15,118,110,0.12)] px-4 py-3 text-sm">{feedback}</p> : null}
      {error ? <p className="rounded-2xl bg-[rgba(194,107,20,0.12)] px-4 py-3 text-sm">{error}</p> : null}
    </div>
  );
}