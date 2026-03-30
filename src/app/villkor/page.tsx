import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Användarvillkor",
  description: "Användarvillkor, ansvarsbegränsningar och takedown-principer för Spegeln.",
};

const sections = [
  {
    title: "1. Plattformens syfte",
    body:
      "Spegeln är ett research-, bevaknings- och publiceringsverktyg med samhällsinriktning. Plattformen är inte juridisk rådgivning och ger inga garantier om att användargenererat eller AI-assisterat material är publiceringsbart utan manuell granskning.",
  },
  {
    title: "2. Tillåten användning",
    body:
      "Du får inte använda tjänsten för trakasserier, doxxing, olagliga massutskick, otillåten personuppgiftsbehandling eller försök att kringgå juridiska och redaktionella spärrar.",
  },
  {
    title: "3. Moderation och takedown",
    body:
      "Spegeln förbehåller sig rätten att stoppa, dölja, eskalera eller ta bort material som bedöms olagligt, oproportionerligt, otillräckligt underbyggt eller riskabelt ur integritets- och förtalssynpunkt.",
  },
  {
    title: "4. Betalningar och återbetalning",
    body:
      "Kort och Klarna hanteras i hosted checkout. Swish, kontanter och kryptovalutor går genom manuell verifiering tills extern PSP eller wallet-infrastruktur är färdiggranskad. Rabatter för kontant- och kryptoflöden gäller endast när betalningen kan dokumenteras lagligt och säkert.",
  },
  {
    title: "5. Juridisk granskning",
    body:
      "Funktioner som rör publicering, massutskick, personuppgifter och känsligt innehåll ska genomgå regelbunden svensk/EU-rättslig översyn. Konton eller innehåll kan begränsas medan sådan översyn pågår.",
  },
];

export default function TermsPage() {
  return (
    <div className="shell space-y-12 pb-20 pt-10 md:pt-14">
      <section className="max-w-3xl space-y-4 reveal">
        <p className="eyebrow">Avtal</p>
        <h1 className="font-title text-5xl leading-none sm:text-6xl">Användarvillkor och ansvarsfördelning</h1>
        <p className="text-(--muted) text-lg leading-8">
          Villkoren nedan kompletterar juridiksidan och integritetscentret. De är skrivna för att göra moderation, takedown, betalning och publiceringsansvar tydligt innan bred lansering.
        </p>
      </section>

      <section className="grid gap-4">
        {sections.map((section, index) => (
          <article className="surface rounded-[1.9rem] p-6 reveal" key={section.title} style={{ animationDelay: `${index * 70}ms` }}>
            <h2 className="font-title text-3xl">{section.title}</h2>
            <p className="mt-4 text-(--muted) text-sm leading-7">{section.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}