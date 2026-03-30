export type TaxOptimizationInput = {
  income: number;
  assets: number;
  notes?: string;
  locale?: string;
  countryCode?: string;
};

export type TaxOptimizationStrategy = {
  title: string;
  description: string;
  legal: boolean;
  legalBasis: string;
  estimatedImpactSek: number;
  priority: "high" | "medium" | "low";
};

export type TaxOptimizationResult = {
  summary: string;
  strategies: TaxOptimizationStrategy[];
  disclaimer: string;
  premium: boolean;
};

export type EvidenceManifest = {
  fileName: string;
  mimeType: string;
  byteSize: number;
  assetKind: "TEXT" | "IMAGE" | "DOCUMENT" | "VIDEO" | "AUDIO";
  extractedText?: string;
};

export type FailureTriageInput = {
  title: string;
  summary: string;
  countryCode?: string;
  locale?: string;
  evidence: EvidenceManifest[];
};

export type FailureTriageResult = {
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  priorityScore: number;
  summary: string;
  recommendedActions: string[];
};

export type PressReleaseDraftInput = {
  title: string;
  summary: string;
  severity: FailureTriageResult["severity"];
  locale?: string;
};

export type PressReleaseDraftResult = {
  headline: string;
  deck: string;
  bodyMarkdown: string;
};

export type ReverseSurveillanceInput = {
  title: string;
  summary: string;
  locale?: string;
  evidence: EvidenceManifest[];
};

export type ReverseSurveillanceResult = {
  redactionPolicy: string;
  riskSummary: string;
  sharePack: {
    pressHeadline: string;
    socialCaption: string;
    alertText: string;
  };
};

export type AutomatedAppealInput = {
  sourceTitle: string;
  sourceSummary: string;
  locale?: string;
  countryCode?: string;
};

export type AutomatedAppealArtifact = {
  kind: "APPEAL" | "COMPLAINT" | "DOCUMENT_REQUEST";
  title: string;
  subjectLine: string;
  body: string;
  suggestedAppealType: "jo" | "gdpr" | "info" | "klagomal";
};

export type AutomatedAppealResult = {
  parsedDecisionSummary: string;
  riskSummary: string;
  artifacts: AutomatedAppealArtifact[];
};

const defaultResult: TaxOptimizationResult = {
  summary: "Ingen AI-worker är konfigurerad ännu. Sätt AI_WORKER_URL och AI_WORKER_SHARED_SECRET för att aktivera legal-only analys.",
  strategies: [
    {
      title: "ROT- och RUT-avdrag",
      description: "Kontrollera om planerade hushålls- och renoveringskostnader kan fördelas för att nyttja tillgängliga avdrag fullt ut inom gällande regler.",
      legal: true,
      legalBasis: "Inkomstskattelagen och Skatteverkets vägledning om hushållsnära tjänster.",
      estimatedImpactSek: 5000,
      priority: "medium",
    },
    {
      title: "ISK kontra traditionell depå",
      description: "Jämför schablonbeskattning mot kapitalvinstbeskattning utifrån sparhorisont, omsättning och förväntad avkastning.",
      legal: true,
      legalBasis: "Reglerna för investeringssparkonto och kapitalbeskattning i Sverige.",
      estimatedImpactSek: 3500,
      priority: "medium",
    },
  ],
  disclaimer: "Endast dokumenterade lagliga strategier. Ingen rådgivning om skatteundandragande, falska avdrag eller dolda upplägg.",
  premium: true,
};

async function callWorker<TRequest, TResponse>(path: string, payload: TRequest, fallback: TResponse): Promise<TResponse> {
  const workerUrl = process.env.AI_WORKER_URL;
  const sharedSecret = process.env.AI_WORKER_SHARED_SECRET;

  if (!workerUrl || !sharedSecret) {
    return fallback;
  }

  const response = await fetch(`${workerUrl.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-worker-secret": sharedSecret,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AI-worker svarade med ${response.status}: ${body}`);
  }

  return (await response.json()) as TResponse;
}

