import type { Metadata } from "next";
import Link from "next/link";
import { DashboardPanel } from "@/components/watchdog/DashboardPanel";
import { LeaderboardPanel } from "@/components/watchdog/LeaderboardPanel";
import { ScorecardGrid } from "@/components/watchdog/ScorecardGrid";
import { getAuthorityScorecards, getDashboardSnapshot, getLeaderboard } from "@/lib/public-insights";

export const metadata: Metadata = {
  title: "Insynsindex",
  description: "Publik leaderboard, realtidsdashboard och reproducerbara myndighetsscorecards för Spegeln.",
};

export default async function InsynsindexPage() {
  const [weeklyLeaderboard, dashboardItems, scorecards] = await Promise.all([
    getLeaderboard("weekly", "SE"),
    getDashboardSnapshot({ countryCode: "SE", period: "30d" }),
    getAuthorityScorecards({ countryCode: "SE", period: "30d" }),
  ]);

  return (
    <div className="shell space-y-10 pb-20 pt-10 md:pt-14">
      <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
        <div className="space-y-5 reveal">
          <p className="eyebrow">Publik watchdog</p>
          <h1 className="max-w-4xl font-title text-5xl leading-none sm:text-6xl">
            Pseudonymiserad ranking, levande myndighetsflöden och öppna scorecards i samma publikvy.
          </h1>
          <p className="max-w-2xl text-(--muted) text-lg leading-8">
            Insynsindex samlar plattformens mest samhällsnyttiga signaler utan att exponera persondata. Allt som visas här bygger på aggregerade, GDPR-anpassade mätvärden och tydliga formler.
          </p>
        </div>
        <article className="surface-strong rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "120ms" }}>
          <p className="eyebrow">Öppet API</p>
          <h2 className="mt-3 font-title text-4xl">Bygg på datan utan att röra känsliga uppgifter.</h2>
          <p className="mt-4 text-(--muted) text-sm leading-7">
            Tredjepartsutvecklare kan registrera API-nycklar för anonymiserade leaderboardvärden, dashboardaggregeringar och scorecards. OpenAPI-specen finns som JSON och FastAPI-workern exponerar separat AI-dokumentation.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="btn-primary" href="/api/public/openapi">
              OpenAPI JSON
            </Link>
            <Link className="btn-secondary" href="/skatteplanering">
              Skatteplaneringsmaskinen
            </Link>
          </div>
        </article>
      </section>

      <LeaderboardPanel items={weeklyLeaderboard} title="Veckans mest effektiva användare" windowLabel="Vecka" />
      <DashboardPanel items={dashboardItems} />
      <ScorecardGrid items={scorecards} />

      <section className="grid gap-4 lg:grid-cols-4 md:grid-cols-2">
        {[
          {
            href: "/myndighetsgranskaren",
            title: "Myndighetsgranskaren",
            summary: "Anonym rapportering, AI-triage, pressutkast och moderation för allvarliga myndighetsärenden.",
          },
          {
            href: "/folkets-domstol",
            title: "Folkets domstol",
            summary: "Publik förtroendevotering, trenddata och modererade vittnesmål om myndigheter och tjänstemän.",
          },
          {
            href: "/statens-svagheter",
            title: "Statens svagheter",
            summary: "Versionsstyrd community-wiki för kryphål, processmönster och byråkratiska sårbarheter.",
          },
          {
            href: "/reverse-surveillance",
            title: "Reverse Surveillance",
            summary: "Skyddad videointag med redaktionskö, maskningsplaner och kontrollerad delningslogik.",
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
        <p className="eyebrow">Sekretess och efterlevnad</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="metric-card">
            <h2 className="text-xl font-semibold">Pseudonymisering</h2>
            <p className="mt-2 text-(--muted) text-sm leading-7">Leaderboarden använder publika alias eller genererade identiteter. E-post, riktiga namn och andra identifierare lämnar aldrig de interna tabellerna.</p>
          </div>
          <div className="metric-card">
            <h2 className="text-xl font-semibold">Jurisdiktion</h2>
            <p className="mt-2 text-(--muted) text-sm leading-7">Myndigheter, användare och mallar kan taggas per land och region. Det gör det möjligt att hålla separata metodiker för EU, USA eller andra rättsordningar.</p>
          </div>
          <div className="metric-card">
            <h2 className="text-xl font-semibold">Reproducerbarhet</h2>
            <p className="mt-2 text-(--muted) text-sm leading-7">Scorecards versionsstyrs. När beräkningen uppdateras kan både tidigare och nya resultat visas sida vid sida i samma datamodell.</p>
          </div>
        </div>
      </section>
    </div>
  );
}