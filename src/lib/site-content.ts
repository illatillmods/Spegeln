export type Tone = "teal" | "amber" | "ink";

export type Metric = {
  value: string;
  label: string;
  detail: string;
};

export type ModuleCard = {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  tone: Tone;
};

export type StackChoice = {
  title: string;
  description: string;
  rationale: string;
  status: string;
  tone: Tone;
};

export type MonetizationChannel = {
  title: string;
  summary: string;
  details: string[];
  tone: Tone;
};

export type LegalPillar = {
  title: string;
  description: string;
  points: string[];
  tone: Tone;
};

export type WorkflowStep = {
  title: string;
  description: string;
};

export type DashboardSignal = {
  authority: string;
  region: string;
  severity: string;
  summary: string;
  items: string[];
  tone: Tone;
};

export type PricingPlan = {
  name: string;
  price: string;
  audience: string;
  description: string;
  bullets: string[];
  highlight?: boolean;
  tone: Tone;
};

export const heroMetrics: Metric[] = [
  {
    value: "24/7",
    label: "bevakning av öppna källor",
    detail: "Automatiska signaler från diarier, upphandlingar, domstolar och medier.",
  },
  {
    value: "4x",
    label: "intäktsströmmar i samma produkt",
    detail: "Freemium, abonnemang, usage-priser och strikt etiska annonsytor.",
  },
  {
    value: "GDPR+",
    label: "juridiska kontrollpunkter",
    detail: "Manuell granskning före publicering och dokumenterad dataminimering.",
  },
];

export const productModules: ModuleCard[] = [
  {
    eyebrow: "Aktivering",
    title: "Byråkrati-bombaren för samordnade krav",
    description:
      "Skapa JO-anmälningar, GDPR-begäranden, informationskrav och formella klagomål i batch med mallar, mottagarförslag och statusspårning.",
    bullets: [
      "Genererar myndighetsanpassade dokument från ett enda underlag.",
      "Väljer relevanta myndigheter och registratorer per ärendetyp och region.",
      "Loggar spårningskoder, prisestimat och abuse-skydd innan utskick.",
    ],
    tone: "amber",
  },
  {
    eyebrow: "Monitorering",
    title: "Automatiserad myndighetsbevakning",
    description:
      "Följ myndigheter, kommuner, upphandlingar och offentliga personer i ett enda flöde som prioriterar avvikelser framför brus.",
    bullets: [
      "Spårar öppna källor, diarier, rättsfall och nyhetsflöden.",
      "Bygger bevakningar per myndighet, region, ämne och beslutsnivå.",
      "Flaggar förändringar, upprepade mönster och plötsliga avvikelser.",
    ],
    tone: "teal",
  },
  {
    eyebrow: "Publicering",
    title: "Rapportmotor med juridisk grind",
    description:
      "AI hjälper till att sammanställa material, men publicering sker först efter faktakontroll, spårbar källkedja och juridiskt godkännande.",
    bullets: [
      "Tydlig status för utkast, faktakoll, juridisk kö och publicering.",
      "Källspårning per påstående för redaktion och jurist.",
      "Rättelseflöde och loggning för efterhandsgranskning.",
    ],
    tone: "ink",
  },
  {
    eyebrow: "Deltagande",
    title: "Publik insyn utan att tappa kontrollen",
    description:
      "Ta emot tips, låt allmänheten följa ärenden och bygg förtroende genom tydliga roller, moderation och ansvarsfördelning.",
    bullets: [
      "Tipsformulär med samtycke, moderering och eskaleringsregler.",
      "Publika rapporter och öppna uppföljningssidor per myndighet.",
      "Roller för redaktion, jurist, analytiker och administratör.",
    ],
    tone: "amber",
  },
];

export const stackChoices: StackChoice[] = [
  {
    title: "Next.js 16, React 19 och TypeScript",
    description:
      "En fullstack-webbapp med App Router, server rendering och ett enda deploybart gränssnitt för publik webb och interna arbetsytor.",
    rationale:
      "Snabb utveckling, stark DX och färre rörliga delar än att separera React-frontend och Express-API i MVP-fasen.",
    status: "Implementerat i denna repo",
    tone: "teal",
  },
  {
    title: "PostgreSQL och Prisma",
    description:
      "Relationsdata för bevakningar, rapporter, juridiska beslut, användare, betalning och audit-loggar.",
    rationale:
      "PostgreSQL ger robust ACID-modell och Prisma ger snabb iteration med tydlig schemahistorik.",
    status: "Implementerat i denna repo",
    tone: "ink",
  },
  {
    title: "Python/FastAPI för AI- och NLP-jobb",
    description:
      "Separat worker för dokumentklassning, entity extraction, embeddings, avvikelser och sammanfattningar.",
    rationale:
      "Python-ekosystemet är fortfarande bäst för textanalys, batchjobb och modellexperimentering.",
    status: "Påbörjat i denna repo",
    tone: "amber",
  },
  {
    title: "Vercel för webb, Railway för data och jobb",
    description:
      "Vercel driver Next.js-gränssnittet och API-routes, medan Railway passar bra för PostgreSQL nu och separata workers eller cronjobb senare.",
    rationale:
      "Det här matchar en hosted-first arbetsmodell, minskar lokal drift och ligger nära hur många svenska produktteam redan kör små och medelstora SaaS-projekt.",
    status: "Implementerat i denna repo",
    tone: "teal",
  },
];

