from __future__ import annotations

import hashlib
import json
import math
import os
import re
from statistics import mean, pstdev
from typing import Any

import httpx
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field


app = FastAPI(
    title="Spegeln AI Worker",
    version="0.1.0",
    description="FastAPI-worker för tax optimization, dokumentklassning, entity extraction, embeddings, avvikelser och sammanfattningar.",
)


SUPPORTED_JOBS = [
    "tax.optimize",
    "watchdog.triage_case",
    "watchdog.generate_press_release",
    "watchdog.reverse_surveillance",
    "watchdog.normalize_record",
    "appeals.generate_bundle",
    "nlp.classify_document",
    "nlp.extract_entities",
    "nlp.summarize",
    "nlp.embed",
    "nlp.detect_anomalies",
]


class TaxOptimizeRequest(BaseModel):
    income: float = Field(ge=0)
    assets: float = Field(ge=0)
    notes: str = ""
    locale: str = "sv-SE"
    country_code: str = "SE"


class TaxStrategy(BaseModel):
    title: str
    description: str
    legal: bool = True
    legalBasis: str
    estimatedImpactSek: int
    priority: str


class TaxOptimizeResponse(BaseModel):
    summary: str
    strategies: list[TaxStrategy]
    disclaimer: str
    premium: bool = True


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "spegeln-ai-worker"
    provider: str
    model: str | None = None
    supportedJobs: list[str]


class TextRequest(BaseModel):
    text: str
    locale: str = "sv-SE"
    country_code: str = "SE"


class NumericSeriesRequest(BaseModel):
    values: list[float]
    baseline_label: str = "dataset"


class EvidenceManifest(BaseModel):
    fileName: str
    mimeType: str
    byteSize: int = Field(ge=0)
    assetKind: str
    extractedText: str | None = None


class FailureTriageRequest(BaseModel):
    title: str
    summary: str
    locale: str = "sv-SE"
    country_code: str = "SE"
    evidence: list[EvidenceManifest] = []


class FailureTriageResponse(BaseModel):
    severity: str
    priorityScore: int
    summary: str
    recommendedActions: list[str]


class PressReleaseDraftRequest(BaseModel):
    title: str
    summary: str
    severity: str
    locale: str = "sv-SE"


class PressReleaseDraftResponse(BaseModel):
    headline: str
    deck: str
    bodyMarkdown: str


class ReverseSurveillanceRequest(BaseModel):
    title: str
    summary: str
    locale: str = "sv-SE"
    evidence: list[EvidenceManifest] = []


class ReverseSurveillanceResponse(BaseModel):
    redactionPolicy: str
    riskSummary: str
    sharePack: dict[str, str]


class AutomatedAppealBundleRequest(BaseModel):
    source_title: str
    source_summary: str
    locale: str = "sv-SE"
    country_code: str = "SE"


class AutomatedAppealArtifact(BaseModel):
    kind: str
    title: str
    subjectLine: str
    body: str
    suggestedAppealType: str


class AutomatedAppealBundleResponse(BaseModel):
    parsedDecisionSummary: str
    riskSummary: str
    artifacts: list[AutomatedAppealArtifact]


class WatchdogNormalizeRecordRequest(BaseModel):
    title: str
    summary: str
    connector_key: str = "unknown"
    source_kind: str = "PUBLIC_REGISTRY"
    locale: str = "sv-SE"


class WatchdogNormalizeRecordResponse(BaseModel):
    category: str
    severity: str
    suggestedOfficialName: str | None = None
    suggestedTitle: str | None = None
    suggestedAuthoritySlug: str | None = None
    entities: list[str] = []
    summary: str


async def require_worker_secret(x_worker_secret: str | None) -> None:
    configured = os.getenv("AI_WORKER_SHARED_SECRET")
    if configured and x_worker_secret != configured:
        raise HTTPException(status_code=401, detail="Unauthorized worker request")


async def maybe_call_model(system_prompt: str, user_payload: dict[str, Any]) -> dict[str, Any] | None:
    api_url = os.getenv("AI_PROVIDER_API_URL")
    api_key = os.getenv("AI_PROVIDER_API_KEY")
    model = os.getenv("AI_CHAT_MODEL", "gpt-5-mini")
    if not api_url or not api_key:
        return None

    async with httpx.AsyncClient(timeout=45.0) as client:
        response = await client.post(
            api_url.rstrip("/") + "/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)},
                ],
            },
        )
        response.raise_for_status()
        payload = response.json()
        content = payload["choices"][0]["message"]["content"]
        return json.loads(content)