export async function requestTaxOptimization(input: TaxOptimizationInput): Promise<TaxOptimizationResult> {
  return callWorker(
    "/v1/tax/optimize",
    {
      income: input.income,
      assets: input.assets,
      notes: input.notes || "",
      locale: input.locale || "sv-SE",
      country_code: input.countryCode || "SE",
    },
    defaultResult,
  );
}

export async function requestFailureTriage(input: FailureTriageInput): Promise<FailureTriageResult> {
  return callWorker(
    "/v1/watchdog/triage-case",
    {
      title: input.title,
      summary: input.summary,
      locale: input.locale || "sv-SE",
      country_code: input.countryCode || "SE",
      evidence: input.evidence,
    },
    {
      severity: "HIGH",
      priorityScore: 76,
      summary: "Underlaget tyder på ett potentiellt allvarligt myndighetsfel som bör gå vidare till moderation och juridisk genomgång innan publicering.",
      recommendedActions: [
        "Verifiera händelsedatum och källkedja.",
        "Begär in kompletterande diarienummer eller beslut om möjligt.",
        "Skicka ärendet till juridisk kontroll innan publicering.",
      ],
    },
  );
}

export async function requestPressReleaseDraft(input: PressReleaseDraftInput): Promise<PressReleaseDraftResult> {
  return callWorker(
    "/v1/watchdog/generate-press-release",
    {
      title: input.title,
      summary: input.summary,
      severity: input.severity,
      locale: input.locale || "sv-SE",
    },
    {
      headline: input.title,
      deck: "Förslag till pressutskick genererat för intern granskning innan eventuell publicering.",
      bodyMarkdown: `## Sammanfattning\n\n${input.summary}\n\n## Nästa steg\n\nDetta utkast kräver moderator- och juristgranskning innan extern distribution.`,
    },
  );
}

export async function requestReverseSurveillancePlan(input: ReverseSurveillanceInput): Promise<ReverseSurveillanceResult> {
  return callWorker(
    "/v1/watchdog/reverse-surveillance",
    {
      title: input.title,
      summary: input.summary,
      locale: input.locale || "sv-SE",
      evidence: input.evidence,
    },
    {
      redactionPolicy: "Bystanders and sensitive persons blurred by default. Public officials remain subject to legal review before any unmasking or publication.",
      riskSummary: "Videon bör behandlas som känsligt bevismaterial och kräver redaktionell kontroll innan delning eller publicering.",
      sharePack: {
        pressHeadline: input.title,
        socialCaption: "Nytt verifieringsärende inkommet. Publicering sker först efter moderation, juridisk granskning och skydd av tredje man.",
        alertText: "Ny videohändelse i bevakningskön. Kräver kontroll av redaktion och jurist.",
      },
    },
  );
}

export async function requestAutomatedAppealBundle(input: AutomatedAppealInput): Promise<AutomatedAppealResult> {
  return callWorker(
    "/v1/appeals/generate-bundle",
    {
      source_title: input.sourceTitle,
      source_summary: input.sourceSummary,
      locale: input.locale || "sv-SE",
      country_code: input.countryCode || "SE",
    },
    {
      parsedDecisionSummary: input.sourceSummary,
      riskSummary: "Beslutet tyder på ett överklagbart eller kompletteringskrävande ärende. AI-utkastet måste granskas innan inskick.",
      artifacts: [
        {
          kind: "APPEAL",
          title: `Överklagande av ${input.sourceTitle}`,
          subjectLine: `Överklagande: ${input.sourceTitle}`,
          body: `Jag överklagar beslutet ${input.sourceTitle}.\n\nBakgrund:\n${input.sourceSummary}\n\nJag begär omprövning, fullständig motivering och nytt skriftligt beslut.`,
          suggestedAppealType: "klagomal",
        },
        {
          kind: "DOCUMENT_REQUEST",
          title: `Begäran om handlingar för ${input.sourceTitle}`,
          subjectLine: `Begäran om allmän handling: ${input.sourceTitle}`,
          body: `Jag begär utlämning av samtliga relevanta handlingar, bilagor, interna tjänsteanteckningar och diarienoteringar som ligger till grund för beslutet ${input.sourceTitle}.`,
          suggestedAppealType: "info",
        },
      ],
    },
  );
}