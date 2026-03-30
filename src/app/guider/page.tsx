import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Guider",
  description: "Användarguider för Spegelns viktigaste arbetsflöden.",
};

const guides = [
  {
    title: "Byråkrati-bombaren",
    summary: "Bygg säkra massutskick med spårbar dokumentkedja, tydlig prislogik och manuell stoppspärr.",
    href: "/byrakrati-bombaren",
  },
  {
    title: "Myndighetsgranskaren",
    summary: "Ta emot rapporter, AI-prioritera, och skicka vidare till moderation och legal review utan att publicera för tidigt.",
    href: "/myndighetsgranskaren",
  },
  {
    title: "Insynsindex API",
    summary: "Registrera API-nycklar, förstå scopes, och konsumera anonymiserad leaderboard- och dashboarddata.",
    href: "/api-dokumentation",
  },
  {
    title: "Integritetscenter",
    summary: "Hantera samtycken, GDPR-begäran och användarvillkor från ett samlat kontrollrum.",
    href: "/integritet",
  },
];

export default async function GuidesPage() {
  const locale = await getCurrentLocale();

  return (
    <div className="shell space-y-14 pb-20 pt-10 md:pt-14">
      <section className="max-w-3xl space-y-4 reveal">
        <p className="eyebrow">{locale === "en" ? "Guides" : "Guider"}</p>
        <h1 className="font-title text-5xl leading-none sm:text-6xl">
          {locale === "en" ? "Operational guides for each major workflow." : "Operativa guider för varje större arbetsflöde."}
        </h1>
        <p className="text-(--muted) text-lg leading-8">
          {locale === "en"
            ? "Each feature remains on its own page, but the guide layer explains how authentication, payments, moderation, and legal review connect across the platform."
            : "Varje funktion ligger kvar på egen sida, men guidelagret förklarar hur autentisering, betalning, moderation och juridisk granskning hänger ihop över hela plattformen."}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {guides.map((guide, index) => (
          <article className="surface rounded-[1.9rem] p-6 reveal" key={guide.title} style={{ animationDelay: `${index * 100}ms` }}>
            <p className="eyebrow">Workflow</p>
            <h2 className="mt-3 font-title text-3xl">{guide.title}</h2>
            <p className="mt-4 text-(--muted) text-sm leading-7">{guide.summary}</p>
            <Link className="btn-secondary mt-6" href={guide.href}>
              {locale === "en" ? "Open guide" : "Öppna guide"}
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}