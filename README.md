# Spegeln

Spegeln är en svensk plattform för myndighetsgranskning, publik insyn, samordnat mottryck och AI-stödda arbetsflöden. Repo:t är nu uppdelat för den faktiska driftmodellen: Vercel för frontend, Railway för backend och Railway för AI-worker.

## Deploy-rötter

- Vercel frontend root: `/`
- Railway backend root: `backend`
- Railway AI-worker root: `ai-worker`

## Arkitektur

- Frontend: Next.js 16, React 19 och TypeScript i repo-roten.
- Backend: separat Hono-baserad Node-tjänst i `backend/` för auth, sessioncookies, admin, betalningar, publika och interna API-endpoints.
- AI-worker: separat FastAPI-tjänst i `ai-worker/` för NLP, tax analysis, triage, pressutkast, reverse surveillance och appeal generation.
- Databas: PostgreSQL + Prisma. Schema och migrationer ligger i `prisma/` i repo-roten.
- Proxy: frontend proxar all `/api/*`-trafik vidare till Railway-backenden via `next.config.ts`. Frontenden innehåller inte längre egna Next API-routes.
- Docker används inte i den här strukturen.

## Det som är implementerat

- Svensk/engelsk frontend med sidor för startsida, pricing, juridik, guider, integritet, API-dokumentation och admin.
- Övervakningsspegeln, Insynsindex, Myndighetsgranskaren, Folkets domstol, Reverse Surveillance, Statens svagheter, Byråkrati-bombaren och Skatteplanering.
- Cookie-baserad auth med e-post/lösenord, anonym session och social auth för Google/GitHub när credentials finns satta.
- Stripe-checkout, webhook-reconciliation, manuella betalningsärenden och adminuppdatering av betalningsstatus.
- Publikt API för leaderboard, dashboard och scorecards plus OpenAPI-dokumentation på `/api/public/openapi` via frontendens proxy.
- Prisma-baserade datamodeller för användare, bevakning, rapporter, review queues, privacy requests, AI-jobs, betalningar, usage records och civic-moduler.
- FastAPI-worker för tax optimization, dokumentklassning, entity extraction, embeddings, anomaly detection, triage och textgenerering.

## Produktionsdeploy

### Vercel frontend

- Root directory: `/`
- Byggkommando: `npm run build`
- Viktiga miljövariabler:
  - `NEXT_PUBLIC_APP_URL`: publik frontenddomän
  - `BACKEND_URL`: publik Railway-URL till backenden, till exempel `https://spegeln-backend.up.railway.app`

Frontend behöver inte egna databas- eller auth-hemligheter för att köra användarflödena. Auth, Stripe och databaskoppling ligger i Railway-backenden.

### Railway backend

- Root directory: `backend`
- Konfiguration: `backend/railway.json`
- Viktiga miljövariabler:
  - `FRONTEND_URL`
  - `DATABASE_URL`
  - `AUTH_SESSION_SECRET`
  - `BACKEND_PUBLIC_URL` om du vill att health och driftmetadata ska exponera backendens externa URL
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_PLUS_MONTHLY`
  - `STRIPE_PRICE_PRO_MONTHLY`
  - `STRIPE_PRICE_USAGE_MASS_APPEAL`
  - `STRIPE_PRICE_USAGE_AI_ANALYSIS`
  - `STRIPE_PRICE_API_PARTNER`
  - `STRIPE_PRICE_DONATION`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
  - `AI_WORKER_URL`
  - `AI_WORKER_SHARED_SECRET`
  - `MASS_APPEALS_SMTP_*` och/eller `MASS_APPEALS_SECURE_MAILBOX_*`

### Railway AI-worker

- Root directory: `ai-worker`
- Konfiguration: `ai-worker/railway.json`
- Viktiga miljövariabler:
  - `AI_WORKER_SHARED_SECRET`
  - `AI_PROVIDER_API_URL`
  - `AI_PROVIDER_API_KEY`
  - `AI_CHAT_MODEL`

## Lokal utveckling

1. Kör `npm install` i repo-roten.
2. Kör `cd backend && npm install`.
3. Starta backenden med `npm run backend:dev`.
4. Starta frontend med `BACKEND_URL=http://127.0.0.1:4000 npm run dev`.
5. Om du behöver AI-workern lokalt: `pip install -r ai-worker/requirements.txt` och sedan `npm run ai:worker:dev`.
6. Verifiera sedan `http://localhost:3000/api/health`.

För hostade miljöer ska variabler sättas i Vercel och Railway, inte i lokala produktionsfiler.

## Prisma och databas

- Prisma-schema: `prisma/schema.prisma`
- Migrationer: `prisma/migrations/`
- Seed: `npm run db:seed` (demo-data för lokal utveckling)
- Driftchecklista: [docs/driftchecklist.md](docs/driftchecklist.md)
- Presskit: [docs/presskit.md](docs/presskit.md)
- Juridisk granskning: [docs/legal-review.md](docs/legal-review.md)
- Frontend och backend delar samma schema, men backenden genererar sin egen Prisma-klient i `backend/node_modules` vid install.

## API och health

- Frontendens publika API-sökvägar ligger kvar under `/api/*`, men proxas till Railway-backenden.
- OpenAPI: `/api/public/openapi`
- Backend health via frontendproxy: `/api/health`
- Backendens direkta healthcheck för Railway: `backend`-servicens `/api/health`
- AI-workerns healthcheck: `/healthz`

## Relevanta filer

- Frontend proxy och headers: `next.config.ts`, `vercel.json`
- Backend service: `backend/package.json`, `backend/src/index.ts`, `backend/railway.json`
- AI-worker service: `ai-worker/app/main.py`, `ai-worker/railway.json`
- Prisma schema och migrationer: `prisma/schema.prisma`, `prisma/migrations/`