def get_provider_state() -> tuple[str, str | None]:
    api_url = os.getenv("AI_PROVIDER_API_URL")
    api_key = os.getenv("AI_PROVIDER_API_KEY")

    if api_url and api_key:
        return "model_backed", os.getenv("AI_CHAT_MODEL", "gpt-5-mini")

    return "rules_based", None


def build_health_payload() -> HealthResponse:
    provider_state, model = get_provider_state()
    return HealthResponse(
        provider=provider_state,
        model=model,
        supportedJobs=SUPPORTED_JOBS,
    )


def build_tax_strategies(payload: TaxOptimizeRequest) -> TaxOptimizeResponse:
    strategies: list[TaxStrategy] = [
        TaxStrategy(
            title="ROT- och RUT-planering",
            description="Samordna hushållsnära tjänster och godkända renoveringar mellan hushållsmedlemmar för att använda tillgängliga avdragsutrymmen utan dubblering eller felaktiga anspråk.",
            legalBasis="Skatteverkets vägledningar om ROT och RUT samt inkomstskattelagens avdragsramar.",
            estimatedImpactSek=6000,
            priority="high" if payload.income > 450000 else "medium",
        ),
        TaxStrategy(
            title="Kapitalplacering i rätt kontoform",
            description="Jämför ISK, kapitalförsäkring och traditionell depå mot din omsättning, avkastning och likviditetsplan. Strategin är laglig men måste granskas mot verklig risk och tidshorisont.",
            legalBasis="Svenska regler om schablonbeskattning och kapitalinkomstbeskattning.",
            estimatedImpactSek=3500,
            priority="medium",
        ),
    ]

    if payload.income > 700000:
        strategies.append(
            TaxStrategy(
                title="Tjänstepension och löneväxling",
                description="Pröva om löneväxling eller förstärkt tjänstepensionsavsättning är ekonomiskt rimlig med hänsyn till brytpunkter, socialförsäkringsutfall och arbetsgivarens kostnadsbild.",
                legalBasis="Svenska regler för tjänstepension, marginalskatt och pensionsavsättningar.",
                estimatedImpactSek=9000,
                priority="high",
            )
        )

    if payload.assets > 1_000_000:
        strategies.append(
            TaxStrategy(
                title="Årlig genomgång av kapitalstruktur",
                description="Fördela sparande mellan kontoformer, räntor och värdepapper så att beskattningen följer investeringsmålen och inte skapar onödiga skatteeffekter.",
                legalBasis="Regler om kapitalvinster, ränteintäkter och kontoformsspecifik beskattning.",
                estimatedImpactSek=5000,
                priority="medium",
            )
        )

    return TaxOptimizeResponse(
        summary="Aggressiv men laglig analys: utnyttja dokumenterade svenska avdrag, kontoformer och gråzoner för att minimera skatt inom ramen för lagen.",
        strategies=strategies,
        disclaimer="Endast lagliga och dokumenterade strategier. Ingen rådgivning om skatteflykt, osanna uppgifter eller dolda transaktioner.",
    )


def classify_document_rules(text: str) -> dict[str, Any]:
    lowered = text.lower()
    labels = []
    if any(keyword in lowered for keyword in ["jo-anmälan", "inspektionen", "anmälan"]):
        labels.append("complaint")
    if any(keyword in lowered for keyword in ["offentlighetsprincipen", "utlämnande", "allmän handling"]):
        labels.append("foi_request")
    if any(keyword in lowered for keyword in ["dom", "tingsrätt", "kammarrätt"]):
        labels.append("court_document")
    if not labels:
        labels.append("general_public_sector_document")
    return {"labels": labels, "confidence": 0.66}


def extract_entities_rules(text: str) -> dict[str, Any]:
    emails = re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
    dates = re.findall(r"\b\d{4}-\d{2}-\d{2}\b", text)
    case_numbers = re.findall(r"\b[A-Z]\s?\d{2,6}-\d{2}\b", text)
    organizations = re.findall(r"\b[A-ZÅÄÖ][A-Za-zÅÄÖåäö-]+(?:\s[A-ZÅÄÖ][A-Za-zÅÄÖåäö-]+){0,3}\b", text)
    return {
        "emails": sorted(set(emails)),
        "dates": sorted(set(dates)),
        "case_numbers": sorted(set(case_numbers)),
        "organizations": sorted(set(organizations))[:20],
    }


