"use client";

import { useState } from "react";

export function WikiVoteButtons({ pageId, initialScore }: { pageId: string; initialScore: number }) {
  const [score, setScore] = useState(initialScore);
  const [pending, setPending] = useState(false);

  async function vote(value: 1 | -1) {
    setPending(true);
    const response = await fetch("/api/statens-svagheter/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId, value }),
    });
    const data = (await response.json()) as { score?: number };
    if (response.ok && typeof data.score === "number") {
      setScore(data.score);
    }
    setPending(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="tag">Score {score}</span>
      <button className="btn-secondary text-xs" disabled={pending} onClick={() => void vote(1)} type="button">
        Rösta upp
      </button>
      <button className="btn-secondary text-xs" disabled={pending} onClick={() => void vote(-1)} type="button">
        Rösta ned
      </button>
    </div>
  );
}