export const monetizationChannels: MonetizationChannel[] = [
  {
    title: "Freemium för publik räckvidd",
    summary:
      "Gratisnivån öppnar rapporter, ett mindre antal bevakningar och ett tryggt sätt att lämna tips.",
    details: [
      "Gratis konto med begränsad historik och veckosammanfattningar.",
      "Driver användartillväxt, trovärdighet och tipsflöde utan hård betalvägg.",
    ],
    tone: "teal",
  },
  {
    title: "Premiumabonnemang för arbetsflöde",
    summary:
      "Betalda planer låser upp fler bevakningar, realtidsnotiser, teamfunktioner och juridisk arbetskö.",
    details: [
      "Rimlig prissättning för journalister, organisationer och mindre redaktioner.",
      "Återkommande intäkter finansierar datakvalitet, moderation och säker drift.",
    ],
    tone: "ink",
  },
  {
    title: "Pay-per-use för tunga analyser",
    summary:
      "Enstaka köp passar export, djupare historiska jämförelser, AI-körningar och större datamängder.",
    details: [
      "Minskar friktion för tillfälliga behov.",
      "Låter användare betala för faktisk belastning i stället för att överabonnera.",
    ],
    tone: "amber",
  },
  {
    title: "Etiska annonser med hård policy",
    summary:
      "Sponsrade placeringar kan fungera, men endast om de är tydligt märkta och hålls långt från känsliga dataflöden.",
    details: [
      "Tillåt endast juridik, integritet, visselblåsarverktyg och närliggande samhällsnyttiga tjänster.",
      "Ingen profilering på känsliga personuppgifter eller pågående ärenden.",
    ],
    tone: "teal",
  },
];

export const legalPillars: LegalPillar[] = [
  {
    title: "Rättslig grund och ändamålsbegränsning",
    description:
      "Varje datakategori behöver dokumenterad rättslig grund, tydligt ändamål och separata retention-regler.",
    points: [
      "Kartlägg vilken behandling som vilar på berättigat intresse, avtal eller allmänt intresse.",
      "Särskilj research, publicering och användarkonton i registerförteckningen.",
      "Undvik sekundär användning av data utan ny prövning av laglig grund.",
    ],
    tone: "ink",
  },
  {
    title: "Dataminimering och gallring",
    description:
      "Systemet ska samla in minsta möjliga mängd personuppgifter och ha inbyggda regler för radering, maskning och arkivering.",
    points: [
      "Maska kontaktuppgifter och fritext tidigt i pipeline när de inte behövs.",
      "Sätt tidsgränser för rådata, tipsutkast och juridiskt blockerade ärenden.",
      "Förbered rutiner för registerutdrag, rättelse och radering där det är tillämpligt.",
    ],
    tone: "teal",
  },
  {
    title: "Mänsklig granskning före publicering",
    description:
      "Automatiserad klassning får aldrig ensamt skapa offentliga anklagelser eller riskbedömningar om enskilda personer.",
    points: [
      "Kräv redaktionell och juridisk godkännandekedja för publicering.",
      "Logga vilka källor som stöder varje påstående.",
      "Skapa rutiner för genmäle, rättelse och överklagande av publicerat innehåll.",
    ],
    tone: "amber",
  },
  {
    title: "GDPR, sekretess och förtalsrisk",
    description:
      "Produkten måste bedöma offentlighetsprincipen tillsammans med GDPR, sekretesslagstiftning och regler kring ansvarig publicering.",
    points: [
      "Genomför DPIA för tipsflöde, AI-klassning och högvolymsmonitorering.",
      "Inför spärr mot publicering av särskilt skyddsvärda uppgifter.",
      "Låt svensk jurist granska namnpublicering, sammanställningar och ansvarsfördelning före lansering.",
    ],
    tone: "ink",
  },
];

export const workflowSteps: WorkflowStep[] = [
  {
    title: "Insamling",
    description: "Systemet hämtar enbart definierade öppna källor och tidsstämplar varje signal.",
  },
  {
    title: "Klassning",
    description: "Regler och AI markerar avvikelser, ämnen, geografier och möjlig relevans.",
  },
  {
    title: "Redaktionell kontroll",
    description: "En människa validerar källor, sammanhang och om signalen är publiceringsbar.",
  },
  {
    title: "Juridisk granskning",
    description: "Jurist eller ansvarig granskare bedömer risk, proportionalitet och personuppgifter.",
  },
  {
    title: "Publicering och dialog",
    description: "Rapport publiceras med rättelseflöde, loggning och modererad publik respons.",
  },
];

