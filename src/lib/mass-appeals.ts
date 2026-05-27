import {
  MassAppealBillingModel as PrismaMassAppealBillingModel,
  MassAppealType as PrismaMassAppealType,
  MassAppealUrgency as PrismaMassAppealUrgency,
  Prisma,
  type MassAppealBatch as PrismaMassAppealBatchRecord,
  type MassAppealDelivery as PrismaMassAppealDeliveryRecord,
  type MassAppealDocument as PrismaMassAppealDocumentRecord,
  type SubscriptionTier,
} from "@prisma/client";
import { deliverGeneratedDocument, getConfiguredDeliveryMode } from "@/lib/mass-appeals-transport";
import { getPrismaClient } from "@/lib/prisma";
import type {
  AppealType,
  AppealTypeDefinition,
  AuthorityDelivery,
  AuthorityTarget,
  BillingModel,
  GeneratedDocument,
  MassAppealBatch,
  MassAppealCatalog,
  MassAppealPayload,
  MassAppealPreview,
  PricingEstimate,
  UrgencyLevel,
} from "@/lib/mass-appeals-types";

const appealTypeDefinitions: AppealTypeDefinition[] = [
  {
    id: "jo",
    label: "JO-anmälan",
    summary: "Anmäl brister i myndighetsutövning till Justitieombudsmannen och relevanta registratorer.",
    defaultRequestedAction: "Jag begär att ärendet diarieförs, granskas och att jag får besked om nästa handläggningssteg.",
    defaultLegalBasis: "JO:s tillsynsuppdrag enligt regeringsformen och kompletterande svensk förvaltningsrätt.",
    defaultSubjectPrefix: "JO-anmälan",
  },
  {
    id: "gdpr",
    label: "Registerkrav",
    summary: "Kräv utdrag, rättelser eller tydliga besked från myndigheter som samlar på sig uppgifter och svarar långsamt.",
    defaultRequestedAction: "Jag kräver ett fullständigt utdrag, rättelse eller tydligt besked om hur mina uppgifter används och när jag får svar.",
    defaultLegalBasis: "Dataskyddsregler, offentlighetsprincip och myndighetens skyldighet att svara skriftligt.",
    defaultSubjectPrefix: "Registerkrav",
  },
  {
    id: "info",
    label: "Informationsbegäran",
    summary: "Skicka en begäran om allmän handling eller kompletterande information till flera registratorer samtidigt.",
    defaultRequestedAction: "Jag begär skyndsam utlämning av allmän handling eller besked om sekretessprövning.",
    defaultLegalBasis: "2 kap. tryckfrihetsförordningen och myndighetens serviceskyldighet.",
    defaultSubjectPrefix: "Begäran om allmän handling",
  },
  {
    id: "klagomal",
    label: "Formellt klagomål",
    summary: "Samla ett klagomål till berörd myndighet, tillsynsaktör och kompletterande instanser.",
    defaultRequestedAction: "Jag begär en skriftlig återkoppling, intern utredning och tydligt besked om ansvarig handläggare.",
    defaultLegalBasis: "Förvaltningslagen, serviceskyldigheten och myndighetens egna klagomålsrutiner.",
    defaultSubjectPrefix: "Formellt klagomål",
  },
];

