export type ProtestModule = {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  tagline: string;
  description: string;
  extremLangfinger: string;
  lagligt: string;
  ctaLabel: string;
  eyebrow: string;
};

export const protestModules: ProtestModule[] = [
  {
    id: "overvakningsspegeln",
    slug: "/overvakningsspegeln",
    title: "Automatiserad övervakning av myndighetspersoner",
    shortTitle: "Övervakningsspegeln",
    tagline: "Vänder på övervakningssamhället",
    description:
      "Samlar in, sammanställer och publicerar all tillgänglig offentlig information om politiker, poliser, domare och andra makthavare — inkomster, fastigheter, resor, domar, företag, relationer.",
    extremLangfinger:
      "Sidan exponerar makthavarna lika hårt som de övervakar folket. Ett spegelvänt långfinger mot övervakningsstaten.",
    lagligt: "Ja, när all information kommer från offentliga källor. Det skapar ramaskri — det är poängen.",
    ctaLabel: "Öppna övervakningsspegeln",
    eyebrow: "Övervakningsspegeln",
  },
  {
    id: "byrakrati-bombaren",
    slug: "/byrakrati-bombaren",
    title: "Byråkrati-bombaren — automatiserad massöverklagan",
    shortTitle: "Byråkrati-bombaren",
    tagline: "Legal DDOS mot byråkratin",
    description:
      "Skicka massöverklaganden, JO-anmälningar, GDPR-begäranden och informationsförfrågningar till myndigheter med ett klick — i batch.",
    extremLangfinger:
      "Tusentals användare kan lamslå myndigheter med administration och tvinga dem att lägga enorma resurser på meningslöst pappersarbete.",
    lagligt: "Ja, så länge varje användare faktiskt har rätt att skicka in ärendena. Legal överbelastning.",
    ctaLabel: "Starta massöverklagan",
    eyebrow: "Byråkrati-bombaren",
  },
  {
    id: "skatteplanering",
    slug: "/skatteplanering",
    title: "Skatteplaneringsmaskinen",
    shortTitle: "Skatteplaneringsmaskinen",
    tagline: "AI för aggressiv skatteoptimering",
    description:
      "AI hjälper dig utnyttja varje kryphål, avdrag och gråzon i skattelagstiftningen så att du betalar så lite skatt som möjligt — lagligt.",
    extremLangfinger:
      "Om många använder maskinen påverkar det statens skatteintäkter rejält. Massoptimering som staten helst inte vill att du ska se.",
    lagligt: "Ja, så länge den bara ger råd om lagliga metoder och inte uppmanar till skattebrott.",
    ctaLabel: "Kör skatteanalys",
    eyebrow: "Skatteplaneringsmaskinen",
  },
  {
    id: "myndighetsgranskaren",
    slug: "/myndighetsgranskaren",
    title: "Myndighetsgranskaren — automatisk publicering av misslyckanden",
    shortTitle: "Myndighetsgranskaren",
    tagline: "Exponera myndighetsmissbruk offentligt",
    description:
      "Anonym rapportering av myndighetsmissbruk, felaktiga beslut och rättsskandaler. AI analyserar och publicerar de graverande fallen automatiskt.",
    extremLangfinger:
      "Sätter konstant press på myndigheter och exponerar deras misstag offentligt — med pressutkast redo att spridas.",
    lagligt: "Ja, så länge det inte är förtal eller sekretessbelagd information.",
    ctaLabel: "Lämna rapport",
    eyebrow: "Myndighetsgranskaren",
  },
  {
    id: "folkets-domstol",
    slug: "/folkets-domstol",
    title: "Folkets domstol — parallellt rättssystem",
    shortTitle: "Folkets domstol",
    tagline: "Folket dömer makthavarna",
    description:
      "Rösta om förtroendet för enskilda politiker, poliser, domare och lämna anonyma vittnesmål om deras agerande.",
    extremLangfinger:
      "Skapar ett parallellt rättssystem där folket dömer makthavarna — utan att vänta på institutionerna.",
    lagligt: "Ja, så länge det inte är förtal eller hets.",
    ctaLabel: "Döma makthavare",
    eyebrow: "Folkets domstol",
  },
  {
    id: "statens-svagheter",
    slug: "/statens-svagheter",
    title: "Statens svagheter — wiki över kryphål",
    shortTitle: "Statens svagheter",
    tagline: "Utnyttja systemets svagheter mot staten",
    description:
      "Community-wiki där folk samlar lagliga kryphål, tekniska sårbarheter i myndighetssystem och tips om hur man kringgår byråkrati.",
    extremLangfinger:
      "Hjälper folk att utnyttja systemets svagheter mot staten själv — och sprida kunskapen vidare.",
    lagligt: "Ja, så länge det inte handlar om olagliga intrång eller sabotage.",
    ctaLabel: "Bläddra i wikin",
    eyebrow: "Statens svagheter",
  },
  {
    id: "motbevakning",
    slug: "/reverse-surveillance",
    title: "Motbevakning — övervakningskamera mot polisen",
    shortTitle: "Motbevakning",
    tagline: "Polisen under folkets ögon",
    description:
      "Ladda upp och sprid videor på polisingripanden och myndighetsövergrepp så att makten alltid är under insyn.",
    extremLangfinger:
      "Gör det svårare för myndigheter att agera utan att bli sedda. Motbilden mot deras version av händelserna.",
    lagligt: "Ja, så länge det inte bryter mot personuppgiftslagen eller sprider sekretessbelagd information.",
    ctaLabel: "Ladda upp motbild",
    eyebrow: "Motbevakning",
  },
  {
    id: "automatiserad-overklagare",
    slug: "/automatiserad-overklagare",
    title: "Automatiserad överklagare — AI som överklagar ALLT",
    shortTitle: "Automatiserad överklagare",
    tagline: "Överbelasta rättssystemet lagligt",
    description:
      "Ladda upp myndighetsbeslut — AI skriver och genererar överklaganden, JO-anmälningar och begär ut alla handlingar automatiskt.",
    extremLangfinger:
      "Kan överbelasta rättssystemet och tvinga myndigheter att hantera mängder av överklaganden — ett efter ett, lagligt.",
    lagligt: "Ja, så länge det är verkliga ärenden och inte fejk.",
    ctaLabel: "Generera överklagande",
    eyebrow: "Automatiserad överklagare",
  },
];

export function getProtestModule(id: string) {
  return protestModules.find((module) => module.id === id);
}
