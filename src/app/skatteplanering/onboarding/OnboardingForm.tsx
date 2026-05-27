"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingForm() {
  const [income, setIncome] = useState(0);
  const [assets, setAssets] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/skatteplanering/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ income, assets, notes }),
      });
      const data = await res.json();

      if (!res.ok || !data || !data.strategies) {
        throw new Error("analysis_failed");
      }

      if (typeof data.analysisId === "string") {
        router.push(`/skatteplanering/result/${data.analysisId}`);
        return;
      }

      sessionStorage.setItem("skatteplanering_result", JSON.stringify(data));
      router.push("/skatteplanering/result");
    } catch {
      setErrorMessage("Analysen kunde inte slutföras just nu. Försök igen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-(--foreground)">Inkomst (SEK/år)</span>
          <input
            className="input"
            min={0}
            name="income"
            required
            type="number"
            value={income}
            onChange={(event) => setIncome(Number(event.target.value))}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-(--foreground)">Tillgångar (SEK)</span>
          <input
            className="input"
            min={0}
            name="assets"
            required
            type="number"
            value={assets}
            onChange={(event) => setAssets(Number(event.target.value))}
          />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-(--foreground)">Övriga upplysningar</span>
        <textarea
          className="textarea"
          name="notes"
          placeholder="Beskriv mål, begränsningar eller särskilda upplägg som analysen bör ta hänsyn till."
          rows={4}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>

      {errorMessage ? (
        <div className="rounded-3xl border border-[rgba(194,107,20,0.18)] bg-[rgba(248,227,197,0.7)] px-4 py-3 text-sm text-(--foreground)">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button className="btn-primary disabled:cursor-not-allowed disabled:opacity-70" disabled={loading} type="submit">
          {loading ? "Analyserar..." : "Fortsätt till analys"}
        </button>
      </div>
    </form>
  );
}
