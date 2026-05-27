"use client";

import { useEffect, useState } from "react";

export type EntityOption = {
  id: string;
  label: string;
  kind: "official" | "authority";
  subtitle?: string;
};

type EntityPickerProps = {
  value: EntityOption | null;
  onChange: (value: EntityOption | null) => void;
  kind?: "official" | "authority" | "both";
  placeholder?: string;
};

export function EntityPicker({ value, onChange, kind = "both", placeholder = "Sök person eller myndighet" }: EntityPickerProps) {
  const [query, setQuery] = useState(value?.label || "");
  const [options, setOptions] = useState<EntityOption[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      const requests: Promise<EntityOption[]>[] = [];

      if (kind === "official" || kind === "both") {
        requests.push(
          fetch("/api/watchdog/people", { signal: controller.signal })
            .then((response) => response.json())
            .then((data) =>
              (Array.isArray(data.items) ? data.items : []).map((item: { id: string; fullName: string; authorityName: string; title: string }) => ({
                id: item.id,
                label: item.fullName,
                kind: "official" as const,
                subtitle: `${item.title} · ${item.authorityName}`,
              })),
            )
            .catch(() => []),
        );
      }

      if (kind === "authority" || kind === "both") {
        requests.push(
          fetch("/api/watchdog/authorities", { signal: controller.signal })
            .then((response) => response.json())
            .then((data) =>
              (Array.isArray(data.items) ? data.items : []).map((item: { id: string; name: string; category: string; region: string }) => ({
                id: item.id,
                label: item.name,
                kind: "authority" as const,
                subtitle: `${item.category} · ${item.region}`,
              })),
            )
            .catch(() => []),
        );
      }

      const merged = (await Promise.all(requests)).flat();
      const normalized = query.trim().toLowerCase();
      setOptions(
        merged
          .filter((option) => option.label.toLowerCase().includes(normalized) || option.subtitle?.toLowerCase().includes(normalized))
          .slice(0, 8),
      );
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [kind, query]);

  return (
    <div className="relative">
      <input
        className="input"
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          if (!event.target.value.trim()) {
            onChange(null);
          }
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        value={query}
      />
      {open && (query.trim().length >= 2 ? options : []).length > 0 ? (
        <ul className="surface-strong absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-3xl p-2 shadow-xl">
          {(query.trim().length >= 2 ? options : []).map((option) => (
            <li key={`${option.kind}-${option.id}`}>
              <button
                className="w-full rounded-2xl px-3 py-2 text-left transition hover:bg-white/80"
                onClick={() => {
                  onChange(option);
                  setQuery(option.label);
                  setOpen(false);
                }}
                type="button"
              >
                <p className="text-sm font-semibold text-(--foreground)">{option.label}</p>
                {option.subtitle ? <p className="text-(--muted) text-xs">{option.subtitle}</p> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