const authorityTargets: AuthorityTarget[] = [
  {
    id: "jo",
    name: "Justitieombudsmannen",
    category: "oversight",
    region: "Nationell",
    channel: "E-postgateway",
    endpoint: "registrator@jo.se",
    estimatedResponseDays: 30,
    supportedAppealTypes: ["jo", "klagomal"],
  },
  {
    id: "imy",
    name: "Integritetsskyddsmyndigheten",
    category: "privacy",
    region: "Nationell",
    channel: "E-postgateway",
    endpoint: "imy@imy.se",
    estimatedResponseDays: 30,
    supportedAppealTypes: ["gdpr"],
  },
  {
    id: "stockholm-registrator",
    name: "Stockholms stad, registrator",
    category: "registrator",
    region: "Stockholm",
    channel: "Registrator",
    endpoint: "registrator@stockholm.se",
    estimatedResponseDays: 5,
    supportedAppealTypes: ["info", "klagomal", "jo", "gdpr"],
  },
  {
    id: "lansstyrelsen-stockholm",
    name: "Länsstyrelsen Stockholm, registrator",
    category: "supervisory",
    region: "Stockholm",
    channel: "Registrator",
    endpoint: "stockholm@lansstyrelsen.se",
    estimatedResponseDays: 7,
    supportedAppealTypes: ["info", "klagomal", "jo"],
  },
  {
    id: "polisen-dso",
    name: "Polismyndigheten, dataskyddsombud",
    category: "privacy",
    region: "Nationell",
    channel: "Säker brevlåda",
    endpoint: "dso.polisen@polisen.se",
    estimatedResponseDays: 21,
    supportedAppealTypes: ["gdpr"],
  },
  {
    id: "polisen-registrator",
    name: "Polismyndigheten, registrator",
    category: "registrator",
    region: "Nationell",
    channel: "Registrator",
    endpoint: "registrator.kansli@polisen.se",
    estimatedResponseDays: 7,
    supportedAppealTypes: ["info", "klagomal", "jo"],
  },
  {
    id: "sodertorn-registrator",
    name: "Södertörns tingsrätt, registrator",
    category: "registrator",
    region: "Stockholm",
    channel: "Registrator",
    endpoint: "sodertorns.tingsratt@dom.se",
    estimatedResponseDays: 5,
    supportedAppealTypes: ["info", "klagomal"],
  },
  {
    id: "vg-region-registrator",
    name: "Region Västra Götaland, registrator",
    category: "registrator",
    region: "Västra Götaland",
    channel: "Registrator",
    endpoint: "regionstyrelsen@vgregion.se",
    estimatedResponseDays: 7,
    supportedAppealTypes: ["info", "klagomal", "gdpr"],
  },
  {
    id: "skane-region-registrator",
    name: "Region Skåne, registrator",
    category: "registrator",
    region: "Skåne",
    channel: "Registrator",
    endpoint: "region@skane.se",
    estimatedResponseDays: 7,
    supportedAppealTypes: ["info", "klagomal", "gdpr"],
  },
  {
    id: "skolinspektionen",
    name: "Skolinspektionen",
    category: "supervisory",
    region: "Nationell",
    channel: "E-postgateway",
    endpoint: "registrator@skolinspektionen.se",
    estimatedResponseDays: 14,
    supportedAppealTypes: ["klagomal", "info"],
  },
];

const regions = ["Nationell", "Stockholm", "Västra Götaland", "Skåne"];

const billingModels: MassAppealCatalog["billingModels"] = [
  {
    id: "payg",
    label: "Pay-per-use",
    summary: "Från 39 kr per körning och därefter per mottagare. Passar engångsärenden och snabba kampanjer.",
  },
  {
    id: "subscription",
    label: "Abonnemang",
    summary: "Ingår i Pro/Civic Lab med högre tempo för återkommande kampanjer och batcher.",
  },
];

const antiAbuseSummary = [
  "Tempotak i denna MVP: högst 2 skarpa utskick per 15 minuter och högst 6 mottagare per batch.",
  "Länktunga eller uppenbart massproducerade texter fångas upp för extra kontroll innan de går ut.",
  "Varje utskick märks med användare, mottagare, leveranssätt, tidpunkt och spårningskod så att du ser hur trycket rör sig.",
];

const previewWindowMs = 15 * 60 * 1000;
const previewLimit = 8;
const sendWindowMs = 15 * 60 * 1000;
const sendLimit = 2;
const maxRecipientsPerBatch = 6;
const suspiciousUrlLimit = 4;

type RateBucket = {
  previewTimestamps: number[];
  sendTimestamps: number[];
};

type MassAppealsStore = {
  rateBuckets: Map<string, RateBucket>;
};

export type MassAppealActorContext = {
  actorKey: string;
  ipAddress?: string | null;
  user?: {
    id: string;
    email: string;
    subscriptionTier: SubscriptionTier;
  } | null;
};

type PersistedBatchRecord = PrismaMassAppealBatchRecord & {
  deliveries: PrismaMassAppealDeliveryRecord[];
  documents: PrismaMassAppealDocumentRecord[];
};

