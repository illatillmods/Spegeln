"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingForm() {
  const [income, setIncome] = useState(0);
  const [assets, setAssets] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/skatteplanering/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ income, assets, notes }),
    });
    const data = await res.json();
    setLoading(false);
    if (data && data.strategies) {
      sessionStorage.setItem("skatteplanering_result", JSON.stringify(data));
      router.push("/skatteplanering/result");
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block mb-1 font-medium">Inkomst (SEK/år)</label>
        <input type="number" name="income" className="input input-bordered w-full" required value={income} onChange={e => setIncome(Number(e.target.value))} />
      </div>
      <div>
        <label className="block mb-1 font-medium">Tillgångar (SEK)</label>
        <input type="number" name="assets" className="input input-bordered w-full" required value={assets} onChange={e => setAssets(Number(e.target.value))} />
      </div>
      <div>
        <label className="block mb-1 font-medium">Övriga upplysningar</label>
        <textarea name="notes" className="textarea textarea-bordered w-full" rows={3} value={notes} onChange={e => setNotes(e.target.value)}></textarea>
      </div>
      <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Analyserar..." : "Fortsätt"}</button>
    </form>
  );
}
