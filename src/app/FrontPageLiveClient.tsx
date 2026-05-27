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
  apiReady?: boolean;
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

const toneClasses = {
  teal: "tone-teal",
  amber: "tone-amber",
  ink: "tone-ink",
};

const lifecycleLabels: Record<string, string> = {
  LEGAL_REVIEW: "UNDER TRYCK",
  PROCESSING: "I RÖRELSE",
  MODERATION: "INKOMMET",
  PUBLISHED: "UTE",
  DRAFT: "UTKAST",
  DRAFTED: "UTKAST",
  SUBMITTED: "UTSKICKAT",
};

const severityLabels: Record<string, string> = {
  CRITICAL: "MAXTRYCK",
  HIGH: "HÖG",
  MEDIUM: "MELLAN",
  LOW: "LÅG",
  PROCESSING: "I RÖRELSE",
};

const startPoints = [
  {
    eyebrow: "Utforska",
    title: "Profiler, tidslinjer och myndighetsytor",
    summary: "Gå hit när du vill hitta en person, följa en myndighet eller vända ett namn till ett öppet spår på kortast möjliga väg.",
    href: "/overvakningsspegeln",
    cta: "Öppna frontlinjen",
    tone: "teal" as const,
  },
  {
    eyebrow: "Agera",
    title: "Batcher, överklaganden och nästa steg",
    summary: "När myndigheter fastnar i blanketter eller mörkar svar är det här du bygger batcherna som pressar tillbaka.",
    href: "/byrakrati-bombaren",
    cta: "Öppna motverktygen",
    tone: "amber" as const,
  },
  {
    eyebrow: "Bidra",
    title: "Rapporter, video och vittnesmål",
    summary: "För användare som kommer med material, inte tillstånd. Samlar tips, videobevis och publik respons i samma lager.",
    href: "/myndighetsgranskaren",
    cta: "Skicka in moteld",
    tone: "ink" as const,
  },
  {
    eyebrow: "Jämför",
    title: "Leaderboard, scorecards och trender",
    summary: "När du vill mäta trycket mellan flera myndigheter i stället för att fastna i en enskild profil.",
    href: "/insynsindex",
    cta: "Öppna indexet",
    tone: "teal" as const,
  },
];

