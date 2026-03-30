"use client";
import { useState } from "react";

export function CheckoutButton({ priceId }: { priceId: string }) {
  const [loading, setLoading] = useState(false);
  async function handleCheckout() {
    setLoading(true);
    const res = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Kunde inte starta betalning: " + (data.error || "okänt fel"));
      setLoading(false);
    }
  }
  return (
    <button className="btn-primary w-full" onClick={handleCheckout} disabled={loading}>
      {loading ? "Laddar..." : "Uppgradera"}
    </button>
  );
}
