"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type {
  ConfidenceBoardEntry,
  FailureReportView,
  ReverseSurveillanceView,
  WikiPageView,
} from "@/lib/civic-features";
import type { WatchAuthorityCard, WatchdogSnapshot } from "@/lib/watchdog";

type FeedFilter = "all" | "high" | "critical" | "video" | "review";

type Props = {
  initialReports: FailureReportView[];
  initialVideos: ReverseSurveillanceView[];
  confidenceBoard: ConfidenceBoardEntry[];
  wikiPages: WikiPageView[];
  snapshot: WatchdogSnapshot;
  authorities: WatchAuthorityCard[];
};

type FeedItem = {
  id: string;
  kind: "report" | "video";
  title: string;
  summary: string;
  authorityName?: string;
  authorityCategory?: string;
  officialName?: string;
  createdAt: string;
  severity: string;
  status: string;
  href: string;
  secondaryHref?: string;
  tags: string[];
};

function severityPriority(value: string) {
  if (value === "CRITICAL") return 3;
  if (value === "HIGH") return 2;
  if (value === "MEDIUM") return 1;
  return 0;
}

function buildFeed(reports: FailureReportView[], videos: ReverseSurveillanceView[]) {
  const reportItems: FeedItem[] = reports.map((item) => ({
    id: `report-${item.id}`,
    kind: "report",
    title: item.title,
    summary: item.aiSummary || item.summary,
    authorityName: item.authorityName,
    authorityCategory: item.authorityCategory,
    officialName: item.officialName,
    createdAt: item.createdAt,
    severity: item.aiSeverity,
    status: item.lifecycleStatus,
    href: "/myndighetsgranskaren",
    secondaryHref: item.authoritySlug ? `/overvakningsspegeln/autoritet#${item.authoritySlug}` : undefined,
    tags: [item.aiSeverity, item.lifecycleStatus, item.authorityCategory || "Signal"].filter(Boolean),
  }));

  const videoItems: FeedItem[] = videos.map((item) => ({
    id: `video-${item.id}`,
    kind: "video",
    title: item.title,
    summary: item.riskSummary,
    authorityName: item.authorityName,
    authorityCategory: item.authorityCategory,
    officialName: item.officialName,
    createdAt: item.createdAt,
    severity: item.redactionStatus,
    status: item.lifecycleStatus,
    href: "/reverse-surveillance",
    secondaryHref: item.authoritySlug ? `/overvakningsspegeln/autoritet#${item.authoritySlug}` : undefined,
    tags: ["VIDEO", item.redactionStatus, item.lifecycleStatus, item.authorityCategory || "Video"].filter(Boolean),
  }));

  return [...reportItems, ...videoItems].sort((left, right) => {
    const priorityDelta = severityPriority(right.severity) - severityPriority(left.severity);
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

export function FrontPageLiveClient({
  initialReports,
  initialVideos,
  confidenceBoard,
  wikiPages,
  snapshot,
  authorities,
}: Props) {
  const [reports, setReports] = useState(initialReports);
  const [videos, setVideos] = useState(initialVideos);
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());

  useEffect(() => {
    let active = true;

    async function refresh() {
      try {
        const [reportsResponse, videosResponse] = await Promise.all([
          fetch("/api/myndighetsgranskaren/reports", { cache: "no-store" }),
          fetch("/api/reverse-surveillance/submissions", { cache: "no-store" }),
        ]);

        if (!active) {
          return;
        }

        const reportsPayload = (await reportsResponse.json()) as { items?: FailureReportView[] };
        const videosPayload = (await videosResponse.json()) as { items?: ReverseSurveillanceView[] };

        if (Array.isArray(reportsPayload.items)) {
          setReports(reportsPayload.items);
        }

        if (Array.isArray(videosPayload.items)) {
          setVideos(videosPayload.items);
        }

        setLastUpdated(new Date().toISOString());
      } catch {
      }
    }

    const intervalId = window.setInterval(() => {
      void refresh();
    }, 30000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const feed = buildFeed(reports, videos);
  const categoryOptions = Array.from(new Set(feed.map((item) => item.authorityCategory).filter(Boolean))) as string[];
  const filteredFeed = feed.filter((item) => {
    if (feedFilter === "high" && !["HIGH", "CRITICAL"].includes(item.severity)) {
      return false;
    }

    if (feedFilter === "critical" && item.severity !== "CRITICAL") {
      return false;
    }

    if (feedFilter === "video" && item.kind !== "video") {
      return false;
    }

    if (feedFilter === "review" && !["LEGAL_REVIEW", "PROCESSING"].includes(item.status)) {
      return false;
    }

    if (categoryFilter !== "all" && item.authorityCategory !== categoryFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="shell space-y-10 pb-20 pt-10 md:pt-14">
      <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr] xl:items-start">
        <div className="space-y-6 reveal">
          <div className="space-y-3">
            <p className="eyebrow">Livefront för myndighetsgranskning</p>
            <h1 className="max-w-5xl font-title text-5xl leading-none sm:text-6xl lg:text-7xl">
              Spegeln visar vad som rör sig i systemet just nu.
            </h1>
            <p className="max-w-3xl text-(--muted) text-lg leading-8 sm:text-xl">
              När makten mörkar, börjar dokumenten tala. Här möts feeden för nya granskningsärenden, videointag, publika alerts och de myndighetsytor som drar mest uppmärksamhet just nu.
            </p>
          </div>

          <form action="/overvakningsspegeln/sok" className="surface rounded-4xl p-4 md:p-5">
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-(--foreground)">Sök person, myndighet eller ärende</span>
                <input className="input" name="q" placeholder="Skriv namn, myndighet, titel eller ärendeord" type="search" />
              </label>
              <button className="btn-primary md:mt-6" type="submit">Öppna sök</button>
            </div>
          </form>

          <div className="grid gap-4 sm:grid-cols-4">
            <article className="metric-card">
              <p className="text-3xl font-semibold">{snapshot.totalTrackedRecords}</p>
              <p className="mt-2 text-sm font-medium">Spårade signaler</p>
            </article>
            <article className="metric-card">
              <p className="text-3xl font-semibold">{snapshot.authoritiesCovered}</p>
              <p className="mt-2 text-sm font-medium">Myndighetsytor</p>
            </article>
            <article className="metric-card">
              <p className="text-3xl font-semibold">{snapshot.publishedReports}</p>
              <p className="mt-2 text-sm font-medium">Rapporter</p>
            </article>
            <article className="metric-card">
              <p className="text-3xl font-semibold">{snapshot.liveAlerts}</p>
              <p className="mt-2 text-sm font-medium">Aktiva alerts</p>
            </article>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {snapshot.publicSourceFamilies.map((family) => (
              <span className="tag" key={family}>{family}</span>
            ))}
          </div>
        </div>

        <aside className="space-y-4 reveal" style={{ animationDelay: "120ms" }}>
          <article className="surface-strong rounded-4xl p-6 md:p-8">
            <p className="eyebrow">Mest omdebatterade just nu</p>
            <div className="mt-5 space-y-3">
              {confidenceBoard.slice(0, 4).map((entry) => (
                <Link className="block rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/75 p-4 transition hover:-translate-y-0.5" href={`/overvakningsspegeln/sok?q=${encodeURIComponent(entry.targetLabel)}`} key={entry.targetId}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{entry.targetLabel}</h2>
                      <p className="mt-1 text-(--muted) text-sm">{entry.kind === "official" ? "Tjänsteroll" : "Myndighetsyta"}</p>
                    </div>
                    <span className="tag">{entry.confidenceScore}%</span>
                  </div>
                </Link>
              ))}
            </div>
          </article>

          <article className="surface rounded-4xl p-6 md:p-8 tone-amber">
            <p className="eyebrow">Mass action</p>
            <h2 className="mt-2 font-title text-4xl">Starta nästa batch direkt från arbetsytan.</h2>
            <p className="mt-3 text-(--muted) text-sm leading-7">
              Byråkrati-bombaren är kopplad till riktiga batch-, usage- och leveransflöden. Det som saknas är bara dina produktionsnycklar och transportuppgifter.
            </p>
            <Link className="btn-primary mt-6 w-full" href="/byrakrati-bombaren">Öppna Byråkrati-bombaren</Link>
          </article>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr] xl:items-start">
        <div className="space-y-5 reveal">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Live feed</p>
              <h2 className="mt-2 font-title text-4xl sm:text-5xl">Senaste signaler, misslyckanden och videointag.</h2>
            </div>
            <p className="text-(--muted) text-sm">Uppdaterad {new Intl.DateTimeFormat("sv-SE", { timeStyle: "short", dateStyle: "medium" }).format(new Date(lastUpdated))}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              ["all", "Alla"],
              ["high", "Hög prioritet"],
              ["critical", "Kritiska"],
              ["video", "Video"],
              ["review", "Under review"],
            ].map(([value, label]) => (
              <button
                className={feedFilter === value ? "btn-primary" : "btn-secondary"}
                key={value}
                onClick={() => setFeedFilter(value as FeedFilter)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button className={categoryFilter === "all" ? "btn-primary" : "btn-secondary"} onClick={() => setCategoryFilter("all")} type="button">
              Alla kategorier
            </button>
            {categoryOptions.map((category) => (
              <button className={categoryFilter === category ? "btn-primary" : "btn-secondary"} key={category} onClick={() => setCategoryFilter(category)} type="button">
                {category}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredFeed.map((item) => (
              <article className="surface rounded-4xl p-5 md:p-6" key={item.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="eyebrow">{item.kind === "video" ? "Reverse Surveillance" : "Myndighetsgranskaren"}</p>
                    <h3 className="font-title text-3xl leading-tight">{item.title}</h3>
                    <p className="text-(--muted) text-sm leading-7">{item.summary}</p>
                  </div>
                  <span className="tag">{item.severity}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {item.authorityName ? <span className="tag">{item.authorityName}</span> : null}
                  {item.officialName ? <span className="tag">{item.officialName}</span> : null}
                  {item.tags.map((tag) => (
                    <span className="tag" key={`${item.id}-${tag}`}>{tag}</span>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link className="btn-primary" href={item.href}>Öppna flöde</Link>
                  {item.secondaryHref ? <Link className="btn-secondary" href={item.secondaryHref}>Visa myndighetsyta</Link> : null}
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-4 reveal" style={{ animationDelay: "120ms" }}>
          <article className="surface rounded-4xl p-6 md:p-8">
            <p className="eyebrow">Hot loopholes</p>
            <div className="mt-5 space-y-3">
              {wikiPages.slice(0, 4).map((page) => (
                <Link className="block rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/75 p-4 transition hover:-translate-y-0.5" href="/statens-svagheter" key={page.id}>
                  <h2 className="text-lg font-semibold">{page.title}</h2>
                  <p className="mt-2 text-(--muted) text-sm leading-7">{page.summary}</p>
                </Link>
              ))}
            </div>
          </article>

          <article className="surface rounded-4xl p-6 md:p-8 tone-teal">
            <p className="eyebrow">Reverse surveillance</p>
            <div className="mt-5 space-y-3">
              {videos.slice(0, 2).map((item) => (
                <div className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/75 p-4" key={item.id}>
                  <h2 className="text-lg font-semibold">{item.title}</h2>
                  <p className="mt-2 text-(--muted) text-sm leading-7">{item.riskSummary}</p>
                </div>
              ))}
            </div>
            <Link className="btn-secondary mt-6 w-full" href="/reverse-surveillance">Ladda upp din egen</Link>
          </article>

          <article className="surface-strong rounded-4xl p-6 md:p-8">
            <p className="eyebrow">Join the resistance</p>
            <h2 className="mt-2 font-title text-4xl">Skapa konto, bidra med material eller stötta driften.</h2>
            <p className="mt-3 text-(--muted) text-sm leading-7">
              Plattformen är redo för Vercel som frontend och Railway som backend. Auth, betalning, AI-worker och offentliga API-endpoints finns redan i koden och väntar bara på produktionsnycklar.
            </p>
            <div className="mt-6 grid gap-3">
              <Link className="btn-primary" href="/login">Skapa konto</Link>
              <Link className="btn-secondary" href="/prissattning">Se planer och stöd</Link>
            </div>
          </article>
        </aside>
      </section>

      <section className="grid gap-4 lg:grid-cols-3 reveal">
        {authorities.slice(0, 3).map((authority) => (
          <Link className="surface rounded-4xl p-6 transition hover:-translate-y-0.5" href={`/overvakningsspegeln/autoritet#${authority.slug}`} key={authority.id}>
            <p className="eyebrow">{authority.category}</p>
            <h2 className="mt-2 font-title text-3xl">{authority.name}</h2>
            <p className="mt-3 text-(--muted) text-sm leading-7">{authority.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="tag">{authority.totalSignals} signaler</span>
              <span className="tag">{authority.publishedReports} rapporter</span>
              <span className="tag">{authority.openAlerts} alerts</span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}