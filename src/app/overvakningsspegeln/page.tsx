import Link from "next/link";
import { getProtestModule } from "@/lib/module-manifest";
import type { WatchAuthorityCard, WatchdogSnapshot, WatchPublicRecordFeedItem } from "@/lib/watchdog";
import { serverApiJson } from "@/lib/server-api";

const mod = getProtestModule("overvakningsspegeln")!;

export const metadata = {
  title: mod.shortTitle,
  description: mod.description,
};

export default async function OvervakningsspegelnPage() {
  const [snapshotResponse, authoritiesResponse, feedResponse] = await Promise.all([
    serverApiJson<{ snapshot: WatchdogSnapshot }>("/api/watchdog/snapshot"),
    serverApiJson<{ items: WatchAuthorityCard[] }>("/api/watchdog/authorities"),
    serverApiJson<{ items: WatchPublicRecordFeedItem[] }>("/api/watchdog/feed"),
  ]);
  const snapshot = snapshotResponse.snapshot;
  const authorities = authoritiesResponse.items;
  const feedItems = feedResponse.items;
  const entryPoints = [
    {
      eyebrow: "Sök",
      title: "Hitta profiler och gå från namn till tidslinje.",
      summary: "Profilsöket är snabbaste vägen in när du redan vet vem eller vad du vill börja pressa vidare.",
      href: "/overvakningsspegeln/sok",
      cta: "Öppna profilsök",
    },
    {
      eyebrow: "Bevaka",
      title: "Följ myndigheter i stället för enskilda poster.",
      summary: "Myndighetskatalogen gör det lättare att följa ett helt område när problemet sitter i institutionen, inte bara i en enskild post.",
      href: "/overvakningsspegeln/autoritet",
      cta: "Öppna myndighetskatalog",
    },
    {
      eyebrow: "Jämför",
      title: "Gå vidare till index och scorecards.",
      summary: "När frågan gäller sprickor mellan flera myndigheter är Insynsindex rätt nästa steg från upptäcktsläget.",
      href: "/insynsindex",
      cta: "Öppna Insynsindex",
    },
  ];

  return (
    <div className="shell space-y-16 pb-20 pt-10 md:pt-14">
      <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
        <div className="space-y-5 reveal">
          <p className="eyebrow">{mod.eyebrow}</p>
          <h1 className="max-w-4xl font-title text-5xl leading-none sm:text-6xl">{mod.title}</h1>
          <p className="max-w-3xl text-(--muted) text-lg leading-8">
            {mod.description} {mod.extremLangfinger}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="btn-primary" href="/overvakningsspegeln/sok">
              Sök profil
            </Link>
            <Link className="btn-secondary" href="/overvakningsspegeln/autoritet">
              Bevaka myndigheter
            </Link>
            <Link className="btn-secondary" href="/insynsindex">
              Jämför i indexet
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
              <p className="mt-2 text-sm font-medium">Profilsatta tjänsteroller</p>
            </div>
            <div className="metric-card">
              <p className="text-3xl font-semibold">{snapshot.liveAlerts}</p>
              <p className="mt-2 text-sm font-medium">Aktiva alerts</p>
            </div>
          </div>
          <p className="mt-5 text-(--muted) text-sm leading-7">{snapshot.dailySyncCoverage}</p>
          <div className="mt-6 rounded-3xl bg-[rgba(22,32,42,0.94)] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.28em] text-white/60">Så används läget</p>
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

      <section className="grid gap-4 md:grid-cols-3">
        {entryPoints.map((card, index) => (
          <Link className="surface rounded-[1.9rem] p-6 transition hover:-translate-y-0.5 reveal" href={card.href} key={card.title} style={{ animationDelay: `${index * 90}ms` }}>
            <p className="eyebrow">{card.eyebrow}</p>
            <h2 className="mt-3 font-title text-3xl">{card.title}</h2>
            <p className="mt-4 text-(--muted) text-sm leading-7">{card.summary}</p>
            <span className="mt-6 inline-flex text-sm font-semibold text-(--foreground)">{card.cta}</span>
          </Link>
        ))}
      </section>

      <section className="space-y-5 reveal">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Live från pipelinen</p>
            <h2 className="mt-2 font-title text-4xl">Senaste offentliga registerposter — med källlänk.</h2>
          </div>
          <Link className="btn-secondary" href="/overvakningsspegeln/sok">
            Gå till profilsök
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {feedItems.length === 0 ? (
            <article className="surface rounded-[1.9rem] p-6 text-(--muted) text-sm leading-7 lg:col-span-2">
              Inga automatiska registerposter ännu. Kör ingestion via admin eller vänta på schemalagd cron.
            </article>
          ) : (
            feedItems.slice(0, 8).map((item) => (
              <article className="surface rounded-[1.9rem] p-6" key={item.id}>
                <p className="eyebrow">{item.category} · {item.connectorKey}</p>
                <h3 className="mt-2 font-title text-2xl">{item.title}</h3>
                <p className="mt-3 text-(--muted) text-sm leading-7">{item.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {item.officialName ? (
                    <Link className="tag" href={`/overvakningsspegeln/profil/${item.officialId}`}>
                      {item.officialName}
                    </Link>
                  ) : null}
                  {item.authorityName ? <span className="tag">{item.authorityName}</span> : null}
                  <span className="tag">
                    {new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.publishedAt))}
                  </span>
                </div>
                {item.sourceUrl ? (
                  <a className="btn-secondary mt-4 inline-flex text-sm" href={item.sourceUrl} rel="noreferrer" target="_blank">
                    Källa: offentlig registerlänk
                  </a>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>

      <section className="space-y-5 reveal">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Bevakade myndigheter</p>
            <h2 className="mt-2 font-title text-4xl">Myndighetsytor med daglig synk och tydlig nästa presspunkt.</h2>
          </div>
          <Link className="btn-secondary" href="/overvakningsspegeln/autoritet">
            Öppna myndighetskatalog
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {authorities.slice(0, 6).map((authority) => (
            <Link className="surface rounded-[1.9rem] p-6 transition hover:-translate-y-0.5" href={`/overvakningsspegeln/autoritet#${authority.slug}`} key={authority.id}>
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
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
