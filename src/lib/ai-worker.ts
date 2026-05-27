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
  storageKey?: string;
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
    redactionMarkers?: Array<{ label: string; timestamp?: string }>;
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

export type WorkerHealthResult = {
  status: "ok";
  service: string;
  provider: "model_backed" | "rules_based";
  model: string | null;
  supportedJobs: string[];
};

export type WorkerTextInput = {
  text: string;
  locale?: string;
  countryCode?: string;
};

export type DocumentClassificationResult = {
  labels: string[];
  confidence: number;
};

export type EntityExtractionResult = {
  organizations: string[];
  dates: string[];
  caseNumbers: string[];
  emails: string[];
};

export type TextSummaryResult = {
  summary: string;
  sentencesUsed: number;
  keyPoints: string[];
};

export type TextEmbeddingResult = {
  embedding: number[];
  dimensions: number;
};

export type AnomalyDetectionInput = {
  values: number[];
  baselineLabel?: string;
};

export type AnomalyDetectionResult = {
  baselineLabel: string;
  anomalies: Array<{
    index: number;
    value: number;
    zScore: number;
  }>;
  mean: number;
  stddev: number;
};

type RawWorkerHealthResult = {
  status?: string;
  service?: string;
  provider?: string;
  model?: string | null;
  supportedJobs?: string[];
};

type RawEntityExtractionResult = {
  organizations?: string[];
  dates?: string[];
  case_numbers?: string[];
  emails?: string[];
};

type RawTextSummaryResult = {
  summary?: string;
  sentences_used?: number;
  key_points?: string[];
};

type RawAnomalyDetectionResult = {
  baseline_label?: string;
  anomalies?: Array<{
    index?: number;
    value?: number;
    z_score?: number;
  }>;
  mean?: number;
  stddev?: number;
};

const supportedJobs = [
  "tax.optimize",
  "watchdog.triage_case",
  "watchdog.generate_press_release",
  "watchdog.reverse_surveillance",
  "appeals.generate_bundle",
  "nlp.classify_document",
  "nlp.extract_entities",
  "nlp.summarize",
  "nlp.embed",
  "nlp.detect_anomalies",
] as const;

function getWorkerBridgeConfig() {
  return {
    workerUrl: process.env.AI_WORKER_URL?.replace(/\/$/, ""),
    sharedSecret: process.env.AI_WORKER_SHARED_SECRET,
  };
}

function getRequiredWorkerBridgeConfig() {
  const { workerUrl, sharedSecret } = getWorkerBridgeConfig();

  if (!workerUrl) {
    throw new Error("AI_WORKER_URL saknas. AI-funktionerna kräver en konfigurerad worker.");
  }

  if (!sharedSecret) {
    throw new Error("AI_WORKER_SHARED_SECRET saknas. AI-funktionerna kräver en signerad worker-anslutning.");
  }

  return { workerUrl, sharedSecret };
}

function dedupeStrings(values: string[] | undefined) {
  return Array.from(new Set((values || []).map((value) => value.trim()).filter(Boolean)));
}

function normalizeWorkerHealth(payload: RawWorkerHealthResult): WorkerHealthResult {
  return {
    status: "ok",
    service: typeof payload.service === "string" ? payload.service : "spegeln-ai-worker",
    provider: payload.provider === "model_backed" ? "model_backed" : "rules_based",
    model: typeof payload.model === "string" ? payload.model : null,
    supportedJobs: Array.isArray(payload.supportedJobs) && payload.supportedJobs.length > 0 ? payload.supportedJobs : [...supportedJobs],
  };
}

function normalizeEntityExtraction(payload: RawEntityExtractionResult): EntityExtractionResult {
  return {
    organizations: dedupeStrings(payload.organizations),
    dates: dedupeStrings(payload.dates),
    caseNumbers: dedupeStrings(payload.case_numbers),
    emails: dedupeStrings(payload.emails),
  };
}

