"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type WatchChannel = "email" | "browser" | "rss";
type WatchCadence = "REALTIME" | "HOURLY" | "DAILY";

type StoredWatch = {
  targetId: string;
  targetType: "official" | "authority";
  targetName: string;
  cadence: WatchCadence;
  channels: WatchChannel[];
  savedAt: string;
};

type ServerWatch = {
  id: string;
  authorityId: string;
  officialId?: string | null;
  authorityName: string;
  cadence: WatchCadence;
  updatedAt: string;
};

type WatchSubscriptionPanelProps = {
  targetId: string;
  targetType: "official" | "authority";
  targetName: string;
  authorityId: string;
  recommendedCadence: WatchCadence;
  defaultChannels: WatchChannel[];
  note: string;
};

const STORAGE_KEY = "spegeln.watch-subscriptions.v1";
const STORAGE_EVENT = "spegeln-watch-storage";

const cadenceLabels: Record<WatchCadence, string> = {
  REALTIME: "Direkt när nytt dokument eller ny korrelation publiceras",
  HOURLY: "Timvis digest",
  DAILY: "Daglig digest",
};

const channelLabels: Record<WatchChannel, string> = {
  email: "E-post",
  browser: "Webbläsarnotis",
  rss: "RSS-feed",
};

function readStoredWatches() {
  if (typeof window === "undefined") {
    return [] as StoredWatch[];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [] as StoredWatch[];
    const parsed = JSON.parse(raw) as StoredWatch[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as StoredWatch[];
  }
}

function writeStoredWatches(watches: StoredWatch[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(watches));
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

function subscribeToStoredWatches(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const notify = () => callback();
  window.addEventListener("storage", notify);
  window.addEventListener(STORAGE_EVENT, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(STORAGE_EVENT, notify);
  };
}

function getStoredWatch(targetId: string) {
  return readStoredWatches().find((watch) => watch.targetId === targetId) || null;
}

export function WatchSubscriptionPanel({
  targetId,
  targetType,
  targetName,
  authorityId,
  recommendedCadence,
  defaultChannels,
  note,
}: WatchSubscriptionPanelProps) {
  const storedWatch = useSyncExternalStore(
    subscribeToStoredWatches,
    () => getStoredWatch(targetId),
    () => null,
  );
  const [draftCadence, setDraftCadence] = useState<WatchCadence | null>(null);
  const [draftChannels, setDraftChannels] = useState<WatchChannel[] | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [serverWatch, setServerWatch] = useState<ServerWatch | null>(null);
  const [syncNote, setSyncNote] = useState<string | null>(null);

  const cadence = draftCadence ?? storedWatch?.cadence ?? (loggedIn ? serverWatch?.cadence : undefined) ?? recommendedCadence;
  const channels = draftChannels ?? storedWatch?.channels ?? defaultChannels;
  const isActive = Boolean(storedWatch || (loggedIn && serverWatch));
  const savedAt = storedWatch?.savedAt ?? (loggedIn ? serverWatch?.updatedAt : undefined) ?? null;

  useEffect(() => {
    void fetch("/api/me")
      .then((response) => response.ok)
      .then(setLoggedIn)
      .catch(() => setLoggedIn(false));
  }, []);

  useEffect(() => {
    if (!loggedIn) {
      return;
    }

    void fetch("/api/konto/watches")
      .then((response) => response.json())
      .then((data: { items?: ServerWatch[] }) => {
        const match =
          (data.items || []).find((watch) =>
            targetType === "official" ? watch.officialId === targetId : watch.authorityId === authorityId && !watch.officialId,
          ) || null;
        setServerWatch(match);
      })
      .catch(() => setServerWatch(null));
  }, [loggedIn, authorityId, targetId, targetType]);

  function toggleChannel(channel: WatchChannel) {
    setDraftChannels((currentChannels) => {
      const nextChannels = currentChannels ?? channels;
      if (nextChannels.includes(channel)) {
        return nextChannels.filter((currentChannel) => currentChannel !== channel);
      }
      return [...nextChannels, channel];
    });
  }

  async function saveWatch() {
    const nextChannels = channels.length === 0 ? defaultChannels : channels;
    const nextSavedAt = new Date().toISOString();
    const existing = readStoredWatches().filter((watch) => watch.targetId !== targetId);

    writeStoredWatches([
      ...existing,
      {
        targetId,
        targetType,
        targetName,
        cadence,
        channels: nextChannels,
        savedAt: nextSavedAt,
      },
    ]);

    setDraftCadence(null);
    setDraftChannels(null);
    setSyncNote(null);

    if (loggedIn) {
      const response = await fetch("/api/konto/watches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorityId,
          officialId: targetType === "official" ? targetId : null,
          cadence,
          alertsEnabled: nextChannels.includes("email"),
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as { watch?: ServerWatch };
        if (data.watch) {
          setServerWatch({
            id: data.watch.id,
            authorityId: data.watch.authorityId,
            authorityName: targetName,
            cadence,
            updatedAt: nextSavedAt,
          });
        }
        setSyncNote("Bevakningen sparades på ditt konto.");
      } else {
        setSyncNote("Lokal bevakning sparad. Servern kunde inte synkas just nu.");
      }
    }
  }

  async function removeWatch() {
    writeStoredWatches(readStoredWatches().filter((watch) => watch.targetId !== targetId));
    setDraftCadence(null);
    setDraftChannels(null);

    if (loggedIn && serverWatch) {
      await fetch(`/api/konto/watches/${serverWatch.id}`, { method: "DELETE" });
      setServerWatch(null);
    }
  }

  return (
    <aside className="surface-strong rounded-4xl p-6 md:p-7">
      <p className="eyebrow">Bevakning</p>
      <h2 className="mt-3 font-title text-3xl">Bevaka {targetName}</h2>
      <p className="mt-3 text-(--muted) text-sm leading-7">{note}</p>
      <p className="mt-2 text-(--muted) text-xs leading-6">
        {loggedIn
          ? "Synkas till ditt konto när du sparar. Endast notifieringar om nya offentliga poster och verifierade korrelationer ingår."
          : "Sparas lokalt i webbläsaren. Logga in för att synka bevakningen till ditt konto."}
      </p>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-(--foreground)">
          Frekvens
          <select className="select-field" onChange={(event) => setDraftCadence(event.target.value as WatchCadence)} value={cadence}>
            {Object.entries(cadenceLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <div>
          <p className="text-sm font-medium text-(--foreground)">Kanaler</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(channelLabels) as WatchChannel[]).map((channel) => {
              const checked = channels.includes(channel);
              return (
                <label
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${checked ? "border-[rgba(15,118,110,0.36)] bg-[rgba(15,118,110,0.12)]" : "border-[rgba(22,32,42,0.12)] bg-white/70"}`}
                  key={channel}
                >
                  <input checked={checked} className="h-4 w-4 accent-(--accent)" onChange={() => toggleChannel(channel)} type="checkbox" />
                  {channelLabels[channel]}
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button className="btn-primary" onClick={() => void saveWatch()} type="button">
          {isActive ? "Uppdatera bevakning" : "Starta bevakning"}
        </button>
        {isActive ? (
          <button className="btn-secondary" onClick={() => void removeWatch()} type="button">
            Avsluta bevakning
          </button>
        ) : null}
      </div>

      <div className="mt-5 rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/75 p-4 text-sm leading-7">
        <p className="font-semibold text-(--foreground)">{isActive ? "Bevakning aktiv" : "Ingen aktiv bevakning ännu"}</p>
        <p className="mt-1 text-(--muted)">
          {isActive
            ? savedAt
              ? `Senast sparad ${new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(savedAt))}.`
              : "Bevakningen är aktiv."
            : "Välj frekvens och kanaler för att få notiser om nya offentliga poster, beslut och korrelationer."}
        </p>
        {syncNote ? <p className="mt-2 text-xs text-(--muted)">{syncNote}</p> : null}
      </div>
    </aside>
  );
}
