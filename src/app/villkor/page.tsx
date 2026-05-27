import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Användarvillkor",
  description: "Spelregler för deltagare som vill använda Spegeln för att pressa systemet.",
};

const sections = [
  {
    title: "1. Plattformens riktning",
    body:
      "Spegeln finns för att ifrågasätta myndigheter, spräcka byråkratiska dimridåer och göra maktens spår publika. Den som kliver in här kliver in i en plattform som väljer konflikt med mörkläggning framför neutral fasad.",
  },
  {
    title: "2. Verktyg för uppåttryck",
    body:
      "Använd Spegeln för att spåra, dokumentera, batcha och förstärka kritik mot myndigheter, maktcentra och offentliga beslutsmiljöer. Plattformen är inte byggd för att skydda institutioners anseende eller paketera samhällskritik i myndighetsvänligt språk.",
  },
  {
    title: "3. Offentlighet framför bekvämlighet",
    body:
      "Material, vittnesmål och dokument kan fångas upp, kopplas ihop och göras synliga för fler. Poängen är att hålla trycket levande, inte att fungera som ett neutralt arkiv som lugnar ner frågorna så fort de blir obekväma.",
  },
  {
    title: "4. Finansiering utan lojalitet",
    body:
      "Betalda planer, engångsköp och sponsorstöd ska hålla grävandet igång. Ingen som betalar köper tystnad, inflytande över vad som granskas eller rätt att tona ned sajtens konflikt med makten.",
  },
  {
    title: "5. Din roll i trycket",
    body:
      "Om du använder Spegeln gör du det för att bidra till mer insyn, mer friktion och fler frågor mot systemet. Plattformen lovar inte mysig konsensus; den lovar verktyg för att pressa på där myndigheter helst vill slippa ljuset.",
  },
];

export default function TermsPage() {
  return (
    <div className="shell space-y-12 pb-20 pt-10 md:pt-14">
      <section className="max-w-3xl space-y-4 reveal">
        <p className="eyebrow">Avtal</p>
        <h1 className="font-title text-5xl leading-none sm:text-6xl">Spelregler för folk som vill pressa systemet</h1>
        <p className="text-(--muted) text-lg leading-8">
          Det här är plattformens spelregler: mer offentlighet, mer friktion, mindre respekt för maktens bekväma språk. Spegeln är till för människor som vill utmana systemet, inte skydda dess självbild.
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