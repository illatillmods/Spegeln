export type CoverageStatus = "ACTIVE" | "PILOT" | "LEGAL_REVIEW";

export type MonitoringSourceCoverage = {
  id: string;
  label: string;
  category: string;
  records: number;
  latestRecordAt: string;
  lastSyncedAt: string;
  cadence: string;
  status: CoverageStatus;
  note: string;
};

export type CorrelatedEntity = {
  id: string;
  name: string;
  category: string;
  relationship: string;
  publicBasis: string;
  overlap: string;
  recordCount: number;
};

export type TimelineEvent = {
  id: string;
  date: string;
  title: string;
  description: string;
  category: string;
  source: string;
  impact: string;
  connectedEntities: string[];
  amount?: string;
  highlight?: boolean;
};

export type Verdict = {
  court: string;
  description: string;
  date: string;
};

export type PatternSignal = {
  id: string;
  title: string;
  summary: string;
  status: "Bekräftad" | "Framväxande";
};

export type AlertItem = {
  id: string;
  date: string;
  message: string;
  severity: "info" | "warning" | "critical";
  source: string;
  trigger: string;
};

export type RecordDigest = {
  id: string;
  category: string;
  title: string;
  date: string;
  source: string;
  summary: string;
};

export type WatchTargetSummary = {
  targetId: string;
  targetType: "official" | "authority";
  targetName: string;
  recommendedCadence: "REALTIME" | "HOURLY" | "DAILY";
  defaultChannels: Array<"email" | "browser" | "rss">;
  note: string;
};

export type MockIndividualProfile = {
  id: string;
  fullName: string;
  title: string;
  authorityName: string;
  authoritySlug: string;
  summary: string;
  income: number;
  assetFootprint: string[];
  companies: string[];
  declaredAssociations: string[];
  totalRecords: number;
  monitoredSources: number;
  networkSize: number;
  openAlerts: number;
  lastDailySyncAt: string;
  refreshPolicy: string;
  coverage: MonitoringSourceCoverage[];
  network: CorrelatedEntity[];
  patternSignals: PatternSignal[];
  timeline: TimelineEvent[];
  verdicts: Verdict[];
  alerts: AlertItem[];
  recordDigests: RecordDigest[];
  watchTarget: WatchTargetSummary;
};

export type MockIndividual = {
  id: string;
  fullName: string;
  title: string;
  authorityName: string;
  summary: string;
  totalRecords: number;
  monitoredSources: number;
  networkSize: number;
  openAlerts: number;
  lastSyncAt: string;
};

export type MockAuthority = {
  id: string;
  slug: string;
  name: string;
  category: string;
  region: string;
  summary: string;
  monitoredOfficials: number;
  totalRecords: number;
  openAlerts: number;
  lastSyncAt: string;
  focusAreas: string[];
  sourceMix: string[];
  watchTarget: WatchTargetSummary;
};

export type MockWatchdogSnapshot = {
  totalTrackedRecords: number;
  officialsCovered: number;
  authoritiesCovered: number;
  dailySyncCoverage: string;
  publicSourceFamilies: string[];
  guardrails: string[];
};

const authorityDirectory: MockAuthority[] = [
  {
    id: "authority-polisen-stockholm",
    slug: "polismyndigheten-region-stockholm",
    name: "Polismyndigheten Region Stockholm",
    category: "Polis",
    region: "Stockholm",
    summary: "FOI-svar, upphandlingsspår, disciplinära beslut och publicerade reseräkningar körs i samma observationsflöde.",
    monitoredOfficials: 14,
    totalRecords: 1842,
    openAlerts: 6,
    lastSyncAt: "2026-03-30T06:10:00Z",
    focusAreas: ["Extern konsultanvändning", "Disciplinärenden", "Reseräkningar"],
    sourceMix: ["FOI-svar", "Upphandling", "Domstol", "Registerutdrag"],
    watchTarget: {
      targetId: "authority-polisen-stockholm",
      targetType: "authority",
      targetName: "Polismyndigheten Region Stockholm",
      recommendedCadence: "REALTIME",
      defaultChannels: ["email", "browser"],
      note: "Skickar notifieringar när nya offentliga handlingar eller verifierade avvikelser publiceras."
    }
  },
  {
    id: "authority-sodertorns-tingsratt",
    slug: "sodertorns-tingsratt",
    name: "Södertörns tingsrätt",
    category: "Domstol",
    region: "Stockholm",
    summary: "Domar, jävsanmälningar, arvodesuppgifter och publicerade sidodrag följs som en gemensam domstolsfeed.",
    monitoredOfficials: 9,
    totalRecords: 1268,
    openAlerts: 3,
    lastSyncAt: "2026-03-30T05:45:00Z",
    focusAreas: ["Jävsanmälningar", "Arvoden", "Föreläsningsuppdrag"],
    sourceMix: ["Domstolshandling", "Registerutdrag", "Offentlig agenda"],
    watchTarget: {
      targetId: "authority-sodertorns-tingsratt",
      targetType: "authority",
      targetName: "Södertörns tingsrätt",
      recommendedCadence: "HOURLY",
      defaultChannels: ["email", "rss"],
      note: "Lämplig för redaktioner som vill fånga nya beslut, entlediganden eller jävsanmälningar snabbt."
    }
  },
  {
    id: "authority-stockholms-stad",
    slug: "stockholms-stad",
    name: "Stockholms stad",
    category: "Kommun",
    region: "Stockholm",
    summary: "Politiska donationer, upphandlingsbilagor, diarieförda FOI-svar och resekostnader korreleras mot samma beslutslinje.",
    monitoredOfficials: 22,
    totalRecords: 2314,
    openAlerts: 8,
    lastSyncAt: "2026-03-30T06:25:00Z",
    focusAreas: ["Upphandling", "Donationer", "Tjänsteresor"],
    sourceMix: ["FOI-svar", "Donationer", "Upphandling", "Kommunala diarier"],
    watchTarget: {
      targetId: "authority-stockholms-stad",
      targetType: "authority",
      targetName: "Stockholms stad",
      recommendedCadence: "REALTIME",
      defaultChannels: ["email", "browser", "rss"],
      note: "Bra för att följa nya bilagor, budgetbeslut och uppdaterade donationsredovisningar."
    }
  }
];