class MassAppealError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "MassAppealError";
    this.status = status;
  }
}

declare global {
  var __spegelnMassAppealsStore: MassAppealsStore | undefined;
}

function getStore(): MassAppealsStore {
  if (!globalThis.__spegelnMassAppealsStore) {
    globalThis.__spegelnMassAppealsStore = {
      rateBuckets: new Map<string, RateBucket>(),
    };
  }

  return globalThis.__spegelnMassAppealsStore;
}

function getAppealTypeDefinition(appealType: AppealType) {
  const definition = appealTypeDefinitions.find((item) => item.id === appealType);
  if (!definition) {
    throw new MassAppealError("Okänd ärendetyp.");
  }
  return definition;
}

function getRateBucket(actorKey: string) {
  const store = getStore();
  const existing = store.rateBuckets.get(actorKey);
  if (existing) {
    return existing;
  }

  const created: RateBucket = { previewTimestamps: [], sendTimestamps: [] };
  store.rateBuckets.set(actorKey, created);
  return created;
}

function pruneTimestamps(timestamps: number[], windowMs: number, now: number) {
  return timestamps.filter((value) => value > now - windowMs);
}

function registerRateEvent(kind: "preview" | "send", actorKey: string) {
  const bucket = getRateBucket(actorKey);
  const now = Date.now();

  bucket.previewTimestamps = pruneTimestamps(bucket.previewTimestamps, previewWindowMs, now);
  bucket.sendTimestamps = pruneTimestamps(bucket.sendTimestamps, sendWindowMs, now);

  if (kind === "preview") {
    if (bucket.previewTimestamps.length >= previewLimit) {
      throw new MassAppealError("För många förhandsgranskningar på kort tid. Vänta en stund innan du provar igen.", 429);
    }
    bucket.previewTimestamps.push(now);
    return;
  }

  if (bucket.sendTimestamps.length >= sendLimit) {
    throw new MassAppealError("Skicka-funktionen är tillfälligt låst för att begränsa missbruk. Försök igen om cirka 15 minuter.", 429);
  }

  bucket.sendTimestamps.push(now);
}

function sanitizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .slice(0, maxLength);
}

function sanitizeArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isAppealType(value: string): value is AppealType {
  return appealTypeDefinitions.some((item) => item.id === value);
}

function isBillingModel(value: string): value is BillingModel {
  return billingModels.some((item) => item.id === value);
}

