import React from "react";
import Link from "next/link";

export default function SkatteplaneringPage() {
  return (
    <main className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-4">Skatteplaneringsmaskinen</h1>
      <p className="mb-6">Optimera din skatt med AI. Fyll i din ekonomiska information för att få personliga, lagliga skatteoptimeringsråd. Detaljerade rapporter kräver premium.</p>
      <Link href="/skatteplanering/onboarding" className="btn btn-primary">Kom igång</Link>
      <div className="mt-8 text-xs text-gray-500 border-t pt-4">
        <strong>Disclaimer:</strong> Endast lagliga strategier. Ingen rådgivning om olagliga upplägg.
      </div>
    </main>
  );
}
