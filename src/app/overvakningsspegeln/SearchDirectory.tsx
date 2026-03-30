"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import type { WatchDirectoryPerson } from "@/lib/watchdog";

type SearchDirectoryProps = {
  individuals: WatchDirectoryPerson[];
  initialQuery?: string;
};

function matchesQuery(person: WatchDirectoryPerson, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [person.fullName, person.title, person.authorityName, person.summary].some((value) => value.toLowerCase().includes(normalizedQuery));
}

export function SearchDirectory({ individuals, initialQuery = "" }: SearchDirectoryProps) {
  const [query, setQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(query);
  const filteredIndividuals = individuals.filter((person) => matchesQuery(person, deferredQuery));

  return (
    <div className="space-y-6">
      <form className="surface rounded-[1.8rem] p-4 md:p-5">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-(--foreground)">Namn, roll, myndighet eller sakområde</span>
          <input
            className="input"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Sök på person, roll, myndighet eller mönster"
            type="search"
            value={query}
          />
        </label>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-(--muted)">
        <p>{filteredIndividuals.length} profiler matchar aktuell sökning.</p>
        <p>Alla träffar visar live-signaler, aktiva källfamiljer, publicerade rapporter och öppna alerts.</p>
      </div>

      <ul className="space-y-4">
        {filteredIndividuals.map((person) => (
          <li className="surface rounded-[1.9rem] p-5 md:p-6" key={person.id}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <div>
                  <div className="font-semibold text-xl text-(--foreground)">{person.fullName}</div>
                  <div className="text-(--muted) text-sm">{person.title} · {person.authorityName}</div>
                </div>
                <p className="max-w-3xl text-sm leading-7 text-(--muted)">{person.summary}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="tag">{person.totalSignals} signaler</span>
                  <span className="tag">{person.monitoredSources} källfamiljer</span>
                  <span className="tag">{person.publishedReports} rapporter</span>
                  <span className="tag">{person.openAlerts} öppna alerts</span>
                </div>
              </div>

              <div className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/70 p-4 text-sm md:min-w-64">
                <p className="text-(--foreground) font-semibold">Senaste sync</p>
                <p className="mt-1 text-(--muted)">{new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(person.lastSyncAt))}</p>
                <Link className="btn-secondary mt-4 w-full" href={`/overvakningsspegeln/profil/${person.id}`}>
                  Visa korrelationsprofil
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}