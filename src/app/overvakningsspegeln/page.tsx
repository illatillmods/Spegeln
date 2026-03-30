import Link from "next/link";
import { getWatchdogAuthorities, getWatchdogSnapshot } from "@/lib/watchdog";

export const metadata = {
  title: "Övervakningsspegeln",
  description: "Daglig aggregering, korrelationskartor, kronologiska profiler och watch alerts för offentliga beslutsflöden.",
};

const capabilityCards = [
  {
    title: "Levande myndighetsfeed",
    summary: "Samlar alerts, klagomål, rapporter och nya granskningsärenden i samma liveyta.",
  },
  {
    title: "Profiler per tjänsteroll",
    summary: "Varje profil visar vad som faktiskt finns i databasen: klagomål, rapporter, källfamiljer och öppna alerts.",
  },
  {
    title: "Tidslinje per aktör",
    summary: "Nya alerts, rapporter och ärenden byggs till en sammanhängande kronologi för snabb triage.",
  },
  {
    title: "Watch alerts",
    summary: "Bevaka myndigheter och profiler för att få notiser när nya signaler registreras i plattformen.",
  },
];

export default async function OvervakningsspegelnPage() {
  const [snapshot, authorities] = await Promise.all([getWatchdogSnapshot(), getWatchdogAuthorities()]);

  return (
    <div className="shell space-y-16 pb-20 pt-10 md:pt-14">
      <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
        <div className="space-y-5 reveal">
          <p className="eyebrow">Publik watchdog</p>
          <h1 className="max-w-4xl font-title text-5xl leading-none sm:text-6xl">
            Livevyn för myndighetssignaler, profiler och öppna granskningsflöden.
          </h1>
          <p className="max-w-3xl text-(--muted) text-lg leading-8">
            Övervakningsspegeln läser den riktiga datamodellen i Spegeln och visar hur alerts, klagomål, rapporter och bevakade källfamiljer utvecklas över tid.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="btn-primary" href="/overvakningsspegeln/sok">
              Sök profil
            </Link>
            <Link className="btn-secondary" href="/overvakningsspegeln/autoritet">
              Bevaka myndigheter
            </Link>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {snapshot.publicSourceFamilies.map((source) => (
              <span className="tag" key={source}>
                {source}
              </span>
            ))}
          </div>
        </div>

        <article className="surface-strong rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "120ms" }}>
          <p className="eyebrow">Täckning just nu</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="metric-card">
              <p className="text-3xl font-semibold">{snapshot.totalTrackedRecords}</p>
              <p className="mt-2 text-sm font-medium">Spårade signaler</p>
            </div>
            <div className="metric-card">
              <p className="text-3xl font-semibold">{snapshot.officialsCovered}</p>
              <p className="mt-2 text-sm font-medium">Profilsatta aktörer</p>
            </div>
            <div className="metric-card">
              <p className="text-3xl font-semibold">{snapshot.liveAlerts}</p>
              <p className="mt-2 text-sm font-medium">Aktiva alerts</p>
            </div>
          </div>
          <p className="mt-5 text-(--muted) text-sm leading-7">{snapshot.dailySyncCoverage}</p>
          <div className="mt-6 rounded-3xl bg-[rgba(22,32,42,0.94)] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.28em] text-white/60">Skyddsräcken</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-white/80">
              {snapshot.guardrails.map((item) => (
                <li className="flex gap-3" key={item}>
                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-white" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {capabilityCards.map((card, index) => (
          <article className="surface rounded-[1.9rem] p-6 reveal" key={card.title} style={{ animationDelay: `${index * 90}ms` }}>
            <p className="eyebrow">Funktion</p>
            <h2 className="mt-3 font-title text-3xl">{card.title}</h2>
            <p className="mt-4 text-(--muted) text-sm leading-7">{card.summary}</p>
          </article>
        ))}
      </section>

      <section className="space-y-5 reveal">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Bevakade myndigheter</p>
            <h2 className="mt-2 font-title text-4xl">Myndighetsytor med daglig synk och watch alerts.</h2>
          </div>
          <Link className="btn-secondary" href="/overvakningsspegeln/autoritet">
            Öppna myndighetskatalog
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {authorities.map((authority) => (
            <article className="surface rounded-[1.9rem] p-6" key={authority.id}>
              <p className="eyebrow">{authority.category}</p>
              <h3 className="mt-2 font-title text-3xl">{authority.name}</h3>
              <p className="mt-3 text-(--muted) text-sm leading-7">{authority.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="tag">{authority.monitoredOfficials} profiler</span>
                <span className="tag">{authority.totalSignals} signaler</span>
                <span className="tag">{authority.publishedReports} rapporter</span>
                <span className="tag">{authority.openAlerts} alerts</span>
              </div>
              <p className="mt-4 text-(--muted) text-sm">
                Senaste sync {new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(authority.lastSyncAt))}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