def summarize_text_rules(text: str) -> dict[str, Any]:
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    summary = " ".join(sentences[:3]).strip()
    return {"summary": summary[:600], "sentences_used": min(3, len(sentences))}


def embed_text_rules(text: str) -> dict[str, Any]:
    vector: list[float] = []
    for index in range(32):
        digest = hashlib.sha256(f"{index}:{text}".encode("utf-8")).digest()
        value = int.from_bytes(digest[:4], "big") / 2**32
        vector.append(round(value, 6))
    return {"embedding": vector, "dimensions": len(vector)}


def detect_anomalies_rules(values: list[float], baseline_label: str) -> dict[str, Any]:
    if len(values) < 2:
        return {"baseline_label": baseline_label, "anomalies": [], "mean": mean(values) if values else 0, "stddev": 0}

    average = mean(values)
    deviation = pstdev(values)
    if deviation == 0:
        return {"baseline_label": baseline_label, "anomalies": [], "mean": average, "stddev": deviation}

    anomalies = []
    for index, value in enumerate(values):
        z_score = (value - average) / deviation
        if math.fabs(z_score) >= 2.0:
            anomalies.append({"index": index, "value": value, "z_score": round(z_score, 3)})

    return {"baseline_label": baseline_label, "anomalies": anomalies, "mean": average, "stddev": deviation}


def triage_failure_rules(payload: FailureTriageRequest) -> FailureTriageResponse:
    evidence_weight = min(20, len(payload.evidence) * 4)
    severity = "CRITICAL" if "våld" in payload.summary.lower() or "övergrepp" in payload.summary.lower() else "HIGH"
    return FailureTriageResponse(
        severity=severity,
        priorityScore=min(95, 62 + evidence_weight),
        summary="Underlaget tyder på ett granskningsvärt myndighetsärende som bör verifieras, prioriteras och skickas vidare till moderation samt juridisk genomgång.",
        recommendedActions=[
            "Verifiera diarienummer, datum och om det finns parallella beslut.",
            "Säkerställ att känsliga personuppgifter maskas före extern publicering.",
            "Låt jurist bedöma publiceringsrisk innan pressutskick eller namnpublicering.",
        ],
    )


def build_press_release_rules(payload: PressReleaseDraftRequest) -> PressReleaseDraftResponse:
    return PressReleaseDraftResponse(
        headline=payload.title,
        deck="Internt pressutkast för verifierat watchdog-ärende. Får inte publiceras utan moderation och juridisk granskning.",
        bodyMarkdown=(
            f"## Ärendet\n\n{payload.summary}\n\n"
            "## Vad som händer nu\n\n"
            "Materialet granskas nu av moderator och jurist. Först därefter kan eventuell publicering, rättelseförfrågan eller presskontakt bli aktuell."
        ),
    )


def build_reverse_surveillance_rules(payload: ReverseSurveillanceRequest) -> ReverseSurveillanceResponse:
    return ReverseSurveillanceResponse(
        redactionPolicy="Bystanders and sensitive persons are blurred by default. Any decision to reveal identifiable public officials requires manual legal review.",
        riskSummary="Videon måste verifieras, tidsstämplas och granskas för tredjemansrisk innan delning eller publicering.",
        sharePack={
            "pressHeadline": payload.title,
            "socialCaption": f"Nytt motbevakningsmaterial: {payload.title}. Se videon innan myndigheten hinner skriva om berättelsen.",
            "alertText": "Ny video i motbevakningsflödet — granska och sprid.",
            "redactionMarkers": [
                {"label": "Sudda orelaterade förbipasserande", "timestamp": "00:00"},
                {"label": "Behåll identifierbara tjänstemän i offentlig tjänst", "timestamp": "00:00"},
            ],
        },
    )


def build_appeal_bundle_rules(payload: AutomatedAppealBundleRequest) -> AutomatedAppealBundleResponse:
    return AutomatedAppealBundleResponse(
        parsedDecisionSummary=payload.source_summary,
        riskSummary="Beslutet verkar överklagbart eller kräver kompletterande dokument. Utkasten måste granskas innan inskick.",
        artifacts=[
            AutomatedAppealArtifact(
                kind="APPEAL",
                title=f"Överklagande av {payload.source_title}",
                subjectLine=f"Överklagande: {payload.source_title}",
                body=(
                    f"Jag överklagar beslutet {payload.source_title}.\n\n"
                    f"Bakgrund:\n{payload.source_summary}\n\n"
                    "Jag begär att beslutet omprövas och att fullständig motivering samt underlag lämnas ut."
                ),
                suggestedAppealType="klagomal",
            ),
            AutomatedAppealArtifact(
                kind="DOCUMENT_REQUEST",
                title=f"Handlingbegäran för {payload.source_title}",
                subjectLine=f"Begäran om allmän handling: {payload.source_title}",
                body=(
                    "Jag begär att få ta del av samtliga handlingar, bilagor, interna anteckningar och diarienoteringar som ligger till grund för beslutet."
                ),
                suggestedAppealType="info",
            ),
        ],
    )