function countUrls(text: string) {
  const matches = text.match(/https?:\/\//g);
  return matches ? matches.length : 0;
}

function parsePayload(raw: unknown): MassAppealPayload {
  if (!raw || typeof raw !== "object") {
    throw new MassAppealError("Ogiltig payload.");
  }

  const candidate = raw as Record<string, unknown>;
  const appealType = sanitizeText(candidate.appealType, 24);
  const billingModel = sanitizeText(candidate.billingModel, 24);
  const urgency = sanitizeText(candidate.urgency, 24);
  const senderEmail = sanitizeText(candidate.senderEmail, 120).toLowerCase();
  const subject = sanitizeText(candidate.subject, 160);
  const incidentSummary = sanitizeText(candidate.incidentSummary, 1600);
  const requestedAction = sanitizeText(candidate.requestedAction, 800);
  const legalBasis = sanitizeText(candidate.legalBasis, 400);

  if (!isAppealType(appealType)) {
    throw new MassAppealError("Välj en giltig typ av begäran.");
  }

  if (!isBillingModel(billingModel)) {
    throw new MassAppealError("Välj en giltig betalmodell.");
  }

  if (urgency !== "standard" && urgency !== "urgent") {
    throw new MassAppealError("Välj en giltig prioritet.");
  }

  if (!senderEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    throw new MassAppealError("Ange en giltig e-postadress för återkoppling.");
  }

  if (!subject || !incidentSummary || !requestedAction) {
    throw new MassAppealError("Ämne, sammanfattning och önskad åtgärd måste fyllas i.");
  }

  if (countUrls(`${subject}\n${incidentSummary}\n${requestedAction}`) > suspiciousUrlLimit) {
    throw new MassAppealError("För många externa länkar i samma utskick. Kortare och mer specifika underlag krävs.", 422);
  }

  return {
    appealType,
    senderName: sanitizeText(candidate.senderName, 120),
    senderEmail,
    senderRole: sanitizeText(candidate.senderRole, 120),
    region: regions.includes(sanitizeText(candidate.region, 40)) ? sanitizeText(candidate.region, 40) : "Nationell",
    subject,
    caseReference: sanitizeText(candidate.caseReference, 80),
    incidentSummary,
    requestedAction,
    legalBasis: legalBasis || getAppealTypeDefinition(appealType).defaultLegalBasis,
    selectedAuthorityIds: sanitizeArray(candidate.selectedAuthorityIds),
    billingModel,
    urgency,
  };
}

function scoreAuthority(authority: AuthorityTarget, payload: MassAppealPayload) {
  let score = 0;

  if (payload.selectedAuthorityIds.includes(authority.id)) {
    score += 100;
  }

  if (authority.supportedAppealTypes.includes(payload.appealType)) {
    score += 30;
  }

  if (authority.region === payload.region) {
    score += 20;
  }

  if (authority.region === "Nationell") {
    score += 12;
  }

  if (payload.appealType === "gdpr" && authority.category === "privacy") {
    score += 25;
  }

  if (payload.appealType === "info" && authority.category === "registrator") {
    score += 18;
  }

  if (payload.appealType === "jo" && authority.category === "oversight") {
    score += 18;
  }

  if (payload.appealType === "klagomal" && authority.category === "supervisory") {
    score += 14;
  }

  return score;
}

function resolveRecipients(payload: MassAppealPayload) {
  const supported = authorityTargets
    .filter((authority) => authority.supportedAppealTypes.includes(payload.appealType))
    .map((authority) => ({ authority, score: scoreAuthority(authority, payload) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((item) => item.authority);

  const picked = payload.selectedAuthorityIds.length
    ? supported.filter((authority) => payload.selectedAuthorityIds.includes(authority.id))
    : supported.slice(0, 3);

  if (!picked.length) {
    throw new MassAppealError("Inga relevanta mottagare hittades för den valda kombinationen.");
  }

  if (picked.length > maxRecipientsPerBatch) {
    throw new MassAppealError(`Högst ${maxRecipientsPerBatch} mottagare får ingå i samma batch.`, 422);
  }

  return picked;
}

function estimatePricing(payload: MassAppealPayload, recipientCount: number): PricingEstimate {
  if (payload.billingModel === "subscription") {
    return {
      billingModel: payload.billingModel,
      amountSek: 0,
      label: "Ingår i abonnemang",
      summary: `Batchen använder ${recipientCount} mottagare och debiteras inte separat på Pro eller Civic Lab.`,
    };
  }

  const amountSek = 39 + Math.max(0, recipientCount - 1) * 14;

  return {
    billingModel: payload.billingModel,
    amountSek,
    label: `${amountSek} kr`,
    summary: "Pay-per-use: 39 kr startavgift och 14 kr per extra mottagare i batchen.",
  };
}

function buildDocumentBody(payload: MassAppealPayload, authority: AuthorityTarget) {
  const appeal = getAppealTypeDefinition(payload.appealType);
  const senderLine = payload.senderName
    ? `${payload.senderName}${payload.senderRole ? `, ${payload.senderRole}` : ""}`
    : payload.senderEmail;
  const urgencyLine = payload.urgency === "urgent" ? "Prioritet: skyndsam hantering begärs." : "Prioritet: ordinarie handläggning.";

  const introByType: Record<AppealType, string> = {
    jo: "Jag vill anmäla brister i myndighetsutövning och begär att ärendet registreras för tillsyn eller vidare prövning.",
    gdpr: "Jag kräver ett tydligt utdrag över vilka uppgifter ni håller, hur de används och när jag får skriftligt svar.",
    info: "Jag begär utlämning av allmän handling eller tydligt besked om eventuell sekretessprövning.",
    klagomal: "Jag vill lämna ett formellt klagomål och begär en dokumenterad återkoppling från ansvarig funktion.",
  };

  return [
    `Till ${authority.name}`,
    "",
    `${appeal.defaultSubjectPrefix}: ${payload.subject}`,
    "",
    introByType[payload.appealType],
    urgencyLine,
    payload.caseReference ? `Referens: ${payload.caseReference}` : undefined,
    "",
    "Bakgrund",
    payload.incidentSummary,
    "",
    "Begärd åtgärd",
    payload.requestedAction,
    "",
    "Rättslig grund eller stöd",
    payload.legalBasis,
    "",
    "Avsändare",
    senderLine,
    payload.senderEmail,
    "",
    "Jag begär bekräftelse på mottagande, diarienummer där det är tillämpligt och besked om nästa steg.",
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

function buildDocuments(payload: MassAppealPayload, recipients: AuthorityTarget[]) {
  return recipients.map((authority, index): GeneratedDocument => ({
    id: `${payload.appealType}-${authority.id}-${index + 1}`,
    recipientId: authority.id,
    recipientName: authority.name,
    title: `${getAppealTypeDefinition(payload.appealType).label} till ${authority.name}`,
    subjectLine: `${getAppealTypeDefinition(payload.appealType).defaultSubjectPrefix}: ${payload.subject}`,
    channel: authority.channel,
    body: buildDocumentBody(payload, authority),
    estimatedFeeSek: payload.billingModel === "payg" ? (index === 0 ? 39 : 14) : 0,
  }));
}

function buildRecipientStatuses(recipients: AuthorityTarget[], payload: MassAppealPayload, pricing: PricingEstimate): AuthorityDelivery[] {
  return recipients.map((authority, index) => {
    const requiresManualReview = payload.incidentSummary.length > 1200 || countUrls(payload.incidentSummary) > 2;

    return {
      authorityId: authority.id,
      authorityName: authority.name,
      channel: authority.channel,
      endpoint: authority.endpoint,
      status: requiresManualReview ? "manual_review" : "queued",
      trackingCode: `BB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      estimatedResponseDays: authority.estimatedResponseDays,
      feeSek: pricing.billingModel === "payg" ? (index === 0 ? 39 : 14) : 0,
      notes: requiresManualReview
        ? ["Fångad för extra kontroll eftersom underlaget är ovanligt långt eller länktungt."]
        : ["Mottagaren placerades i kö utifrån vald ärendetyp och region."],
      updatedAt: new Date().toISOString(),
    };
  });
}

function buildGuardrails(payload: MassAppealPayload, recipients: AuthorityTarget[]) {
  const warnings = [
    "Massutskick är till för tydligt tryck uppåt mot myndigheter och registratorer, inte för att skjuta brett i blindo.",
    "Automatiska batcher märks med spårningskod, tidpunkt och mottagare så att du kan följa vad som faktiskt gått ut.",
  ];

  if (payload.appealType === "gdpr") {
    warnings.push("Registerkrav fungerar bäst när du pekar ut vilket konto, ärende eller dataspår du vill tvinga fram.");
  }

  if (payload.appealType === "info") {
    warnings.push("Informationsbegäran vinner på precision; om de mörkar får du följa upp med nytt tryck eller överklagande.");
  }

  if (payload.billingModel === "subscription") {
    warnings.push("Abonnemangsutskick kräver inloggat Pro- eller Civic Lab-konto för högre tempo och full historik.");
  }

  if (recipients.length >= 4) {
    warnings.push("Stora batcher sprider kraften. Färre mottagare ger oftare tydligare träff.");
  }

  return warnings;
}

function buildPreviewInternal(payload: MassAppealPayload, actorKey: string, countTowardsPreviewQuota: boolean): MassAppealPreview {
  if (countTowardsPreviewQuota) {
    registerRateEvent("preview", actorKey);
  }

  const recipients = resolveRecipients(payload);
  const pricing = estimatePricing(payload, recipients.length);
  const documents = buildDocuments(payload, recipients);
  const recipientStatuses = buildRecipientStatuses(recipients, payload, pricing);
  const guardrails = buildGuardrails(payload, recipients);
  const bucket = getRateBucket(actorKey);

  return {
    createdAt: new Date().toISOString(),
    appealType: payload.appealType,
    appealLabel: getAppealTypeDefinition(payload.appealType).label,
    recipients: recipientStatuses,
    documents,
    pricing,
    guardrails,
    remainingQuota: {
      previews: Math.max(0, previewLimit - bucket.previewTimestamps.length),
      sends: Math.max(0, sendLimit - bucket.sendTimestamps.length),
      maxRecipientsPerBatch,
    },
  };
}

function ensureSubscriptionAccess(payload: MassAppealPayload, actor: MassAppealActorContext) {
  if (payload.billingModel !== "subscription") {
    return;
  }

  if (!actor.user || !["PRO", "CIVIC_LAB"].includes(actor.user.subscriptionTier)) {
    throw new MassAppealError("Abonnemangsutskick kräver att du är inloggad med Pro eller Civic Lab.", 403);
  }
}

function toPrismaAppealType(value: AppealType) {
  switch (value) {
    case "jo":
      return PrismaMassAppealType.JO;
    case "gdpr":
      return PrismaMassAppealType.GDPR;
    case "info":
      return PrismaMassAppealType.INFO;
    case "klagomal":
      return PrismaMassAppealType.KLAGOMAL;
  }
}

function fromPrismaAppealType(value: PrismaMassAppealType): AppealType {
  switch (value) {
    case PrismaMassAppealType.JO:
      return "jo";
    case PrismaMassAppealType.GDPR:
      return "gdpr";
    case PrismaMassAppealType.INFO:
      return "info";
    case PrismaMassAppealType.KLAGOMAL:
      return "klagomal";
  }
}

function toPrismaBillingModel(value: BillingModel) {
  return value === "subscription" ? PrismaMassAppealBillingModel.SUBSCRIPTION : PrismaMassAppealBillingModel.PAYG;
}

function fromPrismaBillingModel(value: PrismaMassAppealBillingModel): BillingModel {
  return value === PrismaMassAppealBillingModel.SUBSCRIPTION ? "subscription" : "payg";
}

function toPrismaUrgency(value: UrgencyLevel) {
  return value === "urgent" ? PrismaMassAppealUrgency.URGENT : PrismaMassAppealUrgency.STANDARD;
}

function getUsageWindow(now: Date) {
  return {
    periodStart: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
    periodEnd: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
  };
}

function readStringArray(value: Prisma.JsonValue) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function buildPricingFromPersisted(record: PersistedBatchRecord): PricingEstimate {
  const billingModel = fromPrismaBillingModel(record.billingModel);

  return {
    billingModel,
    amountSek: record.priceSek,
    label: record.billingLabel,
    summary:
      billingModel === "subscription"
        ? `Batchen använder ${record.deliveries.length} mottagare och debiteras inte separat på Pro eller Civic Lab.`
        : "Pay-per-use: 39 kr startavgift och 14 kr per extra mottagare i batchen.",
  };
}

function mapPersistedBatch(record: PersistedBatchRecord): MassAppealBatch {
  const appealType = fromPrismaAppealType(record.appealType);

  return {
    id: record.id,
    createdAt: record.createdAt.toISOString(),
    appealType,
    appealLabel: getAppealTypeDefinition(appealType).label,
    region: record.region,
    subject: record.subject,
    senderEmail: record.senderEmail,
    billingModel: fromPrismaBillingModel(record.billingModel),
    pricing: buildPricingFromPersisted(record),
    deliveryMode: record.deliveryMode,
    recipients: record.deliveries.map((delivery) => ({
      authorityId: delivery.authorityExternalId,
      authorityName: delivery.authorityName,
      channel: delivery.channel as AuthorityTarget["channel"],
      endpoint: delivery.endpoint,
      status: delivery.status as AuthorityDelivery["status"],
      trackingCode: delivery.trackingCode,
      estimatedResponseDays: delivery.estimatedResponseDays,
      feeSek: delivery.feeSek,
      notes: readStringArray(delivery.notes),
      transport: delivery.transport,
      providerMessageId: delivery.providerMessageId || undefined,
      deliveredAt: delivery.deliveredAt?.toISOString(),
      updatedAt: delivery.updatedAt.toISOString(),
    })),
    documents: record.documents.map((document) => ({
      id: document.id,
      recipientId: document.recipientId,
      recipientName: document.recipientName,
      title: document.title,
      subjectLine: document.subjectLine,
      channel: document.channel as AuthorityTarget["channel"],
      body: document.body,
      estimatedFeeSek: document.estimatedFeeSek,
    })),
    guardrails: readStringArray(record.guardrails),
  };
}

async function resolveBatchUserId(senderEmail: string, actor: MassAppealActorContext) {
  if (actor.user?.id) {
    return actor.user.id;
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: senderEmail },
    select: { id: true },
  });

  return user?.id ?? null;
}

async function persistBatch(batch: MassAppealBatch, payload: MassAppealPayload, actor: MassAppealActorContext) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new MassAppealError("Databaspersistens krävs för att skicka och spåra batcher.", 503);
  }

  const now = new Date();
  const userId = await resolveBatchUserId(payload.senderEmail, actor);
  const { periodStart, periodEnd } = getUsageWindow(now);

  const created = await prisma.$transaction(async (transaction) => {
    const createdBatch = await transaction.massAppealBatch.create({
      data: {
        userId,
        senderName: payload.senderName || null,
        senderEmail: payload.senderEmail,
        senderRole: payload.senderRole || null,
        appealType: toPrismaAppealType(payload.appealType),
        region: payload.region,
        subject: payload.subject,
        caseReference: payload.caseReference || null,
        urgency: toPrismaUrgency(payload.urgency),
        billingModel: toPrismaBillingModel(payload.billingModel),
        priceSek: batch.pricing.amountSek,
        billingLabel: batch.pricing.label,
        deliveryMode: batch.deliveryMode,
        guardrails: batch.guardrails,
        requestPayload: payload as Prisma.InputJsonValue,
        documents: {
          create: batch.documents.map((document) => ({
            recipientId: document.recipientId,
            recipientName: document.recipientName,
            title: document.title,
            subjectLine: document.subjectLine,
            channel: document.channel,
            body: document.body,
            estimatedFeeSek: document.estimatedFeeSek,
          })),
        },
        deliveries: {
          create: batch.recipients.map((recipient) => ({
            authorityExternalId: recipient.authorityId,
            authorityName: recipient.authorityName,
            channel: recipient.channel,
            endpoint: recipient.endpoint,
            status: recipient.status,
            trackingCode: recipient.trackingCode,
            estimatedResponseDays: recipient.estimatedResponseDays,
            feeSek: recipient.feeSek,
            notes: recipient.notes,
            transport: recipient.transport || "manual_review",
            providerMessageId: recipient.providerMessageId || null,
            deliveredAt: recipient.deliveredAt ? new Date(recipient.deliveredAt) : null,
          })),
        },
      },
      include: {
        deliveries: true,
        documents: true,
      },
    });

    if (userId) {
      await transaction.usageRecord.create({
        data: {
          userId,
          featureKey: "mass_appeal_batch",
          units: Math.max(1, batch.recipients.length),
          billable: payload.billingModel === "payg",
          unitPriceSek: payload.billingModel === "payg" ? Math.round(batch.pricing.amountSek / Math.max(1, batch.recipients.length)) : 0,
          totalPriceSek: batch.pricing.amountSek,
          metadata: {
            appealType: payload.appealType,
            recipientCount: batch.recipients.length,
            deliveryMode: batch.deliveryMode,
          },
          massAppealBatchId: createdBatch.id,
          periodStart,
          periodEnd,
        },
      });

      await transaction.auditEvent.create({
        data: {
          userId,
          actorLabel: actor.user?.email || payload.senderEmail,
          action: "MASS_APPEAL_SENT",
          targetType: "MassAppealBatch",
          targetId: createdBatch.id,
          ipAddress: actor.ipAddress || null,
          metadata: {
            appealType: payload.appealType,
            recipientCount: batch.recipients.length,
            billingModel: payload.billingModel,
          },
        },
      });
    }

    return createdBatch;
  });

  return mapPersistedBatch(created);
}

async function deliverBatch(preview: MassAppealPreview, payload: MassAppealPayload) {
  return Promise.all(
    preview.recipients.map(async (recipient) => {
      const document = preview.documents.find((candidate) => candidate.recipientId === recipient.authorityId);
      if (!document) {
        return {
          ...recipient,
          status: "failed",
          transport: "mapping_error",
          notes: [...recipient.notes, "Dokument kunde inte kopplas till mottagaren."],
          updatedAt: new Date().toISOString(),
        } satisfies AuthorityDelivery;
      }

      const delivery = await deliverGeneratedDocument({
        document,
        recipient,
        senderEmail: payload.senderEmail,
        senderName: payload.senderName,
      });

      return {
        ...recipient,
        status: delivery.status,
        transport: delivery.transport,
        providerMessageId: delivery.providerMessageId,
        deliveredAt: delivery.deliveredAt,
        notes: [...recipient.notes, ...delivery.notes],
        updatedAt: new Date().toISOString(),
      } satisfies AuthorityDelivery;
    }),
  );
}

export function getMassAppealCatalog(): MassAppealCatalog {
  return {
    appealTypes: appealTypeDefinitions,
    authorities: authorityTargets,
    regions,
    billingModels,
    antiAbuseSummary,
  };
}

export async function getMassAppealCatalogAsync(): Promise<MassAppealCatalog> {
  const base = getMassAppealCatalog();
  const prisma = getPrismaClient();

  if (!prisma) {
    return base;
  }

  const authorities = await prisma.authority.findMany({
    orderBy: { updatedAt: "desc" },
    take: 40,
  });

  const merged = [...base.authorities];
  const existingIds = new Set(merged.map((item) => item.id));

  for (const authority of authorities) {
    if (existingIds.has(authority.id) || existingIds.has(authority.slug)) {
      continue;
    }

    merged.push({
      id: authority.id,
      name: authority.name,
      category: "registrator" as const,
      region: authority.region || "Nationell",
      channel: "E-postgateway",
      endpoint: `registrator@${authority.slug.replace(/-/g, "")}.se`,
      estimatedResponseDays: 30,
      supportedAppealTypes: ["info", "klagomal", "gdpr"],
    });
  }

  return {
    ...base,
    authorities: merged,
  };
}

export function previewMassAppeal(raw: unknown, actorKey: string) {
  const payload = parsePayload(raw);
  return buildPreviewInternal(payload, actorKey, true);
}

export async function sendMassAppeal(raw: unknown, actor: MassAppealActorContext) {
  const payload = parsePayload(raw);
  ensureSubscriptionAccess(payload, actor);
  registerRateEvent("send", actor.actorKey);

  const preview = buildPreviewInternal(payload, actor.actorKey, false);
  const deliveredRecipients = await deliverBatch(preview, payload);
  const batch: MassAppealBatch = {
    id: `batch_${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    appealType: payload.appealType,
    appealLabel: preview.appealLabel,
    region: payload.region,
    subject: payload.subject,
    senderEmail: payload.senderEmail,
    billingModel: payload.billingModel,
    pricing: preview.pricing,
    deliveryMode: getConfiguredDeliveryMode(),
    recipients: deliveredRecipients,
    documents: preview.documents,
    guardrails: preview.guardrails,
  };

  return persistBatch(batch, payload, actor);
}

export async function listRecentMassAppealBatches(options?: { limit?: number; senderEmail?: string; userId?: string }) {
  const limit = options?.limit ?? 6;
  const prisma = getPrismaClient();

  if (!prisma) {
    return [];
  }

  if (!options?.userId && !options?.senderEmail) {
    return [];
  }

  const records = await prisma.massAppealBatch.findMany({
    where: options.userId
      ? { userId: options.userId }
      : { senderEmail: options?.senderEmail?.toLowerCase() },
    include: {
      deliveries: true,
      documents: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  return records.map((record) => mapPersistedBatch(record));
}

export function toApiError(error: unknown) {
  if (error instanceof MassAppealError) {
    return {
      message: error.message,
      status: error.status,
    };
  }

  return {
    message: "Något gick fel i byråkrati-flödet.",
    status: 500,
  };
}