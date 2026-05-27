import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { DashboardPanel } from "@/components/watchdog/DashboardPanel";
import { LeaderboardPanel } from "@/components/watchdog/LeaderboardPanel";
import { ScorecardGrid } from "@/components/watchdog/ScorecardGrid";
import { disclosureIndexNotice } from "@/lib/disclosure-policy";
import type { AuthorityScorecardView, DashboardItem, LeaderboardEntry } from "@/lib/public-insights";
import { serverApiJsonSafe } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Insynsindex",
  description: "Publik leaderboard, realtidsdashboard och myndighetsscorecards för öppet tryck.",
};

export default async function InsynsindexPage() {
  const [leaderboardResponse, dashboardResponse, scorecardsResponse] = await Promise.all([
    serverApiJsonSafe<{ items: LeaderboardEntry[] }>("/api/insights/leaderboard?window=weekly&country=SE", { items: [] }),
    serverApiJsonSafe<{ items: DashboardItem[] }>("/api/insights/dashboard?country=SE&period=30d", { items: [] }),
    serverApiJsonSafe<{ items: AuthorityScorecardView[] }>("/api/insights/scorecards?country=SE&period=30d", { items: [] }),
  ]);
  const weeklyLeaderboard = leaderboardResponse.data.items;
  const dashboardItems = dashboardResponse.data.items;
  const scorecards = scorecardsResponse.data.items;
  const usageCards = [
    {
      title: "Hitta svaga punkter",
      summary: "Scorecards visar var svarstider, klagomål och transparens avviker från snittet.",
    },
    {
      title: "Följ trender",
      summary: "Leaderboard och dashboard hjälper dig se var trycket ökar vecka för vecka.",
    },
    {
      title: "Dela vidare",
      summary: "Exportera via API eller länka vidare till profiler och rapporter.",
    },
  ];

  return (
    <div className="shell space-y-10 pb-20 pt-10 md:pt-14">
      <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
        <div className="space-y-5 reveal">
          <p className="eyebrow">Jämför</p>
          <h1 className="max-w-4xl font-title text-5xl leading-none sm:text-6xl">
            Jämför tryck, svarstider och transparens mellan myndigheter.
          </h1>
          <p className="max-w-2xl text-(--muted) text-lg leading-8">
            {disclosureIndexNotice}
          </p>
        </div>
        <article className="surface-strong rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "120ms" }}>
          <p className="eyebrow">Nästa steg</p>
          <h2 className="mt-3 font-title text-4xl">När du vill gå djupare än indexet.</h2>
          <p className="mt-4 text-(--muted) text-sm leading-7">
            Indexet är bäst för jämförelser. När du behöver person- eller myndighetsnivå går du vidare till Övervakningsspegeln. När du behöver exportera vidare går du till API:t.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="btn-primary" href="/api/public/openapi">
              OpenAPI JSON
            </Link>
            <Link className="btn-secondary" href="/overvakningsspegeln">
              Öppna upptäcksläget
            </Link>
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {usageCards.map((item, index) => (
          <article className="surface rounded-[1.9rem] p-6 reveal" key={item.title} style={{ animationDelay: `${index * 80}ms` }}>
            <p className="eyebrow">Använd indexet för att</p>
            <h2 className="mt-2 font-title text-3xl">{item.title}</h2>
            <p className="mt-3 text-(--muted) text-sm leading-7">{item.summary}</p>
          </article>
        ))}
      </section>

      <LeaderboardPanel items={weeklyLeaderboard} title="Veckans mest effektiva användare" windowLabel="Vecka" />
      {dashboardItems.length === 0 ? (
        <EmptyState
          actionHref="/guider"
          actionLabel="Se hur indexet fylls"
          description="Kör databas-seed eller vänta tills myndighetsdata kopplats in."
          title="Ingen dashboard-data ännu"
        />
      ) : (
        <DashboardPanel items={dashboardItems} />
      )}
      {scorecards.length === 0 ? (
        <EmptyState description="Scorecards genereras när tillräckligt med klagomål och rapporter finns kopplade till myndigheter." title="Inga scorecards ännu" />
      ) : (
        <ScorecardGrid items={scorecards} />
      )}

      <section className="grid gap-4 lg:grid-cols-4 md:grid-cols-2">
        {[
          {
            href: "/myndighetsgranskaren",
            title: "Myndighetsgranskaren",
            summary: "Anonym rapportering, AI-triage och pressbara spår för allvarliga myndighetsärenden.",
          },
          {
            href: "/folkets-domstol",
            title: "Folkets domstol",
            summary: "Publik tryckmätning, trenddata och vittnesmål om myndigheter och tjänstemän.",
          },
          {
            href: "/statens-svagheter",
            title: "Statens svagheter",
            summary: "Versionsstyrd community-wiki för kryphål, processmönster och byråkratiska svaga punkter.",
          },
          {
            href: "/reverse-surveillance",
            title: "Reverse Surveillance",
            summary: "Motbilder, videospår och delningsfärdigt material som utmanar maktens egen version.",
          },
        ].map((item) => (
          <Link className="surface rounded-4xl p-6 transition hover:-translate-y-0.5" href={item.href} key={item.href}>
            <p className="eyebrow">Ny modul</p>
            <h2 className="mt-2 font-title text-3xl">{item.title}</h2>
            <p className="mt-3 text-(--muted) text-sm leading-7">{item.summary}</p>
          </Link>
        ))}
      </section>

      <section className="surface rounded-4xl p-6 md:p-8">
        <p className="eyebrow">Hur indexet håller trycket läsbart</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="metric-card">
            <h2 className="text-xl font-semibold">Alias i offentlig yta</h2>
            <p className="mt-2 text-(--muted) text-sm leading-7">Leaderboarden använder publika alias eller genererade identiteter så att fokus stannar på mönster, inte på att göra indexet onödigt trögläst.</p>
          </div>
          <div className="metric-card">
            <h2 className="text-xl font-semibold">Metodik per geografi</h2>
            <p className="mt-2 text-(--muted) text-sm leading-7">Myndigheter, användare och mallar kan taggas per land och region så att trycket kan mätas med rätt lokala kontext i ryggen.</p>
          </div>
          <div className="metric-card">
            <h2 className="text-xl font-semibold">Reproducerbarhet</h2>
            <p className="mt-2 text-(--muted) text-sm leading-7">Scorecards versionsstyrs så att gamla och nya resultat kan stå bredvid varandra när någon vill ifrågasätta modellen eller bygga vidare på den.</p>
          </div>
        </div>
      </section>
    </div>
  );
}