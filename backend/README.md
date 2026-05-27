# Spegeln Backend

Separat Node.js-backend för Railway. Tjänsten kör auth, sessioncookies, admin- och betalningsflöden, publika och interna API-endpoints samt Prisma-baserad dataläsning för frontendens `/api/*`-proxy.

## Root i Railway

- Sätt service root directory till `backend`.
- `backend/railway.json` innehåller build-, start- och healthcheck-inställningar.

## Viktiga miljövariabler

- `FRONTEND_URL`: publik Vercel-domän som backendredirects och OpenAPI ska peka mot.
- `DATABASE_URL`: PostgreSQL-anslutning.
- `AUTH_SESSION_SECRET`: signering av sessionscookie.
- `BACKEND_PUBLIC_URL`: valfri publik backend-URL för health och driftmetadata.
- `STRIPE_SECRET_KEY` och `STRIPE_WEBHOOK_SECRET`.
- `STRIPE_PRICE_PLUS_MONTHLY`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_USAGE_MASS_APPEAL`, `STRIPE_PRICE_USAGE_AI_ANALYSIS`, `STRIPE_PRICE_API_PARTNER`, `STRIPE_PRICE_DONATION`.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.
- `AI_WORKER_URL` och `AI_WORKER_SHARED_SECRET`.
- `MASS_APPEALS_SMTP_*` och/eller `MASS_APPEALS_SECURE_MAILBOX_*` när riktiga utskick ska vara aktiva.

## Lokalt

1. Kör `npm install` i `backend/`.
2. Kör `npm run dev` i `backend/`.
3. Kör `npm run build` och `npm run typecheck` för verifiering.

Backenden använder root-schemat i `../prisma/schema.prisma`, men kopierar det till `backend/prisma/schema.prisma` vid klientgenerering så att Railway-tjänsten är självbärande.