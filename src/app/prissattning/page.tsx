import type { Metadata } from "next";
import Link from "next/link";
import {
  ethicalAdRules,
  monetizationChannels,
  pricingPlans,
} from "@/lib/site-content";
import { PlanPurchasePanel } from "./PlanPurchasePanel";

const toneClasses = {
  teal: "tone-teal",
  amber: "tone-amber",
  ink: "tone-ink",
};

export const metadata: Metadata = {
  title: "Prissättning",
  description: "Freemium, premium, pay-per-use och etiska annonser för Spegeln.",
};

export default function PricingPage() {
  const purchaseKeys = [null, "plus_monthly", "pro_monthly", "usage_ai_analysis"] as const;

  return (
    <div className="shell space-y-20 pb-20 pt-10 md:pt-14">
      <section className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-start">
        <div className="space-y-5 reveal">
          <p className="eyebrow">Intäktsmodell</p>
          <h1 className="max-w-3xl font-title text-5xl leading-none sm:text-6xl">
            Bygg räckvidd med fri insyn och ta betalt för fart, djup och arbetsflöde.
          </h1>
          <p className="max-w-2xl text-(--muted) text-lg leading-8">
            Spegeln bör tjäna pengar på nytta, inte på att låsa in samhällsinformation. Därför kombinerar produkten gratisnivå, abonnemang, usage-priser och tydligt reglerad annonsering.
          </p>
        </div>

        <article className="surface-strong rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "120ms" }}>
          <p className="eyebrow">Kommersiell princip</p>
          <h2 className="mt-3 font-title text-4xl">Ingen intäktskanal får urholka oberoendet.</h2>
          <div className="mt-6 space-y-4">
            {monetizationChannels.map((channel) => (
              <div className={`rounded-3xl border border-[rgba(22,32,42,0.08)] p-5 ${toneClasses[channel.tone]}`} key={channel.title}>
                <h3 className="text-(--foreground) text-xl font-semibold">{channel.title}</h3>
                <p className="mt-2 text-(--muted) text-sm leading-7">{channel.summary}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        {pricingPlans.map((plan, index) => (
          <article className={`surface rounded-4xl p-6 reveal ${toneClasses[plan.tone]} ${plan.highlight ? "ring-2 ring-[rgba(194,107,20,0.35)]" : ""}`} key={plan.name} style={{ animationDelay: `${index * 90}ms` }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">{plan.audience}</p>
                <h2 className="mt-2 font-title text-3xl">{plan.name}</h2>
              </div>
              {plan.highlight ? <span className="tag">Rekommenderad</span> : null}
            </div>
            <p className="text-(--foreground) mt-5 text-4xl font-semibold">{plan.price}</p>
            <p className="mt-4 text-(--muted) text-sm leading-7">{plan.description}</p>
            <ul className="text-(--foreground) mt-5 space-y-3 text-sm leading-6">
              {plan.bullets.map((bullet) => (
                <li className="flex gap-3" key={bullet}>
                  <span className="signal-dot mt-2 shrink-0" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              {purchaseKeys[index] ? (
                <PlanPurchasePanel purchaseKey={purchaseKeys[index]} />
              ) : (
                <Link className="btn-secondary w-full" href="/login">
                  Skapa gratiskonto
                </Link>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="surface-strong rounded-[2.2rem] p-6 md:p-8 reveal">
        <p className="eyebrow">Betalsätt och rabatter</p>
        <h2 className="mt-3 font-title text-4xl sm:text-5xl">Kontant betalning ger 50% rabatt. Kryptobetalning ger 25% rabatt.</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/80 p-5">
            <p className="eyebrow">Kort / Klarna</p>
            <p className="mt-2 text-sm leading-7 text-(--muted)">Hosted Stripe checkout för snabbaste och mest automatiserade flödet.</p>
          </article>
          <article className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/80 p-5">
            <p className="eyebrow">Krypto</p>
            <p className="mt-2 text-sm leading-7 text-(--muted)">BTC, XMR och LTC skapar manuella betalningsärenden med 25% rabatt och adminverifiering före aktivering.</p>
          </article>
          <article className="rounded-3xl border border-[rgba(194,107,20,0.35)] bg-[rgba(248,227,197,0.88)] p-5">
            <p className="eyebrow">Kontanter</p>
            <p className="mt-2 text-sm leading-7 text-(--foreground)">Kontant betalning är markerad tydligt och ger 50% rabatt, men kräver laglig dokumentation, manuell verifiering och legal review före aktivering.</p>
          </article>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
        <article className="surface rounded-4xl p-6 md:p-8 reveal">
          <p className="eyebrow">Pay-per-use</p>
          <h2 className="mt-3 font-title text-4xl">Prissätt de tunga funktionerna separat.</h2>
          <p className="mt-4 text-(--muted) text-sm leading-7">
            Sätt usage-pris på sådant som faktiskt skapar marginalkostnad: AI-sammanfattningar, batch-exporter, historiska jämförelser, större dokumentomvandlingar och myndighetsbatcher i Byråkrati-bombaren.
          </p>
          <ul className="text-(--foreground) mt-6 space-y-4 text-sm leading-7">
            <li className="flex gap-3">
              <span className="signal-dot mt-2 shrink-0" />
              <span>Använd usage-priser för att undvika att gratis- eller lågprisplaner subventionerar tung beräkning.</span>
            </li>
            <li className="flex gap-3">
              <span className="signal-dot mt-2 shrink-0" />
              <span>Gör priset transparent per körning eller per export, så att användaren vet vad som kostar innan jobbet startar.</span>
            </li>
            <li className="flex gap-3">
              <span className="signal-dot mt-2 shrink-0" />
              <span>Massutskick kan prissättas per batch och mottagare, medan Pro-planen låser upp obegränsade körningar inom abuse-gränser.</span>
            </li>
          </ul>
        </article>

        <article className="surface rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "120ms" }}>
          <p className="eyebrow">Etisk annonsering</p>
          <h2 className="mt-3 font-title text-4xl">Annonsytor kan fungera om de hålls i koppel.</h2>
          <ul className="text-(--foreground) mt-6 space-y-4 text-sm leading-7">
            {ethicalAdRules.map((rule) => (
              <li className="flex gap-3" key={rule}>
                <span className="signal-dot mt-2 shrink-0" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}