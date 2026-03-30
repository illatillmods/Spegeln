import Link from "next/link";
import { notFound } from "next/navigation";
import { WatchSubscriptionPanel } from "@/components/watchdog/WatchSubscriptionPanel";
import { getWatchdogProfile } from "@/lib/watchdog";
import { TimelineChart } from "./TimelineChart";
import { Alerts } from "./Alerts";

type ProfilePageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const resolvedParams = await params;
  const profile = await getWatchdogProfile(resolvedParams.id);
  if (!profile) return notFound();

  return (
    <div className="shell space-y-10 pb-20 pt-10 md:pt-14">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
        <div className="space-y-5 reveal">
          <p className="eyebrow">Watchdogprofil</p>
          <h1 className="font-title text-5xl leading-none sm:text-6xl">{profile.fullName}</h1>
          <p className="text-(--muted) text-lg leading-8">{profile.title} · {profile.authorityName}</p>
          <p className="max-w-3xl text-(--muted) text-lg leading-8">{profile.summary}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="tag">{profile.totalSignals} signaler</span>
            <span className="tag">{profile.monitoredSources} källfamiljer</span>
            <span className="tag">{profile.publishedReports} rapporter</span>
            <span className="tag">{profile.openAlerts} öppna alerts</span>
          </div>
          <p className="text-(--muted) text-sm leading-7">
            Senaste sync {new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(profile.lastDailySyncAt))}. {profile.refreshPolicy}
          </p>
          <p className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/70 px-4 py-3 text-sm leading-7 text-(--muted)">{profile.statusNote}</p>
          <Link className="btn-secondary" href={`/overvakningsspegeln/autoritet#${profile.authoritySlug}`}>
            Visa myndighetsbevakningen
          </Link>
        </div>

        <div className="space-y-5 reveal" style={{ animationDelay: "120ms" }}>
          <WatchSubscriptionPanel
            defaultChannels={profile.watchTarget.defaultChannels}
            note={profile.watchTarget.note}
            recommendedCadence={profile.watchTarget.recommendedCadence}
            targetId={profile.watchTarget.targetId}
            targetName={profile.watchTarget.targetName}
            targetType={profile.watchTarget.targetType}
          />
          <article className="surface rounded-4xl p-6 md:p-7">
            <p className="eyebrow">Förtroende och läge</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="metric-card">
                <p className="eyebrow">Förtroendescore</p>
                <p className="mt-1 text-2xl font-semibold">{profile.trust.confidenceScore}%</p>
              </div>
              <div className="metric-card">
                <p className="eyebrow">Öppna klagomål</p>
                <p className="mt-1 text-2xl font-semibold">{profile.complaints}</p>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm leading-7">
              <div>
                <p className="font-semibold">Röstläge</p>
                <p className="text-(--muted)">{profile.trust.upvotes} upp, {profile.trust.downvotes} ned, {profile.trust.testimonials} godkända vittnesmål.</p>
              </div>
              <div>
                <p className="font-semibold">Granskningsärenden</p>
                <p className="text-(--muted)">{profile.failureReports} registrerade ärenden kopplade till tjänsterollen eller myndighetsytan.</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="btn-secondary" href="/folkets-domstol">Öppna Folkets domstol</Link>
              <Link className="btn-secondary" href="/myndighetsgranskaren">Öppna granskningskön</Link>
            </div>
          </article>
        </div>
      </section>

      <Alerts alerts={profile.alerts} />

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="surface rounded-4xl p-6 md:p-8 reveal">
          <p className="eyebrow">Källtäckning</p>
          <h2 className="mt-2 font-title text-4xl">Anslutna källfamiljer och senast registrerad aktivitet.</h2>
          <div className="mt-6 grid gap-4">
            {profile.coverage.map((item) => (
              <article className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/80 p-4" key={item.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow">{item.category}</p>
                    <h3 className="mt-1 text-xl font-semibold">{item.label}</h3>
                  </div>
                  <span className="tag">{item.status}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="tag">{item.cadence}</span>
                  <span className="tag">Senast aktiv {new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.lastActivityAt))}</span>
                </div>
                <p className="mt-3 text-(--muted) text-sm leading-7">{item.note}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="surface rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "120ms" }}>
          <p className="eyebrow">Mönstersignaler</p>
          <h2 className="mt-2 font-title text-4xl">Vad som sticker ut i profilen just nu.</h2>
          <div className="mt-6 grid gap-4">
            {profile.patternSignals.map((signal) => (
              <article className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/80 p-4" key={signal.id}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold">{signal.title}</h3>
                  <span className="tag">{signal.status}</span>
                </div>
                <p className="mt-3 text-(--muted) text-sm leading-7">{signal.summary}</p>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <article className="surface rounded-4xl p-6 md:p-8 reveal">
          <p className="eyebrow">Kronologi</p>
          <h2 className="mt-2 font-title text-4xl">Alla registrerade signaler i samma tidslinje.</h2>
          <div className="mt-6">
            <TimelineChart events={profile.timeline} />
          </div>
          <div className="mt-6 space-y-4">
            {profile.timeline.map((event) => (
              <article className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/80 p-4" key={event.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow">{event.category}</p>
                    <h3 className="mt-1 text-xl font-semibold">{event.title}</h3>
                  </div>
                  <span className={`tag ${event.highlight ? "border-[rgba(194,107,20,0.35)] bg-[rgba(248,227,197,0.88)]" : ""}`}>{event.date}</span>
                </div>
                <p className="mt-3 text-(--muted) text-sm leading-7">{event.description}</p>
                <p className="mt-2 text-sm leading-7">Källa: {event.source}</p>
                <p className="mt-1 text-(--muted) text-sm leading-7">Effekt: {event.impact}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {event.connectedEntities.map((entity) => (
                    <span className="tag" key={entity}>
                      {entity}
                    </span>
                  ))}
                  {event.amount ? <span className="tag">{event.amount}</span> : null}
                </div>
              </article>
            ))}
          </div>
        </article>

        <div className="space-y-5 reveal" style={{ animationDelay: "120ms" }}>
          <article className="surface rounded-4xl p-6 md:p-8">
            <p className="eyebrow">Senaste poster</p>
            <h2 className="mt-2 font-title text-4xl">Rapporter, klagomål och ärenden som driver profilen.</h2>
            <div className="mt-6 space-y-4">
              {profile.recordDigests.map((item) => (
                <article className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/80 p-4" key={item.id}>
                  <p className="eyebrow">{item.category}</p>
                  <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-(--muted) text-sm leading-7">{item.summary}</p>
                  <p className="mt-2 text-(--muted) text-xs">{item.source} · {new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.date))}</p>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
