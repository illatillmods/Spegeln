"use client";

type QueueItem = {
  id: string;
  targetType: string;
  status: string;
  moderationDecision: string;
  legalDecision: string;
};

export function AdminModerationActions({ items }: { items: QueueItem[] }) {
  async function updateDecision(id: string, decision: "APPROVED" | "REJECTED") {
    await fetch(`/api/admin/review/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    window.location.reload();
  }

  return (
    <div className="mt-6 space-y-3 text-sm leading-7">
      {items.length === 0 ? <p className="text-(--muted)">Ingen moderationskö ännu.</p> : null}
      {items.map((item) => (
        <div className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/75 p-4" key={item.id}>
          <p className="font-semibold text-(--foreground)">{item.targetType}</p>
          <p className="text-(--muted)">{item.status} • moderation {item.moderationDecision}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={() => updateDecision(item.id, "APPROVED")} type="button">
              Godkänn
            </button>
            <button className="btn-secondary" onClick={() => updateDecision(item.id, "REJECTED")} type="button">
              Avvisa
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