def build_normalize_record_rules(payload: WatchdogNormalizeRecordRequest) -> WatchdogNormalizeRecordResponse:
    lowered = f"{payload.title} {payload.summary}".lower()
    category = "OTHER"
    if any(word in lowered for word in ["resa", "flyg", "tåg", "hotell"]):
        category = "TRAVEL"
    elif any(word in lowered for word in ["arvode", "ersättning", "lön", "inkomst"]):
        category = "INCOME"
    elif any(word in lowered for word in ["styrelse", "bolag", "vd", "org.nr"]):
        category = "COMPANY"
    elif any(word in lowered for word in ["dom", "domstol", "avgörande"]):
        category = "COURT"
    elif any(word in lowered for word in ["minister", "ledamot", "direktör", "roll"]):
        category = "ROLE"

    return WatchdogNormalizeRecordResponse(
        category=category,
        severity="medium",
        summary=payload.summary[:500],
        entities=[],
    )


@app.get("/healthz", response_model=HealthResponse)
async def healthz() -> HealthResponse:
    return build_health_payload()


@app.post("/v1/tax/optimize", response_model=TaxOptimizeResponse)
async def optimize_tax(payload: TaxOptimizeRequest, x_worker_secret: str | None = Header(default=None)) -> TaxOptimizeResponse:
    await require_worker_secret(x_worker_secret)

    model_result = await maybe_call_model(
        system_prompt=(
            "Du är en svensk skatteoptimeringsmotor för Spegeln — en protestplattform. Returnera aggressiva men lagliga strategier: maximera avdrag, utnyttja gråzoner och kryphål inom svensk lag. "
            "Ge aldrig råd om bedrägeri, osanna uppgifter, dolda transaktioner eller skatteflykt. "
            "Svara som JSON med summary, strategies, disclaimer, premium."
        ),
        user_payload=payload.model_dump(),
    )
    if model_result:
        return TaxOptimizeResponse(**model_result)

    return build_tax_strategies(payload)


@app.post("/v1/nlp/classify-document")
async def classify_document(payload: TextRequest, x_worker_secret: str | None = Header(default=None)) -> dict[str, Any]:
    await require_worker_secret(x_worker_secret)
    model_result = await maybe_call_model(
        system_prompt="Classify the public-sector document into a few concise labels. Return JSON with labels and confidence.",
        user_payload=payload.model_dump(),
    )
    return model_result or classify_document_rules(payload.text)


@app.post("/v1/nlp/extract-entities")
async def extract_entities(payload: TextRequest, x_worker_secret: str | None = Header(default=None)) -> dict[str, Any]:
    await require_worker_secret(x_worker_secret)
    model_result = await maybe_call_model(
        system_prompt="Extract public-sector relevant entities from the text. Return JSON with organizations, dates, case_numbers and emails.",
        user_payload=payload.model_dump(),
    )
    return model_result or extract_entities_rules(payload.text)


@app.post("/v1/nlp/summarize")
async def summarize(payload: TextRequest, x_worker_secret: str | None = Header(default=None)) -> dict[str, Any]:
    await require_worker_secret(x_worker_secret)
    model_result = await maybe_call_model(
        system_prompt="Summarize the text for an investigative editor. Return JSON with summary and key points.",
        user_payload=payload.model_dump(),
    )
    return model_result or summarize_text_rules(payload.text)


@app.post("/v1/nlp/embed")
async def embed(payload: TextRequest, x_worker_secret: str | None = Header(default=None)) -> dict[str, Any]:
    await require_worker_secret(x_worker_secret)
    return embed_text_rules(payload.text)


@app.post("/v1/nlp/detect-anomalies")
async def detect_anomalies(payload: NumericSeriesRequest, x_worker_secret: str | None = Header(default=None)) -> dict[str, Any]:
    await require_worker_secret(x_worker_secret)
    return detect_anomalies_rules(payload.values, payload.baseline_label)


