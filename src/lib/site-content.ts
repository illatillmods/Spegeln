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
    label: "signaljakt mot makten",
    detail: "Automatiska larm från diarier, upphandlingar, domstolar och allt systemet helst gör svårnavigerat.",
  },
  {
    value: "4",
    label: "fronter i samma plattform",
    detail: "Utforska, slå tillbaka, publicera och organisera tryck från samma kontrollrum.",
  },
  {
    value: "0%",
    label: "neutral kuliss",
    detail: "Spegeln är byggd för att provocera fram mer insyn, inte för att tala myndighetsspråk.",
  },
];

export const productModules: ModuleCard[] = [
  {
    eyebrow: "Aktivering",
    title: "Byråkrati-bombaren för samordnat mottryck",
    description:
      "Skapa JO-anmälningar, registerkrav, informationskrav och klagomål i batch när myndigheter kör fast, drar ut på tiden eller gömmer sig bakom processer.",
    bullets: [
      "Genererar mottagaranpassade dokument från ett enda underlag.",
      "Väljer relevanta myndigheter, tillsynsaktörer och registratorer per ärendetyp och region.",
      "Ger spårningskoder, prisestimat och tydligt tempotak innan utskick.",
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
    title: "Rapportmotor utan silkesvantar",
    description:
      "AI hjälper till att bygga underlag, men poängen är att snabbt få fram mönster, sammanhang och pressbara berättelser om hur makten fungerar.",
    bullets: [
      "Tydlig status för råspår, korskoppling, publiceringsspår och vidare tryck.",
      "Källspårning per påstående för den som vill pressa vidare ett ärende.",
      "Öppna rapporter, uppföljningar och återkommande påminnelser om att frågan inte är död.",
    ],
    tone: "ink",
  },
  {
    eyebrow: "Deltagande",
    title: "Publik insyn med öppet tryck",
    description:
      "Ta emot tips, låt allmänheten följa ärenden och bygg kraft genom publik respons, synliga roller och återkommande konfrontation med makten.",
    bullets: [
      "Tipsformulär för människor som redan vet att något skaver.",
      "Publika rapporter och öppna uppföljningssidor per myndighet och spår.",
      "Roller för analytiker, publicister, kampanjbyggare och administratörer.",
    ],
    tone: "amber",
  },
];

export const stackChoices: StackChoice[] = [
  {
    title: "Next.js 16, React 19 och TypeScript",
    description:
      "En fullstack-webbapp med App Router, server rendering och ett enda deploybart gränssnitt för publik press, dokumentspår och interna arbetsytor.",
    rationale:
      "Snabb utveckling väger tyngre än perfekt arkitektur när målet är att jaga systemfel fort och få ut funktionerna i händerna på användarna.",
    status: "Implementerat i denna repo",
    tone: "teal",
  },
  {
    title: "PostgreSQL och Prisma",
    description:
      "Relationsdata för bevakningar, rapporter, beslutsspår, användare, betalning och revisionsbara händelser.",
    rationale:
      "PostgreSQL ger en robust modell för spårkedjor och Prisma gör det snabbt att ändra strukturen när nya svagheter i systemet upptäcks.",
    status: "Implementerat i denna repo",
    tone: "ink",
  },
  {
    title: "Python/FastAPI för AI- och NLP-jobb",
    description:
      "Separat worker för dokumentklassning, entity extraction, embeddings, avvikelser och sammanfattningar som vässar nästa drag.",
    rationale:
      "Python-ekosystemet är fortfarande snabbast när textmassor ska tolkas, korskopplas och pressas till användbara mönster.",
    status: "Implementerat i denna repo",
    tone: "amber",
  },
  {
    title: "Vercel för webb, Railway för data och jobb",
    description:
      "Vercel driver gränssnittet och proxar API-trafiken, medan Railway kör den separata backendtjänsten, databasen och jobb som måste leva nära datan.",
    rationale:
      "Hosted-first minskar onödig driftfriktion så att mer energi går till att bygga spår, inte att sköta servrar.",
    status: "Implementerat i denna repo",
    tone: "teal",
  },
];

export const monetizationChannels: MonetizationChannel[] = [
  {
    title: "Fri tillgång för brett tryck",
    summary:
      "Gratisnivån öppnar rapporter, grundbevakningar och ett öppet inflöde av tips.",
    details: [
      "Gratis konto med begränsad historik och veckosammanfattningar.",
      "Ingen betalvägg framför det som behövs för att se mönster, följa makten och börja ställa frågor.",
    ],
    tone: "teal",
  },
  {
    title: "Premium för fart och tyngre verktyg",
    summary:
      "Betalda planer låser upp fler bevakningar, snabbare larm, teamytor och tyngre analysmotorer.",
    details: [
      "Prissatt för journalister, aktivister, organisationer och små grävlag.",
      "Återkommande intäkter finansierar fler källor, tätare crawlning och hårdare press mot systemen.",
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
    title: "Allierade sponsorer, inte putsad fasad",
    summary:
      "Sponsrade ytor kan fungera när de tydligt pekar mot verktyg som hjälper folk att rota, arkivera, kryptera och publicera.",
    details: [
      "Sponsorer ska stärka användarens mottryck, inte tona ned sajtens konflikt med makten.",
      "Ingen sponsor får styra vilka myndighetsspår som följs eller vilka dokument som lyfts.",
    ],
    tone: "teal",
  },
];

export const legalPillars: LegalPillar[] = [
  {
    title: "Maximal insyn i beslutsmaskinen",
    description:
      "Följ diarier, register, upphandlingar och relationer tills beslutsmaskinen slutar låtsas vara ogenomskinlig.",
    points: [
      "Knyt personer, myndigheter, leverantörer och beslut till samma öppna spårkedja.",
      "Bygg profiler som visar hur offentliga roller, pengar och dokument faktiskt hänger ihop.",
      "Låt användaren gå från en signal till ett mönster utan att fastna i myndighetens egen berättelse.",
    ],
    tone: "ink",
  },
  {
    title: "Källkedjor som biter tillbaka",
    description:
      "Varje spår ska kunna pressas vidare till dokument, relation, tidslinje eller offentlig handling som går att visa upp.",
    points: [
      "Gör källfamiljer tydliga så att användaren vet var trycket kan läggas härnäst.",
      "Korskoppla öppna poster så att myndighetens språkliga dimridåer blir svårare att gömma sig bakom.",
      "Låt rådata, sammanfattningar och färdiga rapporter leva sida vid sida när det stärker berättelsen.",
    ],
    tone: "teal",
  },
  {
    title: "Publikt tryck i stället för neutral ton",
    description:
      "Spegeln är byggd för att trigga frågor, blåsa liv i vittnesmål och göra institutionell bekvämlighet dyrare.",
    points: [
      "Publicera inte som ett passivt arkiv, utan som en plattform som håller trycket uppe över tid.",
      "Låt rapporter, wiki, video och scorecards peka in i varandra i stället för att leva isolerat.",
      "Skriv så att makten måste svara, inte så att den kan luta sig tillbaka.",
    ],
    tone: "amber",
  },
  {
    title: "Gemensam moteld",
    description:
      "När någon hittar ett mönster ska andra kunna förstärka det med tips, vittnesmål, batcher och export.",
    points: [
      "Folkets domstol, Myndighetsgranskaren och Reverse Surveillance ska kännas som delar av samma upptrappning.",
      "Gör det lätt att gå från enskilt vittnesmål till gemensam berättelse och vidare till samordnat utskick.",
      "Bygg communityytor som förstärker kritik mot myndigheter i stället för att neutralisera den.",
    ],
    tone: "ink",
  },
];

export const workflowSteps: WorkflowStep[] = [
  {
    title: "Fånga spår",
    description: "Systemet drar in öppna källor, tips och bilagor där makten lämnar avtryck.",
  },
  {
    title: "Korskoppla",
    description: "Regler och AI markerar mönster, relationer, upprepningar och svaga punkter som är värda att följa.",
  },
  {
    title: "Vässa berättelsen",
    description: "Underlaget förvandlas till profiler, rapportspår, scorecards och batchredo material.",
  },
  {
    title: "Släpp trycket",
    description: "Materialet går ut som rapport, wiki, vittnesmål eller samordnat utskick mot rätt mottagare.",
  },
  {
    title: "Håll elden vid liv",
    description: "Publiken följer, röstar, skickar nytt material och pressar vidare tills frågan inte går att ignorera.",
  },
];

export const dashboardSignals: DashboardSignal[] = [
  {
    authority: "Inspektionen för vård och omsorg",
    region: "Nationell bevakning",
    severity: "Maxtryck",
    summary:
      "Tre nya öppna spår pekar mot ett mönster i upphandling och tillsyn som tål att blåsas upp offentligt.",
    items: [
      "1 nytt domstolsdokument länkat till tidigare ärende.",
      "2 medieträffar med samma leverantörskedja.",
      "Status: redo att pressas vidare i rapportflödet.",
    ],
    tone: "teal",
  },
  {
    authority: "Länsstyrelsen Stockholm",
    region: "Region Stockholm",
    severity: "Trycket ökar",
    summary:
      "Förändrat beslutsmönster i ett offentligt diarieförlopp kan bli en rapport som tvingar fram svar.",
    items: [
      "Nytt diariedokument upptäckt i nattlig körning.",
      "Tidsserie visar snabbare handläggning än historiskt spann.",
      "Status: redo för sammanfattning och vidare spridning.",
    ],
    tone: "ink",
  },
  {
    authority: "Trafikverket",
    region: "Västra Götaland",
    severity: "Skarpt läge",
    summary:
      "Ett publikinskickat tips har öppnat fler dörrar än myndigheten lär gilla och pekar mot ett större mönster.",
    items: [
      "Tipset bärs upp av flera öppna referenser.",
      "Ny batch eller fördjupad profil kan bli nästa drag.",
      "Status: användarna trycker redan på för uppföljning.",
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
      "Basnivån för rapporter, grundbevakning och öppet inflöde utan att sätta betalvägg framför den fria insynen.",
    bullets: [
      "3 aktiva bevakningar",
      "Veckosammanfattningar",
      "Tillgång till publika rapporter",
      "Öppet tipsflöde och publik respons",
    ],
    tone: "teal",
  },
  {
    name: "Plus",
    price: "249 kr/mån",
    audience: "Journalister, aktivister och små team",
    description:
      "Mer fart i arbetsflödet med fler bevakningar, tätare notiser och export av öppna datautdrag som går att bygga vidare på.",
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
      "Planen för team som vill ha högre tempo, gemensamma arbetsytor och full tryckkapacitet i samma system.",
    bullets: [
      "Obegränsade bevakningar",
      "Rollbaserad åtkomst",
      "Gemensam kampanjyta",
      "Prioriterade pushar och revisionsloggar",
      "Obegränsade batcher i Byråkrati-bombaren inom tempogränser",
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
  "Spegeln finns för att störa mörkläggning, inte för att ge makten ett bekvämare språk.",
  "Varje publikt påstående ska kunna tryckas tillbaka till dokument, tidslinjer eller öppna källor.",
  "När ett mönster spricker upp ska communityn kunna förstärka det med vittnesmål, export och vidare spår.",
  "Spegeln väljer sida: mer ljus, mindre myndighetsro.",
];

export const ethicalAdRules: string[] = [
  "Sponsrade ytor ska vara öppna med att de är sponsrade och aldrig låtsas vara redaktionellt material.",
  "Sponsorer ska hjälpa användare att gräva, arkivera, kryptera, organisera eller publicera.",
  "Ingen sponsor får styra vilka myndighetsspår som följs eller vilka dokument som lyfts.",
  "Om en sponsor försöker putsa makten kastas den ut.",
];

export const launchChecklist: string[] = [
  "Öppna fler källspår mot kommuner, domstolar och bolag runt myndigheterna.",
  "Skruva upp batchkapaciteten för samordnade kampanjer och uppföljningar.",
  "Gör export, API och scorecards råare så att fler kan bygga eget tryck ovanpå datan.",
  "Ge communityn bättre verktyg för vittnesmål, revisioner och upptrappning.",
  "Lägg på fler realtidslarm och tydligare myndighetsprofiler i upptäcktsläget.",
  "Fortsätt kapa friktion mellan första spår, första publicering och första batch.",
];