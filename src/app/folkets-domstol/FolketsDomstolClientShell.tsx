"use client";

import { useEffect, useState } from "react";
import type { ConfidenceBoardEntry } from "@/lib/civic-features";
import { PublicConfidenceClient } from "./Client";
import type { EntityOption } from "@/components/ui/EntityPicker";

type Props = {
  initialItems: ConfidenceBoardEntry[];
  initialTargetId?: string;
  initialTargetKind: "official" | "authority";
};

export function FolketsDomstolClientShell({ initialItems, initialTargetId, initialTargetKind }: Props) {
  const [initialTarget, setInitialTarget] = useState<EntityOption | null>(null);

  useEffect(() => {
    if (!initialTargetId) {
      return;
    }

    async function loadTarget() {
      const path = initialTargetKind === "authority" ? "/api/watchdog/authorities" : "/api/watchdog/people";
      const response = await fetch(path);
      const data = await response.json();
      const items = Array.isArray(data.items) ? data.items : [];
      const match =
        initialTargetKind === "authority"
          ? items.find((item: { id: string }) => item.id === initialTargetId)
          : items.find((item: { id: string }) => item.id === initialTargetId);

      if (!match) {
        return;
      }

      setInitialTarget(
        initialTargetKind === "authority"
          ? {
              id: match.id,
              label: match.name,
              kind: "authority",
              subtitle: `${match.category} · ${match.region}`,
            }
          : {
              id: match.id,
              label: match.fullName,
              kind: "official",
              subtitle: `${match.title} · ${match.authorityName}`,
            },
      );
    }

    void loadTarget();
  }, [initialTargetId, initialTargetKind]);

  return <PublicConfidenceClient initialItems={initialItems} initialTarget={initialTarget} />;
}