function normalizeTextSummary(payload: RawTextSummaryResult): TextSummaryResult {
  return {
    summary: typeof payload.summary === "string" ? payload.summary : "",
    sentencesUsed: typeof payload.sentences_used === "number" ? payload.sentences_used : 0,
    keyPoints: dedupeStrings(payload.key_points),
  };
}

function normalizeAnomalyDetection(payload: RawAnomalyDetectionResult): AnomalyDetectionResult {
  return {
    baselineLabel: typeof payload.baseline_label === "string" ? payload.baseline_label : "dataset",
    anomalies: Array.isArray(payload.anomalies)
      ? payload.anomalies
          .filter((entry) => typeof entry.index === "number" && typeof entry.value === "number" && typeof entry.z_score === "number")
          .map((entry) => ({
            index: entry.index as number,
            value: entry.value as number,
            zScore: entry.z_score as number,
          }))
      : [],
    mean: typeof payload.mean === "number" ? payload.mean : 0,
    stddev: typeof payload.stddev === "number" ? payload.stddev : 0,
  };
}

async function callWorker<TRequest, TResponse>(path: string, payload: TRequest): Promise<TResponse> {
  const { workerUrl, sharedSecret } = getRequiredWorkerBridgeConfig();

  const response = await fetch(`${workerUrl}${path}`, {
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

async function getWorker<TResponse>(path: string): Promise<TResponse> {
  const { workerUrl, sharedSecret } = getRequiredWorkerBridgeConfig();

  const response = await fetch(`${workerUrl}${path}`, {
    method: "GET",
    headers: {
      "x-worker-secret": sharedSecret,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AI-worker svarade med ${response.status}: ${body}`);
  }

  return (await response.json()) as TResponse;
}

export async function requestWorkerHealth(): Promise<WorkerHealthResult> {
  const payload = await getWorker<RawWorkerHealthResult>("/healthz");
  return normalizeWorkerHealth(payload);
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
  );
}

export async function requestDocumentClassification(input: WorkerTextInput): Promise<DocumentClassificationResult> {
  return callWorker(
    "/v1/nlp/classify-document",
    {
      text: input.text,
      locale: input.locale || "sv-SE",
      country_code: input.countryCode || "SE",
    },
  );
}

export async function requestEntityExtraction(input: WorkerTextInput): Promise<EntityExtractionResult> {
  const payload = await callWorker<
    { text: string; locale: string; country_code: string },
    RawEntityExtractionResult
  >(
    "/v1/nlp/extract-entities",
    {
      text: input.text,
      locale: input.locale || "sv-SE",
      country_code: input.countryCode || "SE",
    },
  );

  return normalizeEntityExtraction(payload);
}

export async function requestTextSummary(input: WorkerTextInput): Promise<TextSummaryResult> {
  const payload = await callWorker<
    { text: string; locale: string; country_code: string },
    RawTextSummaryResult
  >(
    "/v1/nlp/summarize",
    {
      text: input.text,
      locale: input.locale || "sv-SE",
      country_code: input.countryCode || "SE",
    },
  );

  return normalizeTextSummary(payload);
}

export async function requestTextEmbedding(input: WorkerTextInput): Promise<TextEmbeddingResult> {
  return callWorker(
    "/v1/nlp/embed",
    {
      text: input.text,
      locale: input.locale || "sv-SE",
      country_code: input.countryCode || "SE",
    },
  );
}

export async function requestAnomalyDetection(input: AnomalyDetectionInput): Promise<AnomalyDetectionResult> {
  const payload = await callWorker<
    { values: number[]; baseline_label: string },
    RawAnomalyDetectionResult
  >(
    "/v1/nlp/detect-anomalies",
    {
      values: input.values,
      baseline_label: input.baselineLabel || "dataset",
    },
  );

  return normalizeAnomalyDetection(payload);
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
  );
}