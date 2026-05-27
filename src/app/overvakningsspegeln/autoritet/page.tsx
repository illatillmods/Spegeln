import { WatchSubscriptionPanel } from "@/components/watchdog/WatchSubscriptionPanel";
import type { WatchAuthorityCard } from "@/lib/watchdog";
import { serverApiJson } from "@/lib/server-api";

export const metadata = {
  title: "Myndigheter | Övervakningsspegeln",
  description: "Myndighetskatalog med täckning, fokusområden och bevakningar för nya offentliga poster.",
};

export default async function AuthorityDirectoryPage() {
  const authoritiesResponse = await serverApiJson<{ items: WatchAuthorityCard[] }>("/api/watchdog/authorities");
  const authorities = authoritiesResponse.items;

  return (
    <div className="shell space-y-12 pb-20 pt-10 md:pt-14">
      <section className="max-w-4xl space-y-5 reveal">
        <p className="eyebrow">Myndighetskatalog</p>
        <h1 className="font-title text-5xl leading-none sm:text-6xl">
          Bevaka myndigheter med live-signaler, rapportflöden och notifieringar på nya poster.
        </h1>
        <p className="max-w-3xl text-(--muted) text-lg leading-8">
          Varje myndighetskort visar hur många profiler, signaler, rapporter och öppna alerts som just nu ligger i den anslutna databasen.
        </p>
      </section>

      <section className="grid gap-5">
        {authorities.map((authority, index) => (
          <article className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]" id={authority.slug} key={authority.id}>
            <div className="surface rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: `${index * 80}ms` }}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">{authority.category} · {authority.region}</p>
                  <h2 className="mt-2 font-title text-4xl">{authority.name}</h2>
                </div>
                <span className="tag">{authority.openAlerts} öppna alerts</span>
              </div>
              <p className="mt-4 max-w-3xl text-(--muted) text-sm leading-7">{authority.summary}</p>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="metric-card">
                  <p className="eyebrow">Profiler</p>
                  <p className="mt-1 text-2xl font-semibold">{authority.monitoredOfficials}</p>
                </div>
                <div className="metric-card">
                  <p className="eyebrow">Signaler</p>
                  <p className="mt-1 text-2xl font-semibold">{authority.totalSignals}</p>
                </div>
                <div className="metric-card">
                  <p className="eyebrow">Senaste sync</p>
                  <p className="mt-1 text-sm font-semibold">
                    {new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(authority.lastSyncAt))}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="eyebrow">Fokusytor</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {authority.focusAreas.map((item) => (
                      <span className="tag" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="eyebrow">Källmix</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {authority.sourceMix.map((item) => (
                      <span className="tag" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="reveal" style={{ animationDelay: `${index * 80 + 120}ms` }}>
              <WatchSubscriptionPanel
                authorityId={authority.id}
                defaultChannels={authority.watchTarget.defaultChannels}
                note={authority.watchTarget.note}
                recommendedCadence={authority.watchTarget.recommendedCadence}
                targetId={authority.watchTarget.targetId}
                targetName={authority.watchTarget.targetName}
                targetType={authority.watchTarget.targetType}
              />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}