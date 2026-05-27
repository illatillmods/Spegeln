# Driftchecklista

Obligatoriska miljövariabler per tjänst. Sätt dessa i Vercel (frontend) respektive Railway (backend och AI-worker), inte i versionskontrollerade `.env`-filer med hemligheter.

## Frontend (Vercel)

| Variabel | Krävs | Syfte |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Ja | Publik frontenddomän |
| `BACKEND_URL` | Ja | Railway-backend som proxas via `/api/*` |

## Backend (Railway)

**Root Directory måste vara repo-roten**, inte `backend/`. Backend bundlar `src/lib/` och `prisma/` från monorepot.

Build Command: `npm ci && npm ci --prefix backend && npm run backend:build`  
Start Command: `npm run backend:start`

| Variabel | Krävs | Syfte |
|---|---|---|
| `DATABASE_URL` | Ja | PostgreSQL via Prisma |
| `AUTH_SESSION_SECRET` | Ja | Signering av sessionscookies |
| `FRONTEND_URL` | Ja | OAuth-callback och redirects |
| `AI_WORKER_URL` | Ja (AI-flöden) | FastAPI-worker |
| `AI_WORKER_SHARED_SECRET` | Ja (AI-flöden) | Signerade worker-anrop |
| `STRIPE_SECRET_KEY` | Ja (betalning) | Stripe checkout |
| `STRIPE_WEBHOOK_SECRET` | Ja (betalning) | Webhook-verifiering |
| `STRIPE_PRICE_*` | Ja (betalning) | Pris-ID per produkt |
| `GOOGLE_CLIENT_ID/SECRET` | Valfritt | Social inloggning |
| `GITHUB_CLIENT_ID/SECRET` | Valfritt | Social inloggning |
| `MASS_APPEALS_SMTP_*` | Valfritt | E-postutskick för batcher |
| `CRON_SECRET` | Ja (automatisk ingestion) | Hemlighet för `POST /api/admin/watchdog/ingest-cron` |
| `WATCHDOG_CONNECTORS` | Ja (automatisk ingestion) | Kommaseparerade connectors, t.ex. `riksdag,regering,domstol,bolag,upphandling,property,polis-open` |
| `RIKSDAG_API_BASE` | Rekommenderas | Standard `https://data.riksdagen.se` |
| `RIKSDAG_TRAVEL_FROM_YEAR` | Valfritt | Startår för reseredovisnings-backfill (standard `2018`) |
| `INGEST_RATE_LIMIT_MS` | Valfritt | Paus mellan connector-anrop (standard `500`) |

### Migration vid deploy

Backend kör `prisma migrate deploy` vid start om `DATABASE_URL` är satt (`backend/scripts/start.mjs`).

Manuell körning:

```bash
npx prisma migrate deploy
```

### Railway cron (daglig ingestion)

Skapa ett Cron-jobb i Railway som kör:

```bash
./scripts/railway-cron-ingest.sh
```

Med miljövariabler `BACKEND_URL` och `CRON_SECRET` satta i cron-tjänsten.

## AI-worker (Railway)

| Variabel | Krävs | Syfte |
|---|---|---|
| `AI_WORKER_SHARED_SECRET` | Ja | Måste matcha backend |
| `AI_PROVIDER_API_URL` | Valfritt | Extern LLM |
| `AI_PROVIDER_API_KEY` | Valfritt | Extern LLM |
| `AI_CHAT_MODEL` | Valfritt | Modellnamn |

## Lokal utveckling

1. `npm install` i repo-roten och `cd backend && npm install`
2. `npm run backend:dev`
3. `BACKEND_URL=http://127.0.0.1:4000 npm run dev`
4. `npm run db:push` och `npm run db:seed` när `DATABASE_URL` är satt
5. Verifiera `http://localhost:3000/api/health`

## Seed

Kör `npm run db:seed` efter migration. Demo-admin: `admin@spegeln.se` / `SpegelnDemo2026!`