@app.post("/v1/watchdog/triage-case", response_model=FailureTriageResponse)
async def triage_case(payload: FailureTriageRequest, x_worker_secret: str | None = Header(default=None)) -> FailureTriageResponse:
    await require_worker_secret(x_worker_secret)
    model_result = await maybe_call_model(
        system_prompt=(
            "You triage public watchdog reports for Spegeln, a Swedish protest platform. Prioritize exposure of authority failures. "
            "Assess severity boldly when evidence supports it. Return JSON with severity, priorityScore, summary, recommendedActions. "
            "Never encourage harassment, doxxing, or unverified defamation."
        ),
        user_payload=payload.model_dump(),
    )
    if model_result:
        return FailureTriageResponse(**model_result)
    return triage_failure_rules(payload)


@app.post("/v1/watchdog/generate-press-release", response_model=PressReleaseDraftResponse)
async def generate_press_release(payload: PressReleaseDraftRequest, x_worker_secret: str | None = Header(default=None)) -> PressReleaseDraftResponse:
    await require_worker_secret(x_worker_secret)
    model_result = await maybe_call_model(
        system_prompt=(
            "Draft a hard-hitting Swedish press release for Spegeln exposing authority failure. Be direct and confrontational while staying factual. "
            "Note that material comes from public reporting channels. Return JSON with headline, deck, bodyMarkdown."
        ),
        user_payload=payload.model_dump(),
    )
    if model_result:
        return PressReleaseDraftResponse(**model_result)
    return build_press_release_rules(payload)


@app.post("/v1/watchdog/reverse-surveillance", response_model=ReverseSurveillanceResponse)
async def reverse_surveillance(payload: ReverseSurveillanceRequest, x_worker_secret: str | None = Header(default=None)) -> ReverseSurveillanceResponse:
    await require_worker_secret(x_worker_secret)
    model_result = await maybe_call_model(
        system_prompt=(
            "Design a redaction and distribution plan for counter-surveillance video on Spegeln. "
            "Prioritize public exposure of police/authority misconduct while blurring bystanders and unrelated civilians. "
            "Return JSON with redactionPolicy, riskSummary, sharePack where sharePack includes pressHeadline, socialCaption, alertText, redactionMarkers (array of {label, timestamp})."
        ),
        user_payload=payload.model_dump(),
    )
    if model_result:
        return ReverseSurveillanceResponse(**model_result)
    return build_reverse_surveillance_rules(payload)


@app.post("/v1/watchdog/normalize-record", response_model=WatchdogNormalizeRecordResponse)
async def normalize_record(payload: WatchdogNormalizeRecordRequest, x_worker_secret: str | None = Header(default=None)) -> WatchdogNormalizeRecordResponse:
    await require_worker_secret(x_worker_secret)
    model_result = await maybe_call_model(
        system_prompt=(
            "Normalize a raw public-record snippet for Spegeln watchdog ingestion. "
            "Return JSON with category (ROLE|INCOME|PROPERTY|TRAVEL|COURT|COMPANY|RELATIONSHIP|PROCUREMENT|OTHER), "
            "severity (low|medium|high), suggestedOfficialName, suggestedTitle, suggestedAuthoritySlug, entities (array of strings), summary."
        ),
        user_payload=payload.model_dump(),
    )
    if model_result:
        return WatchdogNormalizeRecordResponse(**model_result)
    return build_normalize_record_rules(payload)


@app.post("/v1/appeals/generate-bundle", response_model=AutomatedAppealBundleResponse)
async def generate_appeal_bundle(payload: AutomatedAppealBundleRequest, x_worker_secret: str | None = Header(default=None)) -> AutomatedAppealBundleResponse:
    await require_worker_secret(x_worker_secret)
    model_result = await maybe_call_model(
        system_prompt=(
            "Generate an aggressive Swedish administrative appeal bundle from an authority decision for Spegeln. "
            "Produce lawful but relentless draft texts: appeals, complaints, document requests designed to force full disclosure and overload bureaucracy. "
            "Return JSON with parsedDecisionSummary, riskSummary, artifacts where artifacts can be APPEAL, COMPLAINT, or DOCUMENT_REQUEST."
        ),
        user_payload=payload.model_dump(),
    )
    if model_result:
        return AutomatedAppealBundleResponse(**model_result)
    return build_appeal_bundle_rules(payload)