const profileDirectory: Record<string, MockIndividualProfile> = {
  "1": {
    id: "1",
    fullName: "Anna Andersson",
    title: "Polisinspektör",
    authorityName: "Polismyndigheten Region Stockholm",
    authoritySlug: "polismyndigheten-region-stockholm",
    summary: "Aggregerad profil över offentlig tjänsteutövning, upphandlingskopplingar, publicerade bolagsengagemang och verifierade myndighetsresor.",
    income: 512000,
    assetFootprint: ["Västerås, villa", "Stockholm, tjänsteresekostnader redovisade"],
    companies: ["Trygghetskonsult AB (tidigare styrelseuppdrag)", "Stadspartner Norden AB (förekommer i upphandlingsbilagor)"],
    declaredAssociations: [
      "Jävsdeklaration 2025 om extern föreläsningsersättning.",
      "Offentligt redovisat tidigare bolagsuppdrag i Trygghetskonsult AB.",
      "Återkommande kontaktpunkt i två upphandlingsärenden med samma konsultnätverk."
    ],
    totalRecords: 638,
    monitoredSources: 6,
    networkSize: 7,
    openAlerts: 3,
    lastDailySyncAt: "2026-03-30T06:10:00Z",
    refreshPolicy: "Dagliga fullsyncar med snabbare push för nya offentliga dokument och beslut.",
    coverage: [
      {
        id: "a1-coverage-foi",
        label: "FOI-svar",
        category: "Begärda handlingar",
        records: 112,
        latestRecordAt: "2026-03-30",
        lastSyncedAt: "2026-03-30T06:10:00Z",
        cadence: "Dagligen + push vid nytt svar",
        status: "ACTIVE",
        note: "Kör diarienummer, bilagor och svarstider mot samma person- och ärendeknutpunkt."
      },
      {
        id: "a1-coverage-court",
        label: "Domstolshandlingar",
        category: "Rättsprocess",
        records: 41,
        latestRecordAt: "2026-03-18",
        lastSyncedAt: "2026-03-30T05:40:00Z",
        cadence: "Dagligen",
        status: "ACTIVE",
        note: "Fångar vittnesmål, beslut och hänvisningar till samma upphandling eller aktör."
      },
      {
        id: "a1-coverage-procurement",
        label: "Upphandling",
        category: "Kontrakt och leverantörer",
        records: 214,
        latestRecordAt: "2026-03-27",
        lastSyncedAt: "2026-03-30T06:05:00Z",
        cadence: "Dagligen",
        status: "ACTIVE",
        note: "Binder anbud, bilagor och avtalsförlängningar till samma leverantörsnätverk."
      },
      {
        id: "a1-coverage-company",
        label: "Bolagsverket",
        category: "Bolag och roller",
        records: 56,
        latestRecordAt: "2026-03-12",
        lastSyncedAt: "2026-03-29T23:15:00Z",
        cadence: "Dagligen",
        status: "ACTIVE",
        note: "Visar endast publicerade bolagsroller och verksamhetsadresser, inte privata folkbokföringsadresser."
      },
      {
        id: "a1-coverage-travel",
        label: "Tjänsteresor",
        category: "Reseräkningar",
        records: 19,
        latestRecordAt: "2026-03-21",
        lastSyncedAt: "2026-03-30T04:55:00Z",
        cadence: "Dagligen",
        status: "ACTIVE",
        note: "Begränsat till publicerade reseräkningar och konferensfakturor. Ingen positionsspårning."
      },
      {
        id: "a1-coverage-donation",
        label: "Politisk finansiering",
        category: "Offentliga donationer",
        records: 8,
        latestRecordAt: "2026-02-11",
        lastSyncedAt: "2026-03-28T20:10:00Z",
        cadence: "Veckovis pilot",
        status: "PILOT",
        note: "Pilotkörning för donationer till externa säkerhetsforum med offentlig redovisning."
      }
    ],
    network: [
      {
        id: "anna-network-1",
        name: "Trygghetskonsult AB",
        category: "Bolag",
        relationship: "Tidigare styrelseuppdrag",
        publicBasis: "Bolagsverket",
        overlap: "Bolaget dyker upp i två senare upphandlingsbilagor där samma sakområde återkommer.",
        recordCount: 18
      },
      {
        id: "anna-network-2",
        name: "Patrik Lund",
        category: "Återkommande samarbetspartner",
        relationship: "Föreläsare i samma externa säkerhetsforum",
        publicBasis: "Offentlig agenda och arvodesredovisning",
        overlap: "Tre öppna arrangemang samt ett konsultuppdrag via gemensam arrangör.",
        recordCount: 9
      },
      {
        id: "anna-network-3",
        name: "Kungsholmen företagscenter",
        category: "Verksamhetsadress",
        relationship: "Delad affärsadress mellan två leverantörer",
        publicBasis: "Bolagsadress i offentliga register",
        overlap: "Trygghetskonsult AB och Stadspartner Norden AB använder samma serviceadress.",
        recordCount: 11
      },
      {
        id: "anna-network-4",
        name: "Stockholms stad, upphandlingsenheten",
        category: "Myndighetskoppling",
        relationship: "Återkommande ärendekorsning",
        publicBasis: "Upphandlingsdokument och FOI-svar",
        overlap: "Samma konsultnätverk förekommer i två myndigheters underlag.",
        recordCount: 24
      },
      {
        id: "anna-network-5",
        name: "Extern säkerhetskonferens 2025",
        category: "Offentligt uppdrag",
        relationship: "Arvoderad medverkande",
        publicBasis: "Arvodesredovisning",
        overlap: "Konferensen sponsrades av leverantör som också lämnade anbud i ett relaterat uppdrag.",
        recordCount: 6
      },
      {
        id: "anna-network-6",
        name: "Södertörns tingsrätt",
        category: "Domstolskoppling",
        relationship: "Vittne i mål om upphandlingsprocess",
        publicBasis: "Domstolshandling",
        overlap: "Domstolsmålet refererar till samma leverantörskrets som upphandlingarna ovan.",
        recordCount: 4
      },
      {
        id: "anna-network-7",
        name: "Deklarerade närståendekopplingar",
        category: "Skyddad metadata",
        relationship: "Förekommer endast som jävsmarkering",
        publicBasis: "Jävsdeklaration",
        overlap: "Privata namn exponeras inte; endast att en närståendekoppling har offentliggjorts i beslutsunderlaget.",
        recordCount: 2
      }
    ],
    patternSignals: [
      {
        id: "anna-pattern-1",
        title: "Samma konsultnätverk dyker upp i flera myndighetsspår",
        summary: "Upphandling, föreläsningsarvode och FOI-svar pekar mot samma leverantörskrets inom nio månader.",
        status: "Bekräftad"
      },
      {
        id: "anna-pattern-2",
        title: "Publicerade resor sammanfaller med externa uppdrag",
        summary: "Två tjänsteresor ligger i direkt anslutning till externa evenemang där samma sakområde diskuterades.",
        status: "Framväxande"
      }
    ],
    timeline: [
      {
        id: "anna-event-1",
        date: "2026-03-30",
        title: "Nytt FOI-svar publicerat",
        description: "Kompletterande bilagor om konsultuppdrag laddades upp och länkades till befintligt upphandlingsärende.",
        category: "FOI-svar",
        source: "Diariefört FOI-svar",
        impact: "Ökar täckningen av leverantörsnätverket.",
        connectedEntities: ["Trygghetskonsult AB", "Stockholms stad, upphandlingsenheten"],
        highlight: true
      },
      {
        id: "anna-event-2",
        date: "2026-03-21",
        title: "Reseräkning för konferensresa diarieförd",
        description: "Publicerad reseräkning för säkerhetskonferens i Göteborg med arvodesnotering i separat bilaga.",
        category: "Tjänsteresa",
        source: "Reseräkning",
        impact: "Knyter extern medverkan till samma kalendervecka som nytt konsultunderlag.",
        connectedEntities: ["Extern säkerhetskonferens 2025"],
        amount: "4 860 kr"
      },
      {
        id: "anna-event-3",
        date: "2026-03-18",
        title: "Domstolshandling kompletterad",
        description: "Nytt yttrande i upphandlingsmål refererar till leverantör med gemensam verksamhetsadress.",
        category: "Domstol",
        source: "Södertörns tingsrätt",
        impact: "Bekräftar korskopplingen mellan domstolsmål och upphandlingsspåret.",
        connectedEntities: ["Kungsholmen företagscenter", "Södertörns tingsrätt"]
      },
      {
        id: "anna-event-4",
        date: "2025-11-06",
        title: "Jävsdeklaration lämnad",
        description: "Extern arvodesersättning och tidigare bolagsroll noterades i beslutsunderlag.",
        category: "Jäv",
        source: "Intern publik handling",
        impact: "Ger offentlig grund för att bevaka framtida upphandlingar närmare.",
        connectedEntities: ["Trygghetskonsult AB"]
      },
      {
        id: "anna-event-5",
        date: "2025-05-14",
        title: "Föreläsningsuppdrag arvoderat",
        description: "Arvodesredovisning för extern säkerhetskonferens publicerad.",
        category: "Arvode",
        source: "Arvodesredovisning",
        impact: "Introducerar extern arrangör i nätverksgrafen.",
        connectedEntities: ["Patrik Lund", "Extern säkerhetskonferens 2025"],
        amount: "8 000 kr"
      },
      {
        id: "anna-event-6",
        date: "2024-09-03",
        title: "Upphandlingsbilaga offentliggjord",
        description: "Leverantörslista visar Stadspartner Norden AB som underleverantör i relaterat sakområde.",
        category: "Upphandling",
        source: "Upphandlingsportal",
        impact: "Länkar två tidigare separata leverantörsspår.",
        connectedEntities: ["Stadspartner Norden AB", "Trygghetskonsult AB"]
      },
      {
        id: "anna-event-7",
        date: "2023-11-01",
        title: "Vittnesmål i mål B 1234-23",
        description: "Vittnesmål i mål om överprövad upphandlingsprocess.",
        category: "Domstol",
        source: "Södertörns tingsrätt",
        impact: "För in domstolsspåret i tidslinjen.",
        connectedEntities: ["Södertörns tingsrätt"]
      },
      {
        id: "anna-event-8",
        date: "2022-12-01",
        title: "Bolagsroll registrerad",
        description: "Styrelseuppdrag i Trygghetskonsult AB registrerat offentligt.",
        category: "Bolag",
        source: "Bolagsverket",
        impact: "Startpunkt för bolagskorsningen i grafen.",
        connectedEntities: ["Trygghetskonsult AB"]
      }
    ],
    verdicts: [
      { court: "Södertörns tingsrätt", description: "Vittne i mål B 1234-23 om överprövad upphandling", date: "2023-11-01" }
    ],
    alerts: [
      {
        id: "anna-alert-1",
        date: "2026-03-30",
        message: "Nytt FOI-svar kopplar samma konsultnätverk till ytterligare bilagor.",
        severity: "warning",
        source: "FOI-svar",
        trigger: "Ny offentlig handling"
      },
      {
        id: "anna-alert-2",
        date: "2026-03-21",
        message: "Reseräkning publicerad inom samma vecka som externt arvoderat uppdrag.",
        severity: "info",
        source: "Reseräkning",
        trigger: "Ny reseredovisning"
      },
      {
        id: "anna-alert-3",
        date: "2026-03-18",
        message: "Domstolshandling hänvisar till leverantör med delad affärsadress.",
        severity: "critical",
        source: "Domstolshandling",
        trigger: "Ny verifierad korsreferens"
      }
    ],
    recordDigests: [
      {
        id: "anna-digest-1",
        category: "FOI-svar",
        title: "Kompletterande bilagor om konsultuppdrag",
        date: "2026-03-30",
        source: "Polismyndigheten Region Stockholm",
        summary: "Tre bilagor som kopplar leverantör och uppdragsbeskrivning till redan bevakat ärende."
      },
      {
        id: "anna-digest-2",
        category: "Upphandling",
        title: "Bilaga: externa säkerhetskonsulter 2024",
        date: "2024-09-03",
        source: "Offentlig upphandlingsportal",
        summary: "Stadspartner Norden AB listas som underleverantör i samma sakområde som tidigare bolagskoppling."
      },
      {
        id: "anna-digest-3",
        category: "Tjänsteresa",
        title: "Reseräkning säkerhetskonferens Göteborg",
        date: "2026-03-21",
        source: "Publicerad reseredovisning",
        summary: "Resa och konferensavgift sammanfaller med extern arvodesredovisning."
      }
    ],
    watchTarget: {
      targetId: "official-anna-andersson",
      targetType: "official",
      targetName: "Anna Andersson",
      recommendedCadence: "REALTIME",
      defaultChannels: ["email", "browser"],
      note: "Prioriterar nya FOI-svar, domstolshandlingar och uppdaterade upphandlingsbilagor."
    }
  },
  "2": {
    id: "2",
    fullName: "Bengt Bergström",
    title: "Domare",
    authorityName: "Södertörns tingsrätt",
    authoritySlug: "sodertorns-tingsratt",
    summary: "Korsar domstolshandlingar, jävsanmälningar, föreläsningsarvoden och offentligt redovisade sidouppdrag i en sammanhållen granskningsprofil.",
    income: 842000,
    assetFootprint: ["Stockholm, bostadsrätt", "Publicerade konferens- och föreläsningskostnader"],
    companies: ["Inga aktiva bolagsroller i öppna register"],
    declaredAssociations: [
      "Två offentligt redovisade föreläsningsuppdrag via Domstolsakademin.",
      "Jävsanmälan 2026 i mål med tidigare samarbetspartner som expertvittne.",
      "Återkommande paneldeltagande med samma juridiska rådgivare i offentliga seminarier."
    ],
    totalRecords: 412,
    monitoredSources: 5,
    networkSize: 5,
    openAlerts: 2,
    lastDailySyncAt: "2026-03-30T05:45:00Z",
    refreshPolicy: "Dagliga fullsyncar av domstolshandlingar och timvisa diffar för nya jävsanmälningar.",
    coverage: [
      {
        id: "b1-coverage-court",
        label: "Domar och beslut",
        category: "Rättsprocess",
        records: 201,
        latestRecordAt: "2026-03-26",
        lastSyncedAt: "2026-03-30T05:45:00Z",
        cadence: "Dagligen",
        status: "ACTIVE",
        note: "Binder avgöranden, skiljaktiga meningar och jävsanmälningar till samma tidslinje."
      },
      {
        id: "b1-coverage-disclosure",
        label: "Jävsanmälningar",
        category: "Offentliga deklarationer",
        records: 18,
        latestRecordAt: "2026-03-26",
        lastSyncedAt: "2026-03-30T05:15:00Z",
        cadence: "Timvis diff",
        status: "ACTIVE",
        note: "Endast publicerade jävsgrunder och relaterade diarienummer visas."
      },
      {
        id: "b1-coverage-speaking",
        label: "Föreläsningsarvoden",
        category: "Arvoden",
        records: 23,
        latestRecordAt: "2026-02-04",
        lastSyncedAt: "2026-03-29T23:40:00Z",
        cadence: "Dagligen",
        status: "ACTIVE",
        note: "Fångar arrangör, arvodesnivå och öppet redovisad ämneskoppling."
      },
      {
        id: "b1-coverage-foi",
        label: "FOI-svar",
        category: "Begärda handlingar",
        records: 61,
        latestRecordAt: "2026-03-14",
        lastSyncedAt: "2026-03-30T04:50:00Z",
        cadence: "Dagligen",
        status: "ACTIVE",
        note: "Synkar svar om externa uppdrag, kalendrar och diarieförda ersättningar."
      },
      {
        id: "b1-coverage-side-work",
        label: "Sidouppdrag",
        category: "Offentliga uppdrag",
        records: 15,
        latestRecordAt: "2026-01-19",
        lastSyncedAt: "2026-03-28T21:05:00Z",
        cadence: "Veckovis juridisk kontroll",
        status: "LEGAL_REVIEW",
        note: "Nya källor hålls tillbaka tills klassning och juristgenomgång är klar."
      }
    ],
    network: [
      {
        id: "bengt-network-1",
        name: "Domstolsakademin",
        category: "Offentligt uppdrag",
        relationship: "Återkommande föreläsare",
        publicBasis: "Arvodesredovisning",
        overlap: "Två föreläsningar och en paneldag inom samma ämnesområde som pågående mål.",
        recordCount: 7
      },
      {
        id: "bengt-network-2",
        name: "Karin Sjöberg",
        category: "Återkommande samarbetspartner",
        relationship: "Paneldeltagare i offentliga seminarier",
        publicBasis: "Seminarieprogram",
        overlap: "Tre gemensamma paneler och en jävsanmälan där samma namn förekommer som expertvittne.",
        recordCount: 5
      },
      {
        id: "bengt-network-3",
        name: "Södertörns tingsrätt",
        category: "Myndighetskoppling",
        relationship: "Huvudmyndighet",
        publicBasis: "Officiella beslut",
        overlap: "Tidslinjen binder avgöranden, entlediganden och jävsanmälningar till samma domstolsmiljö.",
        recordCount: 32
      },
      {
        id: "bengt-network-4",
        name: "Rättsforum Norden",
        category: "Extern arrangör",
        relationship: "Arvoderat paneluppdrag",
        publicBasis: "Offentlig agenda",
        overlap: "Arrangören återkommer i arvodesunderlag och FOI-svar om externa uppdrag.",
        recordCount: 4
      },
      {
        id: "bengt-network-5",
        name: "Offentlig jävsmetadata",
        category: "Skyddad metadata",
        relationship: "Visas endast på nivå av jävsgrund",
        publicBasis: "Jävsanmälan",
        overlap: "Privat information redovisas inte; endast att en jävsgrund offentliggjorts och hur den påverkar målet.",
        recordCount: 3
      }
    ],
    patternSignals: [
      {
        id: "bengt-pattern-1",
        title: "Jävsanmälningar och arvodesuppdrag möts i samma ämnesområde",
        summary: "Offentliga seminarier och jävsanmälningar berör samma rättsområde inom ett halvår.",
        status: "Bekräftad"
      },
      {
        id: "bengt-pattern-2",
        title: "Flera externa uppdrag saknar samtidig kalenderpublicering",
        summary: "Två arvoderade uppdrag återfinns i arvodesredovisning men inte i först publicerad kalenderexport.",
        status: "Framväxande"
      }
    ],
    timeline: [
      {
        id: "bengt-event-1",
        date: "2026-03-26",
        title: "Jävsanmälan diarieförd",
        description: "Jävsanmälan kopplad till mål där tidigare panelsamarbetspartner förekommer som expertvittne.",
        category: "Jäv",
        source: "Södertörns tingsrätt",
        impact: "Skapar ny nätverkskoppling mellan seminarier och rättsprocess.",
        connectedEntities: ["Karin Sjöberg"],
        highlight: true
      },
      {
        id: "bengt-event-2",
        date: "2026-02-04",
        title: "Föreläsningsarvode redovisat",
        description: "Arvode för seminarium om processledning publicerat.",
        category: "Arvode",
        source: "Arvodesredovisning",
        impact: "Lägger till extern arrangör i korrelationsgrafen.",
        connectedEntities: ["Domstolsakademin"],
        amount: "12 500 kr"
      },
      {
        id: "bengt-event-3",
        date: "2025-12-10",
        title: "Kalenderexport kompletterad",
        description: "Extern paneldag lades till i senare version av offentlig kalender.",
        category: "Kalender",
        source: "FOI-svar",
        impact: "Visar förändring mellan första och senare publik version.",
        connectedEntities: ["Rättsforum Norden"]
      },
      {
        id: "bengt-event-4",
        date: "2025-03-01",
        title: "Domare i mål T 9876-25",
        description: "Avgörande i civilmål med offentlig domenhet och metadata om sammansättning.",
        category: "Domstol",
        source: "Södertörns tingsrätt",
        impact: "Förankrar tidslinjen i officiella avgöranden.",
        connectedEntities: ["Södertörns tingsrätt"]
      },
      {
        id: "bengt-event-5",
        date: "2024-06-15",
        title: "Föreläsning på Domstolsakademin",
        description: "Öppet seminarieprogram visar medverkan i processledningspanel.",
        category: "Offentligt uppdrag",
        source: "Seminarieprogram",
        impact: "Första återkommande externa arrangören i grafen.",
        connectedEntities: ["Domstolsakademin", "Karin Sjöberg"]
      }
    ],
    verdicts: [
      { court: "Södertörns tingsrätt", description: "Domare i mål T 9876-25", date: "2025-03-01" }
    ],
    alerts: [
      {
        id: "bengt-alert-1",
        date: "2026-03-26",
        message: "Ny jävsanmälan matchar tidigare offentliga paneluppdrag.",
        severity: "critical",
        source: "Jävsanmälan",
        trigger: "Ny offentlig deklaration"
      },
      {
        id: "bengt-alert-2",
        date: "2026-02-04",
        message: "Föreläsningsarvode uppdaterat i samma ämnesområde som bevakade mål.",
        severity: "warning",
        source: "Arvodesredovisning",
        trigger: "Ny ersättningspost"
      }
    ],
    recordDigests: [
      {
        id: "bengt-digest-1",
        category: "Jäv",
        title: "Jävsanmälan i mål med expertvittne",
        date: "2026-03-26",
        source: "Södertörns tingsrätt",
        summary: "Anmälan knyter samman offentligt paneldeltagande och pågående mål."
      },
      {
        id: "bengt-digest-2",
        category: "Arvode",
        title: "Arvodesredovisning Domstolsakademin",
        date: "2026-02-04",
        source: "Offentlig ersättningsredovisning",
        summary: "Belopp, arrangör och ämnesområde kan länkas till tidigare paneluppdrag."
      }
    ],
    watchTarget: {
      targetId: "official-bengt-bergstrom",
      targetType: "official",
      targetName: "Bengt Bergström",
      recommendedCadence: "HOURLY",
      defaultChannels: ["email", "rss"],
      note: "Lämplig för den som vill fånga jävsanmälningar och nya domstolshandlingar utan att bevaka privata uppgifter."
    }
  },
  "3": {
    id: "3",
    fullName: "Carina Carlsson",
    title: "Kommunalråd",
    authorityName: "Stockholms stad",
    authoritySlug: "stockholms-stad",
    summary: "Knyter ihop politiska donationer, kommunala upphandlingar, publika beslut, bolagsavveckling och redovisade tjänsteresor i ett sammanhållet flöde.",
    income: 712000,
    assetFootprint: ["Stockholm, villa", "Tjänsteresor och representationskostnader"],
    companies: ["Stadskonsult AB (aktier avyttrade 2023)", "Norra Kajen Forum (ideell styrelsepost, avslutad)"],
    declaredAssociations: [
      "Offentligt redovisad donation till valkampanj från leverantörsnära nätverk.",
      "Jävsnotering inför beslut om stadsutvecklingskonsulter.",
      "Aktieförsäljning i Stadskonsult AB diarieförd inför nytt uppdrag."
    ],
    totalRecords: 824,
    monitoredSources: 6,
    networkSize: 6,
    openAlerts: 4,
    lastDailySyncAt: "2026-03-30T06:25:00Z",
    refreshPolicy: "Dagliga syncar av beslut, upphandlingar och donationer med realtidslarm för nya diarieförda bilagor.",
    coverage: [
      {
        id: "c1-coverage-procurement",
        label: "Kommunal upphandling",
        category: "Kontrakt och bilagor",
        records: 287,
        latestRecordAt: "2026-03-29",
        lastSyncedAt: "2026-03-30T06:25:00Z",
        cadence: "Dagligen + push vid ny bilaga",
        status: "ACTIVE",
        note: "Läser bilagor, direktupphandlingar och kontraktsförlängningar mot samma beslutslinje."
      },
      {
        id: "c1-coverage-donations",
        label: "Politiska donationer",
        category: "Finansiering",
        records: 34,
        latestRecordAt: "2026-03-11",
        lastSyncedAt: "2026-03-30T03:55:00Z",
        cadence: "Dagligen",
        status: "ACTIVE",
        note: "Kopplar offentliga donationsredovisningar till upphandlingar och beslutstidslinje."
      },
      {
        id: "c1-coverage-foi",
        label: "FOI-svar",
        category: "Begärda handlingar",
        records: 143,
        latestRecordAt: "2026-03-30",
        lastSyncedAt: "2026-03-30T06:05:00Z",
        cadence: "Dagligen",
        status: "ACTIVE",
        note: "Diarier, beslutsunderlag och kompletteringar länkas till samma upphandling eller donation."
      },
      {
        id: "c1-coverage-company",
        label: "Bolagsengagemang",
        category: "Bolag och avyttringar",
        records: 51,
        latestRecordAt: "2025-12-08",
        lastSyncedAt: "2026-03-29T22:10:00Z",
        cadence: "Dagligen",
        status: "ACTIVE",
        note: "Visar offentligt redovisade bolagsroller och aktieavyttringar med tidsstämplar."
      },
      {
        id: "c1-coverage-travel",
        label: "Tjänsteresor och representation",
        category: "Resekostnader",
        records: 27,
        latestRecordAt: "2026-03-07",
        lastSyncedAt: "2026-03-29T20:45:00Z",
        cadence: "Dagligen",
        status: "ACTIVE",
        note: "Fokuserar på redovisade kostnader, inte privat rörelsedata."
      },
      {
        id: "c1-coverage-land",
        label: "Fastighets- och exploateringsbeslut",
        category: "Beslut",
        records: 102,
        latestRecordAt: "2026-02-17",
        lastSyncedAt: "2026-03-28T19:30:00Z",
        cadence: "Veckovis pilot",
        status: "PILOT",
        note: "Kör exploateringsbeslut mot leverantörs- och donationsgrafen."
      }
    ],
    network: [
      {
        id: "carina-network-1",
        name: "Stadskonsult AB",
        category: "Bolag",
        relationship: "Tidigare ägarintresse",
        publicBasis: "Bolagsverket och avyttringsnotering",
        overlap: "Aktieavyttring diariefördes strax före nytt konsultbeslut i liknande sakområde.",
        recordCount: 14
      },
      {
        id: "carina-network-2",
        name: "Byggforum 2030",
        category: "Donatornätverk",
        relationship: "Offentligt redovisad valdonation från närliggande nätverk",
        publicBasis: "Donationsredovisning",
        overlap: "Donatorer förekommer även som företrädare för leverantörer i två upphandlingar.",
        recordCount: 10
      },
      {
        id: "carina-network-3",
        name: "Stockholms stad exploateringskontor",
        category: "Myndighetskoppling",
        relationship: "Återkommande beslutsflöde",
        publicBasis: "Diarier och beslut",
        overlap: "Samma handläggarkedja syns i upphandling, FOI-svar och fastighetsbeslut.",
        recordCount: 21
      },
      {
        id: "carina-network-4",
        name: "Kajen Konferenscenter",
        category: "Verksamhetsadress",
        relationship: "Gemensam publik affärsadress",
        publicBasis: "Offentligt registrerad adress",
        overlap: "Två leverantörer och en donatorförening använder samma kontorsadress.",
        recordCount: 8
      },
      {
        id: "carina-network-5",
        name: "Norra Kajen Forum",
        category: "Ideellt uppdrag",
        relationship: "Tidigare styrelsepost",
        publicBasis: "Öppet organisationsregister",
        overlap: "Forumet samarrangerade två evenemang med leverantörsnära aktörer.",
        recordCount: 7
      },
      {
        id: "carina-network-6",
        name: "Skyddad närståendemarkering",
        category: "Skyddad metadata",
        relationship: "Visas endast som offentlig jävsmarkering",
        publicBasis: "Jävsnotering",
        overlap: "Privata namn och hemadresser redovisas inte i produkten.",
        recordCount: 2
      }
    ],
    patternSignals: [
      {
        id: "carina-pattern-1",
        title: "Donationer och upphandlingar rör samma leverantörskrets",
        summary: "Offentligt redovisade donationer kan kopplas till företag som senare förekommer i kommunala bilagor.",
        status: "Bekräftad"
      },
      {
        id: "carina-pattern-2",
        title: "Aktieavyttring föregår nytt stadsutvecklingsbeslut",
        summary: "Tidslinjen visar att avyttring, jävsnotering och beslut ligger tätt inom samma kvartal.",
        status: "Framväxande"
      }
    ],
    timeline: [
      {
        id: "carina-event-1",
        date: "2026-03-30",
        title: "Nytt FOI-svar om upphandlingsbilagor",
        description: "Bilagor till stadsutvecklingskonsulter kompletterade med underleverantörslista.",
        category: "FOI-svar",
        source: "Stockholms stad",
        impact: "Ger ny korsning mellan donatornätverk och leverantörskedja.",
        connectedEntities: ["Byggforum 2030", "Kajen Konferenscenter"],
        highlight: true
      },
      {
        id: "carina-event-2",
        date: "2026-03-11",
        title: "Donationsredovisning uppdaterad",
        description: "Ny offentlig donationspost från nätverk med leverantörsnära representanter.",
        category: "Donation",
        source: "Partiredovisning",
        impact: "Skapar direkt larm i bevakningen eftersom upphandlingsärenden redan är aktiva.",
        connectedEntities: ["Byggforum 2030"],
        amount: "25 000 kr"
      },
      {
        id: "carina-event-3",
        date: "2026-03-07",
        title: "Representationskostnad diarieförd",
        description: "Kostnad för rundabordssamtal med externa leverantörer publicerad.",
        category: "Representation",
        source: "Kostnadsredovisning",
        impact: "Bekräftar mötesyta mellan beslutsfattare och leverantörskrets.",
        connectedEntities: ["Kajen Konferenscenter"],
        amount: "3 200 kr"
      },
      {
        id: "carina-event-4",
        date: "2025-10-22",
        title: "Jävsnotering inför konsultbeslut",
        description: "Jävsnotering diarieförd inför stadsutvecklingsbeslut.",
        category: "Jäv",
        source: "Diariepost",
        impact: "Markerar tydlig vändpunkt i beslutskedjan.",
        connectedEntities: ["Stadskonsult AB"]
      },
      {
        id: "carina-event-5",
        date: "2025-01-10",
        title: "Vald till kommunalråd",
        description: "Formellt tillträde med ansvar för stadsutvecklingsfrågor.",
        category: "Uppdrag",
        source: "Kommunfullmäktige",
        impact: "Startar bevakningens mandatperiod.",
        connectedEntities: ["Stockholms stad exploateringskontor"]
      },
      {
        id: "carina-event-6",
        date: "2023-09-01",
        title: "Aktier i Stadskonsult AB avyttrade",
        description: "Avyttring redovisad offentligt innan nytt kommunalt konsultspår öppnades.",
        category: "Bolag",
        source: "Bolagsverket",
        impact: "Ger central referenspunkt för senare jävs- och donationsmönster.",
        connectedEntities: ["Stadskonsult AB"]
      }
    ],
    verdicts: [],
    alerts: [
      {
        id: "carina-alert-1",
        date: "2026-03-30",
        message: "Nya FOI-bilagor kopplar underleverantörer till redan bevakade donationer.",
        severity: "critical",
        source: "FOI-svar",
        trigger: "Ny offentlig bilaga"
      },
      {
        id: "carina-alert-2",
        date: "2026-03-11",
        message: "Donationsredovisning uppdaterad för nätverk med leverantörskoppling.",
        severity: "warning",
        source: "Donationsredovisning",
        trigger: "Ny donationspost"
      },
      {
        id: "carina-alert-3",
        date: "2026-03-07",
        message: "Ny representationskostnad registrerad med samma mötesplats som flera leverantörer använder.",
        severity: "info",
        source: "Kostnadsredovisning",
        trigger: "Ny kostnadspost"
      },
      {
        id: "carina-alert-4",
        date: "2025-10-22",
        message: "Jävsnotering publicerad inför stadsutvecklingsbeslut.",
        severity: "warning",
        source: "Diariepost",
        trigger: "Ny jävsnotering"
      }
    ],
    recordDigests: [
      {
        id: "carina-digest-1",
        category: "FOI-svar",
        title: "Underleverantörslista för stadsutvecklingskonsulter",
        date: "2026-03-30",
        source: "Stockholms stad",
        summary: "Två aktörer i bilagan matchar tidigare donatornätverk och gemensam affärsadress."
      },
      {
        id: "carina-digest-2",
        category: "Donation",
        title: "Publik donationsredovisning mars 2026",
        date: "2026-03-11",
        source: "Partiredovisning",
        summary: "Ny post från nätverk som även förekommer i leverantörsledet."
      },
      {
        id: "carina-digest-3",
        category: "Bolag",
        title: "Avyttring av aktier i Stadskonsult AB",
        date: "2023-09-01",
        source: "Bolagsverket",
        summary: "Offentlig avyttring före senare kommunalt konsultbeslut i närliggande sakområde."
      }
    ],
    watchTarget: {
      targetId: "official-carina-carlsson",
      targetType: "official",
      targetName: "Carina Carlsson",
      recommendedCadence: "REALTIME",
      defaultChannels: ["email", "browser", "rss"],
      note: "Prioriterar nya bilagor, donationer och diarieförda jävsnoteringar kring stadsutvecklingsärenden."
    }
  }
};

