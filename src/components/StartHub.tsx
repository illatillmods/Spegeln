import Link from "next/link";
import { heroMetrics, stackChoices, workflowSteps } from "@/lib/site-content";

const toneClasses = {
  teal: "tone-teal",
  amber: "tone-amber",
  ink: "tone-ink",
};

const pathways = [
  {
    eyebrow: "Utforska",
    title: "Följ spåren där myndigheter helst vill slippa ljuset.",
    description:
      "Börja här när du vill hitta personer, myndighetsytor, relationer och tidslinjer innan systemet hinner gömma sig bakom fler lager.",
    href: "/overvakningsspegeln",
    cta: "Öppna frontlinjen",
    tone: "teal" as const,
    links: [
      { href: "/overvakningsspegeln/sok", label: "Profilsök" },
      { href: "/overvakningsspegeln/autoritet", label: "Myndighetskatalog" },
      { href: "/insynsindex", label: "Insynsindex" },
    ],
  },
  {
    eyebrow: "Agera",
    title: "Slå tillbaka med batcher, utskick och nästa drag.",
    description:
      "När målet är att få iväg tryck snabbt går du hit för batcher, utskick och dokument som gör myndigheter mindre bekväma.",
    href: "/byrakrati-bombaren",
    cta: "Öppna motverktygen",
    tone: "amber" as const,
    links: [
      { href: "/byrakrati-bombaren", label: "Byråkrati-bombaren" },
      { href: "/skatteplanering", label: "Skatteplanering" },
      { href: "/prissattning", label: "Priser och usage" },
    ],
  },
  {
    eyebrow: "Bidra",
    title: "Lämna in rapporter, video och material som skaver.",
    description:
      "Här ligger flödena för tips, videointag och publik respons. Det är rätt startpunkt när användaren kommer med material, inte tillstånd.",
    href: "/myndighetsgranskaren",
    cta: "Öppna inflödet",
    tone: "ink" as const,
    links: [
      { href: "/myndighetsgranskaren", label: "Myndighetsgranskaren" },
      { href: "/reverse-surveillance", label: "Reverse Surveillance" },
      { href: "/folkets-domstol", label: "Folkets domstol" },
    ],
  },
  {
    eyebrow: "Läs och jämför",
    title: "Se index, scorecards och mönster som går att dela vidare.",
    description:
      "Använd den här vägen när du vill mäta trycket mellan flera myndigheter och förvandla känslan av att något stinker till öppna jämförelser.",
    href: "/insynsindex",
    cta: "Öppna indexet",
    tone: "teal" as const,
    links: [
      { href: "/insynsindex", label: "Scorecards" },
      { href: "/statens-svagheter", label: "Statens svagheter" },
      { href: "/api-dokumentation", label: "API" },
    ],
  },
];

const supportLinks = [
  {
    href: "/prissattning",
    title: "Prissättning",
    summary: "Hur trycket finansieras utan att låsa in den fria insynen.",
  },
  {
    href: "/api-dokumentation",
    title: "API-dokumentation",
    summary: "Öppna flöden för egna dashboards, exportjobb och vidare spridning.",
  },
  {
    href: "/integritet",
    title: "Spårkontroll",
    summary: "Styr vilka spår du lämnar och vilka krav du skickar mot plattformen.",
  },
  {
    href: "/juridik",
    title: "Manifest",
    summary: "Varför Spegeln väljer konflikt med mörkläggning framför neutral kuliss.",
  },
];

export function StartHub() {
  return (
    <div className="shell space-y-16 pb-20 pt-10 md:pt-14">
      <section className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
        <div className="space-y-5 reveal">
          <p className="eyebrow">Start här</p>
          <h1 className="max-w-4xl font-title text-5xl leading-none sm:text-6xl">
            En samlad front mot myndighetsspråk, mörkläggning och byråkratisk tröghet.
          </h1>
          <p className="max-w-3xl text-(--muted) text-lg leading-8">
            Välj hur du vill sätta trycket: gräv, slå tillbaka, bidra eller jämför. Den här sidan samlar de viktigaste vägarna in i plattformen utan att be om ursäkt för varför den finns.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="btn-primary" href="/overvakningsspegeln">
              Gå till frontlinjen
            </Link>
            <Link className="btn-secondary" href="/byrakrati-bombaren">
              Öppna motverktygen
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 reveal" style={{ animationDelay: "120ms" }}>
          {heroMetrics.map((metric) => (
            <article className="surface rounded-[1.6rem] p-5" key={metric.label}>
              <p className="text-(--foreground) text-3xl font-semibold">{metric.value}</p>
              <p className="mt-2 text-sm font-medium text-(--foreground)">{metric.label}</p>
              <p className="mt-2 text-(--muted) text-sm leading-6">{metric.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-5 reveal">
        <div className="max-w-3xl">
          <p className="eyebrow">Välj efter uppgift</p>
          <h2 className="mt-2 font-title text-4xl sm:text-5xl">Fyra fronter i stället för ett snällt lapptäcke av sidor.</h2>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {pathways.map((pathway, index) => (
            <article className={`surface rounded-4xl p-6 md:p-8 ${toneClasses[pathway.tone]} reveal`} key={pathway.title} style={{ animationDelay: `${index * 90}ms` }}>
              <p className="eyebrow">{pathway.eyebrow}</p>
              <h3 className="mt-3 font-title text-4xl">{pathway.title}</h3>
              <p className="mt-4 text-(--muted) text-sm leading-7">{pathway.description}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs">
                {pathway.links.map((link) => (
                  <Link className="tag transition hover:-translate-y-0.5" href={link.href} key={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
              <Link className="btn-secondary mt-6" href={pathway.href}>
                {pathway.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
        <article className="surface-strong rounded-4xl p-6 md:p-8 reveal">
          <p className="eyebrow">Så hänger det ihop</p>
          <h2 className="mt-3 font-title text-4xl">Från första spår till offentligt tryck.</h2>
          <div className="mt-8 space-y-4">
            {workflowSteps.map((step, index) => (
              <article className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/75 p-5" key={step.title}>
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--foreground) text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-(--foreground)">{step.title}</h3>
                    <p className="mt-2 text-(--muted) text-sm leading-7">{step.description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="surface rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "120ms" }}>
          <p className="eyebrow">Teknisk status</p>
          <h2 className="mt-3 font-title text-4xl">Maskinen bakom protesten.</h2>
          <div className="mt-6 space-y-4">
            {stackChoices.map((choice) => (
              <div className={`rounded-3xl border border-[rgba(22,32,42,0.08)] p-5 ${toneClasses[choice.tone]}`} key={choice.title}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold text-(--foreground)">{choice.title}</h3>
                  <span className="tag">{choice.status}</span>
                </div>
                <p className="mt-3 text-(--muted) text-sm leading-7">{choice.description}</p>
                <p className="mt-2 text-(--foreground) text-sm leading-7">{choice.rationale}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="space-y-5 reveal">
        <div className="max-w-3xl">
          <p className="eyebrow">Snabbvägar</p>
          <h2 className="mt-2 font-title text-4xl">Sidor som förklarar drivkraft, finansiering och hur du styr dina egna spår.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {supportLinks.map((link, index) => (
            <Link className="surface rounded-[1.9rem] p-6 transition hover:-translate-y-0.5 reveal" href={link.href} key={link.href} style={{ animationDelay: `${index * 70}ms` }}>
              <p className="eyebrow">Mer</p>
              <h3 className="mt-2 font-title text-3xl">{link.title}</h3>
              <p className="mt-3 text-(--muted) text-sm leading-7">{link.summary}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}