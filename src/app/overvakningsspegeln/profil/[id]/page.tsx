import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { disclosureProfileNotice } from "@/lib/disclosure-policy";
import { WatchSubscriptionPanel } from "@/components/watchdog/WatchSubscriptionPanel";
import type { WatchProfile } from "@/lib/watchdog";
import { serverApiJson } from "@/lib/server-api";
import { TimelineChart } from "./TimelineChart";
import { Alerts } from "./Alerts";
import { RelationGraph } from "./RelationGraph";

type ProfilePageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const resolvedParams = await params;
  const profile = await serverApiJson<WatchProfile>(`/api/watchdog/profiles/${encodeURIComponent(resolvedParams.id)}`, {}, { allowStatuses: [404] });
  if (!profile) return notFound();

  const formatDate = (value: string) => new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  const boundaryClasses = {
    Visas: "border-[rgba(15,118,110,0.18)] bg-[rgba(15,118,110,0.08)]",
    Maskas: "border-[rgba(194,107,20,0.18)] bg-[rgba(194,107,20,0.08)]",
    Blockeras: "border-[rgba(153,27,27,0.18)] bg-[rgba(153,27,27,0.08)]",
  } as const;

  return (
    <>
      <Breadcrumbs
        items={[
          { href: "/", label: "Start" },
          { href: "/overvakningsspegeln", label: "Övervakningsspegeln" },
          { href: "/overvakningsspegeln/sok", label: "Sök" },
          { label: profile.fullName },
        ]}
      />
    <div className="shell space-y-10 pb-20 pt-4 md:pt-6">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
        <div className="space-y-5 reveal">
          <p className="eyebrow">Övervakningsprofil</p>
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
            Senaste sync {formatDate(profile.lastDailySyncAt)}. {profile.refreshPolicy}
          </p>
          <div className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-[rgba(22,32,42,0.03)] px-4 py-3 text-sm leading-7 text-(--muted)">
            {disclosureProfileNotice}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="btn-secondary" href={`/folkets-domstol?target=${profile.id}&kind=official`}>
              Rösta i Folkets domstol
            </Link>
            <Link className="btn-secondary" href={`/overvakningsspegeln/autoritet#${profile.authoritySlug}`}>
              Visa myndighetsbevakningen
            </Link>
          </div>
        </div>

        <div className="space-y-5 reveal" style={{ animationDelay: "120ms" }}>
          <WatchSubscriptionPanel
            authorityId={profile.authorityId}
            defaultChannels={profile.watchTarget.defaultChannels}
            note={profile.watchTarget.note}
            recommendedCadence={profile.watchTarget.recommendedCadence}
            targetId={profile.watchTarget.targetId}
            targetName={profile.watchTarget.targetName}
            targetType={profile.watchTarget.targetType}
          />
          <article className="surface rounded-4xl p-6 md:p-7">
            <p className="eyebrow">Verifiering och läge</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="metric-card">
                <p className="eyebrow">Källkonfidens</p>
                <p className="mt-1 text-2xl font-semibold">{profile.trust.confidenceScore}%</p>
              </div>
              <div className="metric-card">
                <p className="eyebrow">Öppna klagomål</p>
                <p className="mt-1 text-2xl font-semibold">{profile.complaints}</p>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm leading-7">
              <div>
                <p className="font-semibold">Publik signalbild</p>
                <p className="text-(--muted)">{profile.trust.upvotes} upp, {profile.trust.downvotes} ned och {profile.trust.testimonials} godkända vittnesmål i Folkets domstol.</p>
              </div>
              {profile.courtTestimonials.length > 0 ? (
                <div>
                  <p className="font-semibold">Folkets domstol — vittnesmål</p>
                  <div className="mt-3 space-y-3">
                    {profile.courtTestimonials.map((testimonial) => (
                      <article className="rounded-2xl border border-[rgba(22,32,42,0.08)] bg-white/75 p-3" key={`${testimonial.headline}-${testimonial.createdAt}`}>
                        <p className="font-medium">{testimonial.headline}</p>
                        <p className="mt-1 text-(--muted) text-sm leading-6">{testimonial.body}</p>
                        <p className="mt-2 text-(--muted) text-xs">{formatDate(testimonial.createdAt)}</p>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}
              <div>
                <p className="font-semibold">Granskningsärenden</p>
                <p className="text-(--muted)">{profile.failureReports} registrerade ärenden kopplade till tjänsterollen eller myndighetsytan.</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="btn-secondary" href="/myndighetsgranskaren">Öppna granskningskön</Link>
              <Link className="btn-secondary" href="/overvakningsspegeln/sok">Sök fler profiler</Link>
            </div>
          </article>
        </div>
      </section>

      <Alerts alerts={profile.alerts} />

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="surface rounded-4xl p-6 md:p-8 reveal">
          <p className="eyebrow">Offentliga datapunkter</p>
          <h2 className="mt-2 font-title text-4xl">Verifierade kategorier som får synas i profilen.</h2>
          <div className="mt-6 grid gap-4">
            {profile.publicFacts.map((fact) => (
              <article className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/80 p-4" key={fact.id}>
                <h3 className="text-lg font-semibold">{fact.label}</h3>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {fact.values.map((value) => (
                    <span className="tag" key={value}>
                      {value}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-(--muted) text-sm leading-7">{fact.note}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="surface rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "120ms" }}>
          <p className="eyebrow">Publiceringsgränser</p>
          <h2 className="mt-2 font-title text-4xl">Vad som visas, maskas eller blockeras och varför.</h2>
          <div className="mt-6 grid gap-4">
            {profile.disclosureBoundaries.map((boundary) => (
              <article className={`rounded-3xl border p-4 ${boundaryClasses[boundary.status]}`} key={boundary.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold">{boundary.label}</h3>
                  <span className="tag">{boundary.status}</span>
                </div>
                <p className="mt-3 text-(--muted) text-sm leading-7">{boundary.reason}</p>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
        <article className="surface rounded-4xl p-6 md:p-8 reveal">
          <p className="eyebrow">Offentliga relationer</p>
          <h2 className="mt-2 font-title text-4xl">Kopplingar som faktiskt är dokumenterade i öppna källor.</h2>
          <p className="mt-4 max-w-3xl text-(--muted) text-sm leading-7">
            Grafen visar bara relationer som kan förankras i öppna register, diarier, offentliga program, upphandlingsbilagor eller andra officiella handlingar.
          </p>
          <div className="mt-6">
            <RelationGraph relationships={profile.relationships} subjectName={profile.fullName} />
          </div>
        </article>

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
                  <span className="tag">Senast aktiv {formatDate(item.lastActivityAt)}</span>
                </div>
                <p className="mt-3 text-(--muted) text-sm leading-7">{item.note}</p>
                {item.legalBasis ? <p className="mt-2 text-(--muted) text-xs leading-6">Offentlig grund: {item.legalBasis}</p> : null}
                {item.sourceUrl ? (
                  <a className="btn-secondary mt-4 inline-flex" href={item.sourceUrl} rel="noreferrer" target="_blank">
                    Öppna källfamilj
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
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

        <article className="surface rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "180ms" }}>
          <p className="eyebrow">Rätts- och beslutsspår</p>
          <h2 className="mt-2 font-title text-4xl">Domstol, disciplin och formella avgöranden.</h2>
          <div className="mt-6 grid gap-4">
            {profile.verdicts.length === 0 ? (
              <div className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/80 p-4 text-(--muted) text-sm leading-7">
                Inga verifierade domstols- eller avgörandeposter är publicerade i den här profilen ännu.
              </div>
            ) : (
              profile.verdicts.map((verdict) => (
                <article className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/80 p-4" key={`${verdict.court}-${verdict.date}`}>
                  <p className="eyebrow">{verdict.court}</p>
                  <h3 className="mt-1 text-lg font-semibold">{verdict.description}</h3>
                  <p className="mt-2 text-(--muted) text-xs">{new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium" }).format(new Date(verdict.date))}</p>
                </article>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <article className="surface rounded-4xl p-6 md:p-8 reveal">
          <p className="eyebrow">Kronologi</p>
          <h2 className="mt-2 font-title text-4xl">Verifierade offentliga poster i samma tidslinje.</h2>
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
                  <span className={`tag ${event.highlight ? "border-[rgba(194,107,20,0.35)] bg-[rgba(248,227,197,0.88)]" : ""}`}>{new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium" }).format(new Date(event.date))}</span>
                </div>
                <p className="mt-3 text-(--muted) text-sm leading-7">{event.description}</p>
                <p className="mt-2 text-sm leading-7">Offentlig källa: {event.source}</p>
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
            <h2 className="mt-2 font-title text-4xl">Rapporter, klagomål och ärenden som är publikt förankrade.</h2>
            <div className="mt-6 space-y-4">
              {profile.recordDigests.map((item) => (
                <article className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/80 p-4" key={item.id}>
                  <p className="eyebrow">{item.category}</p>
                  <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-(--muted) text-sm leading-7">{item.summary}</p>
                  <p className="mt-2 text-(--muted) text-xs">{item.source} · {formatDate(item.date)}</p>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
    </>
  );
}