export const dashboardSignals: DashboardSignal[] = [
  {
    authority: "Inspektionen för vård och omsorg",
    region: "Nationell bevakning",
    severity: "Hög prioritet",
    summary:
      "Tre nya öppna signaler tyder på ett mönster i upphandling och tillsyn som bör granskas tillsammans.",
    items: [
      "1 nytt domstolsdokument länkat till tidigare ärende.",
      "2 medieträffar med samma leverantörskedja.",
      "Status: kräver juridisk kontroll före publicering.",
    ],
    tone: "teal",
  },
  {
    authority: "Länsstyrelsen Stockholm",
    region: "Region Stockholm",
    severity: "Mellanprioritet",
    summary:
      "Förändrat beslutsmönster i ett offentligt diarieförlopp kan motivera en förklarande rapport.",
    items: [
      "Nytt diariedokument upptäckt i nattlig körning.",
      "Tidsserie visar snabbare handläggning än historiskt spann.",
      "Status: redo för redaktionell sammanfattning.",
    ],
    tone: "ink",
  },
  {
    authority: "Trafikverket",
    region: "Västra Götaland",
    severity: "Juridisk kö",
    summary:
      "Ett publikinskickat tips stödjs delvis av öppna källor men kräver extra försiktighet runt personuppgifter.",
    items: [
      "Tipset har samtycke men innehåller känslig fritext.",
      "Maskning behövs innan något delas med redaktion.",
      "Status: blockerad tills gallringsregler har tillämpats.",
    ],
    tone: "amber",
  },
];

export const pricingPlans: PricingPlan[] = [
  {
    name: "Fri insyn",
    price: "0 kr",
    audience: "Privatpersoner och nyfikna väljare",
    description:
      "Basnivån för publik räckvidd, transparens och trygg tipsinlämning utan att skapa betalvägg kring samhällsnyttig information.",
    bullets: [
      "3 aktiva bevakningar",
      "Veckosammanfattningar",
      "Tillgång till publika rapporter",
      "Tipsflöde med samtycke och moderation",
    ],
    tone: "teal",
  },
  {
    name: "Plus",
    price: "249 kr/mån",
    audience: "Journalister, aktivister och små team",
    description:
      "Mer fart i arbetsflödet med fler bevakningar, tätare notiser och export av öppna datautdrag.",
    bullets: [
      "20 aktiva bevakningar",
      "Dagliga eller timvisa varningar",
      "CSV-export av öppna datapunkter",
      "Sparade rapportutkast",
      "2 massutskick per månad till usage-pris",
    ],
    tone: "ink",
  },
  {
    name: "Pro",
    price: "990 kr/mån",
    audience: "Redaktioner, organisationer och rådgivare",
    description:
      "Den operativa planen för team som behöver rollstyrning, revisionsspår och tydlig juridisk arbetskö.",
    bullets: [
      "Obegränsade bevakningar",
      "Rollbaserad åtkomst",
      "Juridisk granskningskö",
      "Prioriterade SLA:er och revisionsloggar",
      "Obegränsade batcher i Byråkrati-bombaren inom abuse-gränser",
    ],
    highlight: true,
    tone: "amber",
  },
  {
    name: "Usage",
    price: "Från 29 kr/körning",
    audience: "Tillfälliga fördjupningar och stora exportjobb",
    description:
      "Betala för det tunga jobbet först när du behöver det: djupanalys, historiska jämförelser, batchkörningar eller större PDF-exporter.",
    bullets: [
      "AI-sammanfattning per körning",
      "Batch-export av ärenden",
      "Historiska jämförelser",
      "Ingen fast bindningstid",
      "Massutskick till myndigheter från 39 kr per batch",
    ],
    tone: "teal",
  },
];

export const governancePrinciples: string[] = [
  "Inga offentliga påståenden publiceras automatiskt utan mänsklig kontroll.",
  "Varje publicerad slutsats ska kunna spåras till källor och ansvarig granskare.",
  "Särskilt känsliga personuppgifter ska blockeras eller maskas innan de når publik yta.",
  "Det måste finnas rutin för genmäle, rättelse och borttagning när det är motiverat.",
];

export const ethicalAdRules: string[] = [
  "Alla annonser ska märkas tydligt och hållas separerade från rapporter, tips och juridiska beslut.",
  "Ingen målgruppsstyrning får bygga på känsliga personuppgifter, politiska åsikter eller pågående ärenden.",
  "Tillåtna annonsörer bör begränsas till juridik, integritet, informationssäkerhet och visselblåsarrelaterade tjänster.",
  "Annonsörer ska granskas manuellt och kunna stängas av om de riskerar att skada plattformens trovärdighet.",
];

export const launchChecklist: string[] = [
  "Låt svensk jurist granska rättslig grund, publiceringsansvar och namnpubliceringspolicy.",
  "Genomför DPIA för AI-klassning, tipsflöde och större personuppgiftsbehandling.",
  "Dokumentera gallringsregler, datakällor och incidentprocesser i ett internt kontrollpaket.",
  "Säkerställ biträdesavtal, loggning och incidentrapportering för driftmiljön.",
  "Bygg rate limiting, abuse-skydd och manuell moderation innan öppet tipsflöde aktiveras brett.",
  "Verifiera att export, annonser och analysfunktioner inte kringgår sekretess- eller proportionalitetsbedömningar.",
];