import React from "react";

export default function SkatteplaneringResult({ strategies, disclaimer }: { strategies: { title: string; description: string; legal: boolean }[]; disclaimer: string }) {
  return (
    <section className="max-w-xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-4">Dina skatteoptimeringsmöjligheter</h2>
      <ul className="mb-6 space-y-4">
        {strategies.map((s, i) => (
          <li key={i} className="border rounded p-4 bg-gray-50">
            <strong>{s.title}</strong>
            <div>{s.description}</div>
            <div className="text-xs text-green-700 mt-1">Laglig strategi</div>
          </li>
        ))}
      </ul>
      <div className="text-xs text-gray-500 border-t pt-4">{disclaimer}</div>
    </section>
  );
}
