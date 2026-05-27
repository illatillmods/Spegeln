"use client";

import { useState } from "react";
import type { WatchRelationship } from "@/lib/watchdog";

type RelationGraphProps = {
  subjectName: string;
  relationships: WatchRelationship[];
};

const centerX = 220;
const centerY = 180;
const radius = 122;

function getNodePosition(index: number, total: number) {
  if (total === 0) {
    return { x: centerX, y: centerY };
  }

  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  };
}

export function RelationGraph({ subjectName, relationships }: RelationGraphProps) {
  const [activeId, setActiveId] = useState(relationships[0]?.id || "");
  const activeRelationship = relationships.find((relationship) => relationship.id === activeId) || relationships[0];

  if (relationships.length === 0) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-[1.75rem] border border-[rgba(22,32,42,0.08)] bg-[rgba(22,32,42,0.03)] px-6 text-center text-(--muted)">
        Ingen verifierad relationsgraf är publicerad i den här profilen ännu.
        <span className="mt-2 block text-xs">Relationer visas när de går att koppla till offentliga källor enligt plattformens publiceringsgränser.</span>
      </div>
    );
  }

  return (
    <div className="rounded-[1.75rem] border border-[rgba(22,32,42,0.08)] bg-white/80 p-5">
      <div className="relative h-88 overflow-hidden rounded-[1.6rem] bg-[radial-gradient(circle_at_top,rgba(216,238,232,0.72),rgba(255,255,255,0.92))]">
        <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 440 360">
          {relationships.map((relationship, index) => {
            const position = getNodePosition(index, relationships.length);

            return (
              <line
                key={`${relationship.id}-line`}
                stroke={relationship.id === activeRelationship?.id ? "rgba(194,107,20,0.55)" : "rgba(22,32,42,0.16)"}
                strokeWidth={relationship.id === activeRelationship?.id ? 2.5 : 1.4}
                x1={centerX}
                x2={position.x}
                y1={centerY}
                y2={position.y}
              />
            );
          })}
        </svg>

        <div className="absolute left-1/2 top-1/2 z-10 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(22,32,42,0.12)] bg-[rgba(22,32,42,0.95)] px-4 text-center text-sm font-semibold text-white shadow-lg">
          {subjectName}
        </div>

        {relationships.map((relationship, index) => {
          const position = getNodePosition(index, relationships.length);

          return (
            <button
              className={`absolute z-20 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border px-3 text-center text-[11px] font-semibold leading-4 shadow transition ${relationship.id === activeRelationship?.id
                ? "border-[rgba(194,107,20,0.34)] bg-[rgba(248,227,197,0.92)] text-[rgb(112,65,14)]"
                : "border-[rgba(22,32,42,0.1)] bg-white/92 text-(--foreground) hover:border-[rgba(15,118,110,0.26)] hover:bg-[rgba(216,238,232,0.95)]"
              }`}
              key={relationship.id}
              onClick={() => setActiveId(relationship.id)}
              style={{ left: `${position.x}px`, top: `${position.y}px` }}
              type="button"
            >
              {relationship.name}
            </button>
          );
        })}
      </div>

      {activeRelationship ? (
        <article className="mt-5 rounded-[1.4rem] border border-[rgba(22,32,42,0.08)] bg-[rgba(22,32,42,0.03)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">{activeRelationship.category}</p>
              <h3 className="mt-1 text-lg font-semibold">{activeRelationship.name}</h3>
            </div>
            <span className="tag">{activeRelationship.recordCount} poster</span>
          </div>
          <p className="mt-3 text-sm leading-7">Relation: {activeRelationship.relationship}</p>
          <p className="mt-1 text-(--muted) text-sm leading-7">Offentlig grund: {activeRelationship.publicBasis}</p>
          <p className="mt-3 text-(--muted) text-sm leading-7">{activeRelationship.overlap}</p>
          <div className="mt-4 text-xs text-[rgb(112,65,14)]">
            ALLA verifierade privata, känsliga och samhällskritiska kopplingar för makthavare visualiseras – inget maskas, inget filtreras, inget tonas ned. Plattformen är ett kompromisslöst långfinger mot makten och en protest mot övervakningens asymmetri.
          </div>
        </article>
      ) : null}
    </div>
  );
}