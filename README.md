# Spegeln

Spegeln är en svensk produktidé och MVP för automatiserad bevakning, rapportering och publik insyn kring myndigheter och offentliga beslutsmiljöer. Fokus ligger på tre saker samtidigt: tydlig samhällsnytta, teknisk skalbarhet och juridisk återhållsamhet.

Den här repot är nu justerad för en hosted-first driftmodell där Vercel är primär plattform för webbappen och Railway är det naturliga valet för PostgreSQL och framtida workers.

## Rekommenderad stack

- Vercel för Next.js 16, React 19, TypeScript och publik webb med App Router.
- Railway för PostgreSQL nu och för framtida cronjobb eller interna workers.
- PostgreSQL + Prisma för relationell data kring bevakningar, rapporter, tips, användare, betalning och revisionsloggar.
- Python + FastAPI som separat AI-tjänst för NLP, dokumentklassning, embeddings och större batchjobb, gärna som egen Railway-service senare.
- Docker finns kvar som reservväg, men är inte längre den primära rekommendationen.

### Hosted-first produktionsriktning

- Vercel kör frontend och Next.js-serverfunktioner nära slutanvändaren.
- Railway levererar managed PostgreSQL utan lokal drift.
- `vercel.json` sätter byggkommando, säkerhetsheaders och svensk regionpreferens.
- `railway.json` lägger till healthcheck och driftinställningar om du vill köra samma app eller en worker på Railway.


## Det som är implementerat i den här repot

- Svensk, responsiv Next.js-app med sidor för startsida, plattform, juridik och prissättning.
- Modern layout med App Router, Tailwind CSS v4 och TypeScript.
- Prisma-schema för användare, bevakningar, rapporter, juridisk granskning, tips, usage-prissättning och audit-loggar.
- Prisma-persistens för Byråkrati-bombaren med batcher, dokument, leveransstatus och koppling till usage records.
- Prisma-modeller för klagomål, granskningar, leaderboard-snapshots, myndighetsscorecards, publika API-konsumenter och AI-jobb.
- Vercel-konfiguration i `vercel.json` och Railway-konfiguration i `railway.json`.
- Hosted-first miljöhantering för metadata, URL-upplösning och hälsokontroll.
- Serverless-säker Prisma-klient för Vercel- och Railway-miljöer.
- Health endpoint på `/api/health` som kan upptäcka hostmiljö och testa databasanslutning.
- Signerad cookie-baserad autentisering med e-post/lösenord, anonym gästsession och social OAuth-beredskap för Google/GitHub.
- Integritetscenter på `/integritet` med samtyckesinställningar, GDPR-begäran och spårbar lagring av privacy events.
- Utbyggd betalningsmotor med Stripe checkout för kort/Klarna och manuella verifieringsflöden för Swish, BTC, XMR, LTC och kontanter.
- Adminpanel på `/admin` för moderation, legal review, betalningskö, privacy requests, betafeedback och API-konsumenter.
- Publik sida på `/insynsindex` med pseudonymiserad leaderboard, realtidsdashboard och reproducerbara scorecards.
- Publika REST-endpoints under `/api/public/*` med OpenAPI-spec på `/api/public/openapi`.
- Dokumentationsytor på `/api-dokumentation`, `/guider`, `/beta` och `/villkor`.
- Svensk/engelsk shell-lokalisering med språkväxling i gränssnittet.
- Separat FastAPI-worker under `ai-worker/` för tax optimization, dokumentklassning, entity extraction, embeddings, avvikelsedetektion och sammanfattningar.
- `Myndighetsgranskaren` för anonym rapportering, AI-prioritering, pressutkast, evidensmanifest och moderation/legal review.
- `Folkets domstol` för publik förtroendevotering, trenddata och modererade vittnesmål.
- `Statens svagheter` för versionsstyrd wiki med kategorier, taggar och kvalitetsröstning.
- `Reverse Surveillance` för skyddad videointag, redaktionskö, maskningspolicy och kontrollerade delningspaket.
- `Automatiserad överklagare` inbyggd i Byråkrati-bombaren för AI-genererade överklagandebuntar och valfri automatisk submission.

## Monetisering

Spegeln bör kombinera fyra intäktsströmmar:

1. Freemium för publik räckvidd och trygg tipsinlämning.
2. Premiumabonnemang för fler bevakningar, notiser, teamfunktioner och juridiskt arbetsflöde.
3. Pay-per-use för AI-körningar, batch-exporter och historiska jämförelser.
4. Etiska annonser inom juridik, integritet och informationssäkerhet, tydligt märkta och manuellt granskade.

Byråkrati-bombaren följer samma modell: enstaka batcher kan debiteras per körning, medan Pro och Civic Lab kan få obegränsad användning inom abuse-gränser och revisionsspår.

Skatteplaneringsmaskinen följer också premiumspåret: grundläggande legal-only analys kan visas direkt, medan djupare rapporter, kontinuerlig optimering och historiska jämförelser lämpar sig för Premium eller usage-baserad debitering.

## Juridiska skyddsräcken

Detta projekt är inte juridisk rådgivning. Före skarp lansering bör plattformen granskas av svensk jurist och dataskyddsresurs.

Prioriterade kontrollpunkter:

1. Dokumentera rättslig grund och ändamålsbegränsning för varje datatyp.
2. Genomför DPIA för tipsflöde, AI-klassning och större personuppgiftsbehandling.
3. Inför mänsklig och juridisk godkännandekedja innan publicering.
4. Bygg gallring, loggning, rättelseflöden och abuse-skydd innan öppna tipsflöden skalas upp.
5. Säkerställ att offentlig data, namnpublicering och sammanställningar bedöms mot svensk lag, GDPR och proportionalitet.
6. Säkerställ att massutskick till myndigheter loggas, rate-limitas och kan stoppas för manuell kontroll när innehållet eller volymen kräver det.
7. Exponera endast anonymiserade och aggregerade datapunkter i leaderboard, dashboards och öppna API:er.
8. Håll metoder versionsstyrda per jurisdiktion så att scorecards och compliance-regler kan skilja mellan exempelvis EU och USA.