const workspaceGroups = [
  {
    eyebrow: "Upptäck",
    title: "Se vad som händer och vem det berör.",
    description:
      "Övervakningsspegeln och Insynsindex hör ihop. Den ena går på djupet i profiler och myndigheter, den andra visar var trycket sprider sig.",
    tone: "teal" as const,
    links: [
      { href: "/overvakningsspegeln/sok", label: "Profilsök" },
      { href: "/overvakningsspegeln/autoritet", label: "Myndighetskatalog" },
      { href: "/insynsindex", label: "Scorecards" },
    ],
  },
  {
    eyebrow: "Agera",
    title: "Starta batcher och generera nästa drag.",
    description:
      "Byråkrati-bombaren är navet för batcher. Dokument, utskick och usage-köp ligger i samma arbetsyta när du vill gå från ilska till handling.",
    tone: "amber" as const,
    links: [
      { href: "/byrakrati-bombaren", label: "Massutskick" },
      { href: "/prissattning", label: "Usage och planer" },
      { href: "/skatteplanering", label: "Skatteplanering" },
    ],
  },
  {
    eyebrow: "Bidra",
    title: "Skicka in rapporter och videobevis.",
    description:
      "Rapportflödena ligger bredvid varandra så att användaren väljer format först: text, dokument eller video som spräcker myndigheternas egen version.",
    tone: "ink" as const,
    links: [
      { href: "/myndighetsgranskaren", label: "Rapportera ärende" },
      { href: "/reverse-surveillance", label: "Ladda upp video" },
      { href: "/folkets-domstol", label: "Publik respons" },
    ],
  },
  {
    eyebrow: "Fördjupa",
    title: "Läs wiki, folkets signaler och öppna data.",
    description:
      "Community-ytorna blir starkare när de ligger nära varandra: wiki, API och folkets signaler bygger samma motbild från olika håll.",
    tone: "teal" as const,
    links: [
      { href: "/statens-svagheter", label: "Wiki" },
      { href: "/api-dokumentation", label: "API" },
      { href: "/guider", label: "Arbetsytor" },
    ],
  },
];

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
  apiReady = true,
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
  const featuredFeed = filteredFeed.slice(0, 5);

  return (
    <div className="shell space-y-12 pb-20 pt-10 md:pt-14">
      {!apiReady ? (
        <div className="rounded-4xl border border-[rgba(194,107,20,0.18)] bg-[rgba(248,227,197,0.7)] px-5 py-4 text-sm leading-7 text-[rgb(112,65,14)] reveal">
          Backend eller databas svarar inte just nu. Kör <code className="font-mono">npm run db:seed</code> lokalt eller kontrollera drift enligt docs/driftchecklist.md.
        </div>
      ) : null}

      <section className="space-y-4 reveal">
        <p className="eyebrow">Ny här?</p>
        <h2 className="font-title text-3xl sm:text-4xl">Välj vad du vill göra — gräv, agera, bidra eller jämför.</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {startPoints.map((point) => (
            <Link className={`surface rounded-[1.6rem] p-5 transition hover:-translate-y-0.5 ${toneClasses[point.tone]}`} href={point.href} key={point.href}>
              <p className="eyebrow">{point.eyebrow}</p>
              <h3 className="mt-2 font-title text-2xl">{point.title}</h3>
              <p className="mt-2 text-(--muted) text-sm leading-6">{point.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr] xl:items-start">
        <div className="space-y-6 reveal">
          <div className="space-y-3">
            <p className="eyebrow">Spegelns kontrollrum</p>
            <h1 className="max-w-5xl font-title text-5xl leading-none sm:text-6xl lg:text-7xl">
              Här börjar trycket mot myndigheter, byråkrati och slutna rum.
            </h1>
            <p className="max-w-3xl text-(--muted) text-lg leading-8 sm:text-xl">
              Spegeln är inte ett neutralt uppslagsverk. Den är byggd för att hitta spår, vässa dem och leda vidare till rätt verktyg när makten behöver synas mer och skavas hårdare.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className="btn-primary" href="/overvakningsspegeln/sok">
              Öppna frontlinjen
            </Link>
            <Link className="btn-secondary" href="/guider">
              Se alla fronter
            </Link>
            <Link className="btn-secondary" href="/insynsindex">
              Öppna Insynsindex
            </Link>
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
            <p className="eyebrow">Börja här</p>
            <div className="mt-5 space-y-3">
              {startPoints.map((item) => (
                <Link className={`block rounded-3xl border border-[rgba(22,32,42,0.08)] p-4 transition hover:-translate-y-0.5 ${toneClasses[item.tone]}`} href={item.href} key={item.title}>
                  <p className="eyebrow">{item.eyebrow}</p>
                  <h2 className="mt-2 text-lg font-semibold">{item.title}</h2>
                  <p className="mt-2 text-(--muted) text-sm leading-6">{item.summary}</p>
                  <span className="mt-4 inline-flex text-sm font-semibold text-(--foreground)">{item.cta}</span>
                </Link>
              ))}
            </div>
          </article>

          <article className="surface rounded-4xl p-6 md:p-8 tone-amber">
            <p className="eyebrow">Just nu</p>
            <h2 className="mt-2 font-title text-4xl">Det viktigaste läget i siffror.</h2>
            <p className="mt-3 text-(--muted) text-sm leading-7">
              Börja där systemet spricker mest och hoppa vidare dit nästa tryckpunkt finns.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="metric-card">
                <p className="eyebrow">Kritiska</p>
                <p className="mt-1 text-2xl font-semibold">{feed.filter((item) => item.severity === "CRITICAL").length}</p>
              </div>
              <div className="metric-card">
                <p className="eyebrow">Rapporter</p>
                <p className="mt-1 text-2xl font-semibold">{reports.length}</p>
              </div>
              <div className="metric-card">
                <p className="eyebrow">Video</p>
                <p className="mt-1 text-2xl font-semibold">{videos.length}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="btn-primary" href="/byrakrati-bombaren">Öppna Byråkrati-bombaren</Link>
              <Link className="btn-secondary" href="/myndighetsgranskaren">Öppna rapportflödet</Link>
            </div>
          </article>
        </aside>
      </section>

      <section className="space-y-5 reveal">
        <div>
          <p className="eyebrow">Produktkarta</p>
          <h2 className="mt-2 font-title text-4xl sm:text-5xl">Fyra fronter som gör resten av sajten begriplig.</h2>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {workspaceGroups.map((group, index) => (
            <article className={`surface rounded-4xl p-6 md:p-8 ${toneClasses[group.tone]} reveal`} key={group.title} style={{ animationDelay: `${index * 90}ms` }}>
              <p className="eyebrow">{group.eyebrow}</p>
              <h3 className="mt-3 font-title text-4xl">{group.title}</h3>
              <p className="mt-4 text-(--muted) text-sm leading-7">{group.description}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs">
                {group.links.map((link) => (
                  <Link className="tag transition hover:-translate-y-0.5" href={link.href} key={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr] xl:items-start">
        <div className="space-y-5 reveal">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Liveöversikt</p>
              <h2 className="mt-2 font-title text-4xl sm:text-5xl">Spåren som biter hårdast just nu.</h2>
            </div>
            <p className="text-(--muted) text-sm">Uppdaterad {new Intl.DateTimeFormat("sv-SE", { timeStyle: "short", dateStyle: "medium" }).format(new Date(lastUpdated))}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              ["all", "Alla"],
              ["high", "Hög prioritet"],
              ["critical", "Kritiska"],
              ["video", "Video"],
              ["review", "Under tryck"],
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
            {featuredFeed.map((item) => (
              <article className="surface rounded-4xl p-5 md:p-6" key={item.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="eyebrow">{item.kind === "video" ? "Reverse Surveillance" : "Myndighetsgranskaren"}</p>
                    <h3 className="font-title text-3xl leading-tight">{item.title}</h3>
                    <p className="text-(--muted) text-sm leading-7">{item.summary}</p>
                  </div>
                  <span className="tag">{severityLabels[item.severity] || item.severity}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {item.authorityName ? <span className="tag">{item.authorityName}</span> : null}
                  {item.officialName ? <span className="tag">{item.officialName}</span> : null}
                  {item.tags.map((tag) => (
                    <span className="tag" key={`${item.id}-${tag}`}>{lifecycleLabels[tag] || severityLabels[tag] || tag}</span>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link className="btn-primary" href={item.href}>Öppna flöde</Link>
                  {item.secondaryHref ? <Link className="btn-secondary" href={item.secondaryHref}>Visa myndighetsyta</Link> : null}
                </div>
              </article>
            ))}
            {featuredFeed.length === 0 ? (
              <div className="surface rounded-4xl p-6 text-(--muted) text-sm leading-7">
                Inga spår matchar de aktiva filtren just nu.
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Link className="btn-secondary" href="/overvakningsspegeln">
                Öppna frontlinjen
              </Link>
              <Link className="btn-secondary" href="/myndighetsgranskaren">
                Visa hela rapportflödet
              </Link>
            </div>
          </div>
        </div>

        <aside className="space-y-4 reveal" style={{ animationDelay: "120ms" }}>
          <article className="surface rounded-4xl p-6 md:p-8">
            <p className="eyebrow">Mest omstridda</p>
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

          <article className="surface rounded-4xl p-6 md:p-8 tone-teal">
            <p className="eyebrow">Myndigheter att följa</p>
            <div className="mt-5 space-y-3">
              {authorities.slice(0, 3).map((authority) => (
                <Link className="block rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/75 p-4 transition hover:-translate-y-0.5" href={`/overvakningsspegeln/autoritet#${authority.slug}`} key={authority.id}>
                  <h2 className="text-lg font-semibold">{authority.name}</h2>
                  <p className="mt-2 text-(--muted) text-sm leading-7">{authority.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="tag">{authority.totalSignals} signaler</span>
                    <span className="tag">{authority.openAlerts} alerts</span>
                  </div>
                </Link>
              ))}
            </div>
            <Link className="btn-secondary mt-6 w-full" href="/overvakningsspegeln/autoritet">Öppna myndighetskatalogen</Link>
          </article>

          <article className="surface-strong rounded-4xl p-6 md:p-8">
            <p className="eyebrow">Fördjupa dig</p>
            <h2 className="mt-2 font-title text-4xl">Wiki, video och nästa lager av material.</h2>
            <div className="mt-5 space-y-3">
              {wikiPages.slice(0, 2).map((page) => (
                <Link className="block rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/75 p-4 transition hover:-translate-y-0.5" href="/statens-svagheter" key={page.id}>
                  <h3 className="text-lg font-semibold">{page.title}</h3>
                  <p className="mt-2 text-(--muted) text-sm leading-7">{page.summary}</p>
                </Link>
              ))}
              {videos.slice(0, 1).map((item) => (
                <Link className="block rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/75 p-4 transition hover:-translate-y-0.5" href="/reverse-surveillance" key={item.id}>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-(--muted) text-sm leading-7">{item.riskSummary}</p>
                </Link>
              ))}
            </div>
            <div className="mt-6 grid gap-3">
              <Link className="btn-primary" href="/login">Skapa konto</Link>
              <Link className="btn-secondary" href="/prissattning">Se planer och finansiering</Link>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}