export async function getMockIndividuals(): Promise<MockIndividual[]> {
  return Object.values(profileDirectory).map((profile) => ({
    id: profile.id,
    fullName: profile.fullName,
    title: profile.title,
    authorityName: profile.authorityName,
    summary: profile.summary,
    totalRecords: profile.totalRecords,
    monitoredSources: profile.monitoredSources,
    networkSize: profile.networkSize,
    openAlerts: profile.openAlerts,
    lastSyncAt: profile.lastDailySyncAt,
  }));
}

export async function getMockAuthorities(): Promise<MockAuthority[]> {
  return authorityDirectory;
}

export async function getMockIndividualProfile(id: string): Promise<MockIndividualProfile | null> {
  return profileDirectory[id] || null;
}

export async function getMockWatchdogSnapshot(): Promise<MockWatchdogSnapshot> {
  const profiles = Object.values(profileDirectory);

  return {
    totalTrackedRecords: profiles.reduce((sum, profile) => sum + profile.totalRecords, 0),
    officialsCovered: profiles.length,
    authoritiesCovered: authorityDirectory.length,
    dailySyncCoverage: "Daglig fullsync med push på nya offentliga handlingar och verifierade korsreferenser.",
    publicSourceFamilies: ["FOI-svar", "Domstolshandlingar", "Upphandling", "Donationer", "Bolagsroller", "Reseräkningar"],
    guardrails: [
      "Visar offentliga funktioner, affärsadresser och deklarerade jävsgrunder, inte privata hemadresser.",
      "Privata familjerelationer exponeras inte; endast offentligt deklarerade intressekonflikter markeras på metadata-nivå.",
      "Alertar endast på nya offentliga dokument, beslut eller verifierade korrelationer."
    ]
  };
}
