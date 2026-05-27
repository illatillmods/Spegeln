# Spegeln AI Worker

Separat FastAPI-tjänst för AI- och NLP-jobb. Den körs som egen Railway-service med root directory `ai-worker`.

## Root i Railway

- Root directory: `ai-worker`
- Konfiguration: `ai-worker/railway.json`
- Healthcheck: `/healthz`

## Viktiga miljövariabler

- `AI_WORKER_SHARED_SECRET`
- `AI_PROVIDER_API_URL`
- `AI_PROVIDER_API_KEY`
- `AI_CHAT_MODEL`

Om externa modellcredentials saknas kör workern fortfarande i regelbaserat läge för de jobb som stöds av den deterministiska implementationen.

## Lokalt

1. Installera beroenden med `pip install -r ai-worker/requirements.txt`.
2. Starta workern med `python -m uvicorn app.main:app --app-dir ai-worker --reload --host 0.0.0.0 --port 8001`.
3. Sätt samma `AI_WORKER_SHARED_SECRET` i backendmiljön och peka backendens `AI_WORKER_URL` till `http://localhost:8001`.

## Endpointyta

- `GET /healthz`
- `POST /v1/tax/optimize`
- `POST /v1/watchdog/triage-case`
- `POST /v1/watchdog/generate-press-release`
- `POST /v1/watchdog/reverse-surveillance`
- `POST /v1/appeals/generate-bundle`
- `POST /v1/nlp/classify-document`
- `POST /v1/nlp/extract-entities`
- `POST /v1/nlp/summarize`
- `POST /v1/nlp/embed`
- `POST /v1/nlp/detect-anomalies`

Swagger UI finns på `/docs` när workern kör.