## Kom igång utan lokal hosting

1. Skapa en PostgreSQL-tjänst i Railway.
2. Kopiera Railways `DATABASE_URL` till Vercel för både Preview och Production.
3. Sätt `NEXT_PUBLIC_APP_URL` i Vercel till din primära produktionsdomän.
4. Koppla repot till Vercel. Byggkommandot är redan definierat i `vercel.json`.
5. Om du vill köra workers eller fallback-webb på Railway finns `railway.json` redan på plats.
6. Kontrollera `/api/health` efter första deploy för att bekräfta URL-detektering och databasstatus.
7. Lägg in `AUTH_SESSION_SECRET`, eventuella OAuth-nycklar och Stripe price IDs innan du aktiverar auth eller betalda planer.

## Minimal lokal fallback

1. Kopiera `.env.example` till `.env` och byt till en riktig Railway-URL eller lokal Postgres om du verkligen behöver det.
2. Installera beroenden med `npm install`.
3. Generera Prisma-klienten med `npm run prisma:generate`.
4. Skapa databasschemat med `npm run db:push`.
5. Kör även `npm run typecheck` för att verifiera den utökade auth-, privacy- och betalningsytan.
6. Starta appen med `npm run dev`.

## Viktiga miljövariabler

- `AUTH_SESSION_SECRET` signerar inloggningscookies.
- `GOOGLE_CLIENT_ID` och `GOOGLE_CLIENT_SECRET` aktiverar Google OAuth.
- `GITHUB_CLIENT_ID` och `GITHUB_CLIENT_SECRET` aktiverar GitHub OAuth.
- `STRIPE_PRICE_PLUS_MONTHLY`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_USAGE_MASS_APPEAL`, `STRIPE_PRICE_USAGE_AI_ANALYSIS`, `STRIPE_PRICE_API_PARTNER` och `STRIPE_PRICE_DONATION` kopplar köpflöden till riktiga Stripe-priser.
- Utan dessa nycklar fungerar manuella betalningsförfrågningar fortfarande, men kort/Klarna-checkout kan inte startas.

### Leveranstransport för Byråkrati-bombaren

- Sätt `MASS_APPEALS_SMTP_*` för faktiska utskick till registratorer och vanliga myndighetsadresser.
- Sätt `MASS_APPEALS_SECURE_MAILBOX_WEBHOOK_URL` och eventuellt `MASS_APPEALS_SECURE_MAILBOX_API_KEY` för mottagare som går via säker brevlåda eller extern meddelandetjänst.
- Utan dessa variabler sparas batcherna fortfarande i Prisma, men leveranser utan konfigurerad transport markeras som misslyckade eller manuella.

### AI-worker och öppet API

- Sätt `AI_WORKER_URL` och `AI_WORKER_SHARED_SECRET` i Next.js-miljön för att aktivera tax optimization och andra AI-jobb via FastAPI-workern.
- Sätt `AI_PROVIDER_API_URL`, `AI_PROVIDER_API_KEY` och `AI_CHAT_MODEL` i worker-miljön för att slå på modellbaserad analys; annars används deterministiska fallback-regler.
- FastAPI ger Swagger/OpenAPI automatiskt på worker-sidan, medan webbappen publicerar anonymiserade REST-endpoints på `/api/public/leaderboard`, `/api/public/dashboard` och `/api/public/scorecards`.
- API-konsumenter registreras via `POST /api/public/register` och skyddas med hashade API-nycklar, scopes och enkel timbaserad rate limiting i PostgreSQL.
- API-accessnivåer beskrivs även på `/api/public/access-tiers` och i docsytan `/api-dokumentation`.
- Land, region och locale är nu egna fält i datamodellen så att myndigheter, mallar, scorecards och användarflöden kan särskiljas per jurisdiktion.
- Videoflödet är medvetet byggt med tredjemansmaskning och juridisk kontroll före publicering; det ska inte användas för omodererad exponering av privatpersoner.

## Produktdrift och release

- GitHub Actions-workflow i `.github/workflows/ci.yml` kör Prisma-validate, lint, typecheck, build, npm audit och Python-compile för AI-workern.
- `CHANGELOG.md` innehåller release notes för 0.1.0 och 0.2.0.
- `docs/launch-plan.md` beskriver beta, feedbackhantering, press kit och release-gates.
- `/beta` ger ett enkelt feedbackflöde för pilotanvändare och juridiska granskare.

## Användarguider och juridik

- `/guider` samlar vägvisare till varje större arbetsflöde.
- `/integritet` samlar samtycken och GDPR-begäran.
- `/villkor` täcker användarvillkor, moderation, takedown och betalningsprinciper.
- `/juridik` behåller de övergripande svenska/EU-rättsliga skyddsräckena för publicering och databehandling.

## Föreslagna nästa steg

1. Färdigställ och aktivera fullständigt inloggningsflöde (t.ex. JWT, magic link eller BankID) och koppla till Prisma User-modellen.
2. Koppla betalningar via Stripe eller liknande med usage-baserad mätning.
3. Lägg till faktisk datainsamling från godkända svenska öppna källor.
4. Ersätt demo-auth med ett riktigt inloggningsflöde och koppla publika alias till verifierade konton.
5. Lägg till bakgrundsjobb för att materialisera leaderboard-snapshots och scorecards i stället för att alltid räkna dem direkt.# Spegeln
