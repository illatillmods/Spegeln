"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/auth";
import { EmptyState } from "@/components/ui/EmptyState";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

type AccountTab = "bevakningar" | "batcher" | "rapporter" | "video" | "wiki" | "skatt";

type ServerWatch = {
  id: string;
  authorityId: string;
  authorityName: string;
  authoritySlug: string;
  cadence: string;
  updatedAt: string;
};

type TaxAnalysisItem = {
  id: string;
  createdAt: string;
  result: { strategies?: Array<{ title: string }> };
};

const tabs: Array<{ id: AccountTab; label: string }> = [
  { id: "bevakningar", label: "Bevakningar" },
  { id: "batcher", label: "Batcher" },
  { id: "rapporter", label: "Rapporter" },
  { id: "video", label: "Video" },
  { id: "wiki", label: "Wiki" },
  { id: "skatt", label: "Skatteanalyser" },
];

export function AccountClient({ user }: { user: SessionUser | null }) {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as AccountTab) || "bevakningar";
  const [tab, setTab] = useState<AccountTab>(initialTab);
  const [watches, setWatches] = useState<ServerWatch[]>([]);
  const [taxAnalyses, setTaxAnalyses] = useState<TaxAnalysisItem[]>([]);
  const [overview, setOverview] = useState<{ batches: number; reports: number; videos: number; wiki: number; tax: number; watches: number } | null>(null);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void Promise.all([
      fetch("/api/konto/overview").then((response) => response.json()),
      fetch("/api/konto/watches").then((response) => response.json()),
      fetch("/api/konto/tax-analyses").then((response) => response.json()),
    ])
      .then(([overviewData, watchesData, taxData]) => {
        setOverview(overviewData);
        setWatches(Array.isArray(watchesData.items) ? watchesData.items : []);
        setTaxAnalyses(Array.isArray(taxData.items) ? taxData.items : []);
      })
      .catch(() => {
        setOverview(null);
        setWatches([]);
        setTaxAnalyses([]);
      });
  }, [user]);

  if (!user) {
    return (
      <EmptyState
        actionHref="/login"
        actionLabel="Logga in"
        description="Skapa konto för att spara batcher, analyser och bevakningar på serversidan."
        title="Logga in för att se dina spår"
      />
    );
  }

  return (
    <div className="space-y-6">
      <nav aria-label="Kontoflikar" className="flex flex-wrap gap-2">
        {tabs.map((entry) => (
          <button
            aria-current={tab === entry.id ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-medium ${tab === entry.id ? "bg-(--foreground) text-white" : "border border-[rgba(22,32,42,0.1)] bg-white/75"}`}
            key={entry.id}
            onClick={() => setTab(entry.id)}
            type="button"
          >
            {entry.label}
          </button>
        ))}
      </nav>

      {tab === "bevakningar" ? (
        <section className="surface rounded-4xl p-6 space-y-3">
          <p className="eyebrow">Bevakningar</p>
          {watches.length === 0 ? (
            <EmptyState actionHref="/overvakningsspegeln/sok" actionLabel="Hitta profil" description="Starta en bevakning från en profil eller myndighet." title="Inga bevakningar" />
          ) : (
            watches.map((watch) => (
              <article className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/80 p-4" key={watch.id}>
                <h3 className="font-semibold">{watch.authorityName}</h3>
                <p className="mt-1 text-(--muted) text-sm">
                  {watch.cadence} · uppdaterad {new Date(watch.updatedAt).toLocaleString("sv-SE")}
                </p>
                <Link className="btn-secondary mt-3 inline-flex text-sm" href={`/overvakningsspegeln/autoritet#${watch.authoritySlug}`}>
                  Öppna myndighet
                </Link>
              </article>
            ))
          )}
        </section>
      ) : null}

      {tab === "batcher" ? (
        <section className="surface rounded-4xl p-6">
          <p className="eyebrow">Massutskick</p>
          <p className="mt-2 text-(--muted) text-sm">{overview ? `${overview.batches} batcher kopplade till ditt konto.` : "Laddar..."}</p>
          <Link className="btn-secondary mt-4 inline-flex" href="/byrakrati-bombaren">
            Skapa ny batch
          </Link>
        </section>
      ) : null}

      {tab === "rapporter" ? (
        <section className="surface rounded-4xl p-6">
          <p className="eyebrow">Inlämnade rapporter</p>
          <p className="mt-2 text-(--muted) text-sm">{overview ? `${overview.reports} rapporter.` : "Laddar..."}</p>
          <Link className="btn-secondary mt-4 inline-flex" href="/myndighetsgranskaren">
            Lämna ny rapport
          </Link>
        </section>
      ) : null}

      {tab === "video" ? (
        <section className="surface rounded-4xl p-6">
          <p className="eyebrow">Videoinlämningar</p>
          <p className="mt-2 text-(--muted) text-sm">{overview ? `${overview.videos} videospår i systemet.` : "Laddar..."}</p>
          <Link className="btn-secondary mt-4 inline-flex" href="/reverse-surveillance">
            Ladda upp video
          </Link>
        </section>
      ) : null}

      {tab === "wiki" ? (
        <section className="surface rounded-4xl p-6">
          <p className="eyebrow">Wiki-utkast</p>
          <p className="mt-2 text-(--muted) text-sm">{overview ? `${overview.wiki} utkast.` : "Laddar..."}</p>
          <Link className="btn-secondary mt-4 inline-flex" href="/statens-svagheter">
            Skriv wiki-artikel
          </Link>
        </section>
      ) : null}

      {tab === "skatt" ? (
        <section className="surface rounded-4xl p-6 space-y-3">
          <p className="eyebrow">Skatteanalyser</p>
          {taxAnalyses.length === 0 ? (
            <EmptyState actionHref="/skatteplanering/onboarding" actionLabel="Ny analys" description="Kör din första skatteanalys." title="Inga sparade analyser" />
          ) : (
            taxAnalyses.map((analysis) => (
              <Link className="block rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/80 p-4" href={`/skatteplanering/result/${analysis.id}`} key={analysis.id}>
                <p className="font-semibold">{analysis.result.strategies?.[0]?.title || "Skatteanalys"}</p>
                <p className="mt-1 text-(--muted) text-sm">{new Date(analysis.createdAt).toLocaleString("sv-SE")}</p>
              </Link>
            ))
          )}
        </section>
      ) : null}
    </div>
  );
}

export function AccountPageShell({ user, children }: { user: SessionUser | null; children: React.ReactNode }) {
  return (
    <>
      <Breadcrumbs items={[{ href: "/", label: "Start" }, { label: "Mina spår" }]} />
      <div className="shell space-y-8 pb-20 pt-4 md:pt-6">
        <section className="space-y-4">
          <p className="eyebrow">Ditt konto</p>
          <h1 className="font-title text-5xl leading-none sm:text-6xl">Mina spår</h1>
          <p className="max-w-2xl text-(--muted) text-lg leading-8">
            {user ? `Inloggad som ${user.name || user.email}.` : "Logga in för att samla batcher, rapporter och analyser."}
          </p>
        </section>
        {children}
      </div>
    </>
  );
}
