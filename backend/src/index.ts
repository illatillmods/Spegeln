import { randomUUID } from "node:crypto";
import { serve } from "@hono/node-server";
import { PaymentRequestStatus } from "@prisma/client";
import { Hono } from "hono";
import { z } from "zod";
import Stripe from "stripe";
import {
  requestTaxOptimization,
  type WorkerHealthResult,
} from "../../src/lib/ai-worker";
import {
  createAutomatedAppealJob,
  createAuthorityFailureReport,
  createReverseSurveillanceSubmission,
  createWikiDraft,
  deleteUserWatch,
  getAccountOverview,
  getAuthorityFailureReportById,
  getConfidenceBoard,
  getReverseSurveillanceById,
  getTaxAnalysisById,
  getWikiPageBySlug,
  listAccountNotifications,
  listAutomatedAppealJobs,
  listAuthorityFailureReports,
  listReverseSurveillance,
  listUserWatches,
  listWikiPages,
  submitConfidenceTestimonial,
  submitConfidenceVote,
  submitWikiVote,
  listWikiCategories,
  upsertUserWatch,
} from "../../src/lib/civic-features";
import { listTaxAnalyses } from "../../src/lib/civic/tax-analyses";
import { storeEvidenceFile, resolveEvidenceAccessUrl } from "../../src/lib/object-storage";
import { extractDocumentText } from "../../src/lib/document-intake";
import { listPressFeed } from "../../src/lib/press-feed";
import { runConfiguredWatchdogIngestion } from "../../src/lib/watchdog-ingestion";
import { recordAuditEvent, reportServerError } from "../../src/lib/observability";
import { mergePaymentRequestMetadata, markPaymentRequestPaid, setPaymentRequestStatus } from "../../src/lib/payment-requests";
import {
  calculateDiscountedAmount,
  findPurchaseKeyByStripePriceId,
  getPaymentMethodConfig,
  getPurchaseConfig,
  resolveStripePaymentTypes,
} from "../../src/lib/payments";
import { getPrismaClient } from "../../src/lib/prisma";
import {
  getAuthorityScorecards,
  getDashboardSnapshot,
  getLeaderboard,
  parsePublicFilters,
} from "../../src/lib/public-insights";
import { getStripeClient } from "../../src/lib/stripe";
import {
  getWatchdogAuthorities,
  getWatchdogPeople,
  getWatchdogProfile,
  getWatchdogPublicFeed,
  getWatchdogSnapshot,
} from "../../src/lib/watchdog";
import { importWatchdogRows } from "../../src/lib/watchdog-import";
import {
  getIngestReviewQueue,
  getIngestRunHistory,
  listWatchdogConnectors,
  runWatchdogBackfill,
  runWatchdogOrchestrator,
} from "../../src/lib/watchdog/orchestrator";
import { approveIngestReviewItem, rejectIngestReviewItem } from "../../src/lib/watchdog/review";
import {
  authenticateEmailUser,
  clearOAuthStateCookie,
  clearSession,
  createAnonymousUser,
  getSessionUser,
  persistSession,
  readOAuthStateCookie,
  requireRole,
  setAnalyticsConsentCookie,
  setLocaleCookie,
  setOAuthStateCookie,
  type SessionUser,
  registerEmailUser,
  upsertSocialUser,
} from "./lib/auth";
import { getBackendBaseUrl, getDeploymentContext, getFrontendBaseUrl } from "./lib/deployment";
import { getPublicApiSpec, registerApiConsumer, requirePublicApiAccess } from "./lib/public-api";
import { buildSocialAuthorizeUrl, exchangeSocialCode, getSocialProviderCatalog, type SocialProviderId } from "./lib/social-auth";
import { getMassAppealCatalogAsync, listRecentMassAppealBatches, previewMassAppeal, sendMassAppeal, toApiError } from "../../src/lib/mass-appeals";

const app = new Hono();

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(10),
  name: z.string().trim().max(80).optional(),
  preferredLanguage: z.enum(["sv", "en"]).default("sv"),
  marketingConsent: z.boolean().optional(),
});

const anonymousSchema = z.object({
  preferredLanguage: z.enum(["sv", "en"]).default("sv"),
});

const localeSchema = z.object({
  locale: z.enum(["sv", "en"]),
});

const feedbackSchema = z.object({
  email: z.email().optional().or(z.literal("")),
  category: z.string().trim().min(2).max(64),
  rating: z.number().int().min(1).max(5),
  message: z.string().trim().min(10).max(3000),
  locale: z.enum(["sv", "en"]).default("sv"),
});

const preferencesSchema = z.object({
  locale: z.enum(["sv", "en"]).default("sv"),
  marketingConsent: z.boolean(),
  analyticsConsent: z.boolean(),
  personalizationConsent: z.boolean(),
});

const privacyRequestSchema = z.object({
  email: z.email(),
  requestKind: z.enum(["ACCESS", "EXPORT", "DELETE", "RECTIFY", "OBJECTION", "RESTRICTION"]),
  details: z.string().max(2000).optional(),
  locale: z.enum(["sv", "en"]).default("sv"),
});

const checkoutSchema = z.object({
  purchaseKey: z.enum(["plus_monthly", "pro_monthly", "usage_mass_appeal", "usage_ai_analysis", "api_partner", "civic_donation"]),
  paymentMethod: z.enum(["CARD", "KLARNA", "SWISH", "BTC", "XMR", "LTC", "CASH"]),
});

const updatePaymentSchema = z.object({
  action: z.enum(["mark_paid", "mark_rejected", "mark_expired", "mark_awaiting_payment"]),
  settlementReference: z.string().trim().max(180).optional(),
  note: z.string().trim().max(2000).optional(),
});

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

function readIpAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;
}

function getFingerprintSource(request: Request) {
  return [request.headers.get("x-forwarded-for"), request.headers.get("user-agent")].filter(Boolean).join("|");
}

function getActorKey(request: Request, senderEmail?: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `${forwardedFor || "local"}:${senderEmail || "anonymous"}`;
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : Number.NaN;
}

function readMetadataValue(metadata: Stripe.Metadata | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readStripeId(value: { id: string } | string | null) {
  if (!value) {
    return undefined;
  }

  return typeof value === "string" ? value : value.id;
}

function shouldExpireSubscription(status: Stripe.Subscription.Status) {
  return status === "canceled" || status === "incomplete_expired" || status === "unpaid";
}

async function handleCheckoutCompleted(event: Stripe.Event, session: Stripe.Checkout.Session) {
  const paymentRequestId = readMetadataValue(session.metadata, "paymentRequestId");

  if (!paymentRequestId) {
    return;
  }

  await markPaymentRequestPaid(paymentRequestId, {
    provider: "stripe",
    note: `Stripe-event ${event.type} verifierade checkout-sessionen.`,
    metadata: {
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: readStripeId(session.payment_intent),
      stripeSubscriptionId: readStripeId(session.subscription),
      stripeCustomerId: readStripeId(session.customer),
      stripeLastEventId: event.id,
      stripePaymentStatus: session.payment_status,
      stripeCheckoutStatus: session.status,
    },
  });

  const userId = readMetadataValue(session.metadata, "userId");

  if (userId) {
    await recordAuditEvent({
      userId,
      actorLabel: session.customer_email || userId,
      action: "payment.checkout.completed",
      targetType: "PaymentRequest",
      targetId: paymentRequestId,
      metadata: {
        eventId: event.id,
        sessionId: session.id,
        paymentIntentId: readStripeId(session.payment_intent),
        subscriptionId: readStripeId(session.subscription),
      },
    });
  }
}

async function handleCheckoutExpired(event: Stripe.Event, session: Stripe.Checkout.Session) {
  const paymentRequestId = readMetadataValue(session.metadata, "paymentRequestId");

  if (!paymentRequestId) {
    return;
  }

  await setPaymentRequestStatus(paymentRequestId, PaymentRequestStatus.EXPIRED, {
    provider: "stripe",
    note: `Stripe-event ${event.type} markerade checkout-sessionen som avslutad utan betalning.`,
    metadata: {
      stripeCheckoutSessionId: session.id,
      stripeLastEventId: event.id,
      stripePaymentStatus: session.payment_status,
      stripeCheckoutStatus: session.status,
    },
  });
}

async function handleSubscriptionUpdated(event: Stripe.Event, subscription: Stripe.Subscription) {
  const paymentRequestId = readMetadataValue(subscription.metadata, "paymentRequestId");

  if (!paymentRequestId || !shouldExpireSubscription(subscription.status)) {
    return;
  }

  await setPaymentRequestStatus(paymentRequestId, PaymentRequestStatus.EXPIRED, {
    provider: "stripe",
    note: `Stripe-subscriptionen gick till status ${subscription.status}.`,
    metadata: {
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: readStripeId(subscription.customer),
      stripeLastEventId: event.id,
      stripeCheckoutStatus: subscription.status,
    },
  });
}

async function startStripeCheckout(input: {
  user: SessionUser;
  purchaseKey: z.infer<typeof checkoutSchema>["purchaseKey"];
  paymentMethod: z.infer<typeof checkoutSchema>["paymentMethod"];
  stripePriceId: string;
}) {
  const paymentMethod = getPaymentMethodConfig(input.paymentMethod);
  const purchase = getPurchaseConfig(input.purchaseKey);
  const prisma = getPrismaClient();

  if (!paymentMethod || !purchase) {
    throw new Error("Ogiltig betalningskonfiguration.");
  }

  if (!prisma) {
    throw new Error("Databaspersistens krävs för Stripe-betalningar.");
  }

  const finalAmountSek = calculateDiscountedAmount(purchase.amountSek, paymentMethod.discountPercent);
  const stripe = getStripeClient();
  const baseUrl = getFrontendBaseUrl();
  const paymentRequest = await prisma.paymentRequest.create({
    data: {
      userId: input.user.id,
      email: input.user.email,
      method: input.paymentMethod,
      flowType: purchase.flowType,
      status: PaymentRequestStatus.AWAITING_PAYMENT,
      amountSek: purchase.amountSek,
      discountPercent: paymentMethod.discountPercent,
      finalAmountSek,
      itemLabel: purchase.label,
      metadata: {
        purchaseKey: input.purchaseKey,
        paymentMethod: input.paymentMethod,
        stripePriceId: input.stripePriceId,
      },
    },
  });

  try {
    const sessionMetadata = {
      userId: input.user.id,
      purchaseKey: input.purchaseKey,
      paymentMethod: input.paymentMethod,
      paymentRequestId: paymentRequest.id,
    };

    const session = await stripe.checkout.sessions.create({
      mode: purchase.flowType === "SUBSCRIPTION" ? "subscription" : "payment",
      payment_method_types: [...resolveStripePaymentTypes(input.paymentMethod)],
      customer_email: input.user.email,
      client_reference_id: paymentRequest.id,
      line_items: [
        {
          price: input.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/prissattning?success=1`,
      cancel_url: `${baseUrl}/prissattning?canceled=1`,
      metadata: sessionMetadata,
      subscription_data: purchase.flowType === "SUBSCRIPTION"
        ? {
            metadata: sessionMetadata,
          }
        : undefined,
    });

    await prisma.paymentRequest.update({
      where: { id: paymentRequest.id },
      data: {
        metadata: mergePaymentRequestMetadata(paymentRequest.metadata, {
          stripeCheckoutSessionId: session.id,
          stripeCheckoutStatus: session.status,
        }),
      },
    });

    await recordAuditEvent({
      userId: input.user.id,
      actorLabel: input.user.email,
      action: "payment.checkout.started",
      targetType: "StripeCheckoutSession",
      targetId: session.id,
      metadata: {
        paymentRequestId: paymentRequest.id,
        purchaseKey: input.purchaseKey,
        paymentMethod: input.paymentMethod,
      },
    });

    return { url: session.url, requestId: paymentRequest.id };
  } catch (error) {
    await prisma.paymentRequest.update({
      where: { id: paymentRequest.id },
      data: {
        status: PaymentRequestStatus.REJECTED,
        complianceNotes: error instanceof Error ? error.message : "Stripe-sessionen kunde inte startas.",
      },
    });

    throw error;
  }
}

async function getDatabaseCheck() {
  const prisma = getPrismaClient();

  if (!prisma) {
    return {
      provider: "not-configured",
      status: "not_configured",
      detail: "DATABASE_URL saknas fortfarande i den hostade miljön.",
    };
  }

  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      provider: "configured",
      status: "reachable",
      detail: "Databasen svarar via DATABASE_URL.",
    };
  } catch {
    return {
      provider: "configured",
      status: "configured_but_unreachable",
      detail: "DATABASE_URL finns, men databasen svarar inte ännu.",
    };
  }
}

async function getAiWorkerCheck() {
  const workerUrl = process.env.AI_WORKER_URL?.replace(/\/$/, "");
  const sharedSecret = process.env.AI_WORKER_SHARED_SECRET;

  if (!workerUrl) {
    return {
      provider: "not-configured",
      status: "not_configured",
      detail: "AI_WORKER_URL saknas fortfarande i den hostade miljön.",
    };
  }

  if (!sharedSecret) {
    return {
      provider: "partially-configured",
      status: "not_configured",
      detail: "AI_WORKER_SHARED_SECRET saknas fortfarande i den hostade miljön.",
    };
  }

  try {
    const response = await fetch(`${workerUrl}/healthz`, {
      cache: "no-store",
      headers: {
        "x-worker-secret": sharedSecret,
      },
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return {
        provider: "configured",
        status: "configured_but_unreachable",
        detail: `AI-workern svarade med ${response.status}.`,
      };
    }

    const payload = (await response.json()) as WorkerHealthResult & { service?: string; supportedJobs?: string[] };

    return {
      provider: "configured",
      status: "reachable",
      detail:
        payload.provider === "model_backed"
          ? `AI-workern svarar och extern modellprovider är aktiv${payload.model ? ` (${payload.model})` : ""}.`
          : "AI-workern svarar i regelbaserat läge utan extern modellprovider.",
      service: payload.service || "spegeln-ai-worker",
      mode: payload.provider === "model_backed" ? "model-backed" : "rules-based",
      model: payload.model,
      supportedJobs: Array.isArray(payload.supportedJobs) ? payload.supportedJobs : [],
    };
  } catch {
    return {
      provider: "configured",
      status: "configured_but_unreachable",
      detail: "AI_WORKER_URL finns, men workern svarar inte ännu.",
    };
  }
}

app.onError(async (error) => {
  await reportServerError(error, { route: "backend.unhandled" });
  return jsonError(error instanceof Error ? error.message : "Internt backendfel.", 500);
});

app.use("/api/*", async (c, next) => {
  c.header("Cache-Control", "no-store");
  c.header("X-Spegeln-Backend", "railway");
  await next();
});

app.get("/api/health", async (c) => {
  const deployment = getDeploymentContext();
  const [database, aiWorker] = await Promise.all([getDatabaseCheck(), getAiWorkerCheck()]);
  const overallStatus = database.status === "configured_but_unreachable" || aiWorker.status === "configured_but_unreachable" ? "degraded" : "ok";
  const auth = process.env.AUTH_SESSION_SECRET || process.env.NEXTAUTH_SECRET ? "configured" : "missing";
  const payments = process.env.STRIPE_SECRET_KEY ? "configured" : "missing";
  const socialAuth = process.env.GOOGLE_CLIENT_ID || process.env.GITHUB_CLIENT_ID ? "partially-configured" : "missing";

  return c.json({
    name: "Spegeln Backend",
    status: overallStatus,
    timestamp: new Date().toISOString(),
    deployment,
    checks: {
      backend: "ready",
      database,
      auth,
      payments,
      aiWorker,
      socialAuth,
      frontendProxy: getFrontendBaseUrl(),
      legalReviewGate: "manual approval required",
    },
  });
});

app.get("/api/auth/providers", (c) => c.json({ providers: getSocialProviderCatalog() }));

app.post("/api/auth/login", async (c) => {
  try {
    const input = loginSchema.parse(await c.req.json());
    const user = await authenticateEmailUser(input);
    await persistSession(c, user);
    return c.json({ user });
  } catch (error) {
    await reportServerError(error, { route: "auth.login" });
    return c.json({ error: error instanceof Error ? error.message : "Kunde inte logga in." }, 400);
  }
});

app.post("/api/auth/register", async (c) => {
  try {
    const input = registerSchema.parse(await c.req.json());
    const user = await registerEmailUser(input);
    await persistSession(c, user);
    return c.json({ user });
  } catch (error) {
    await reportServerError(error, { route: "auth.register" });
    return c.json({ error: error instanceof Error ? error.message : "Kunde inte skapa konto." }, 400);
  }
});

app.post("/api/auth/logout", async (c) => {
  clearSession(c);
  return c.json({ ok: true });
});

app.post("/api/auth/anonymous", async (c) => {
  try {
    const input = anonymousSchema.parse(await c.req.json());
    const user = await createAnonymousUser(input.preferredLanguage);
    await persistSession(c, user);
    return c.json({ user, message: "Anonym session skapad." });
  } catch (error) {
    await reportServerError(error, { route: "auth.anonymous" });
    return c.json({ error: error instanceof Error ? error.message : "Kunde inte skapa anonym session." }, 400);
  }
});

app.get("/api/auth/social/:provider", async (c) => {
  const provider = c.req.param("provider");

  if (provider !== "google" && provider !== "github") {
    return c.redirect(`${getFrontendBaseUrl()}/login?error=unsupported_provider`);
  }

  try {
    const state = randomUUID();
    setOAuthStateCookie(c, provider, state);
    return c.redirect(buildSocialAuthorizeUrl(provider as SocialProviderId, state));
  } catch {
    return c.redirect(`${getFrontendBaseUrl()}/login?error=social_not_configured`);
  }
});

app.get("/api/auth/social/:provider/callback", async (c) => {
  const provider = c.req.param("provider");
  const url = new URL(c.req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = readOAuthStateCookie(c);

  clearOAuthStateCookie(c);

  if ((provider !== "google" && provider !== "github") || !code || !state || storedState !== `${provider}:${state}`) {
    return c.redirect(`${getFrontendBaseUrl()}/login?error=social_state`);
  }

  try {
    const profile = await exchangeSocialCode(provider as SocialProviderId, code);
    const user = await upsertSocialUser(profile);
    await persistSession(c, user);
    return c.redirect(`${getFrontendBaseUrl()}/`);
  } catch (error) {
    await reportServerError(error, { route: "auth.social.callback", provider });
    return c.redirect(`${getFrontendBaseUrl()}/login?error=social_failed`);
  }
});

app.get("/api/me", async (c) => {
  const user = await getSessionUser(c);

  if (!user) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  return c.json(user);
});

app.post("/api/preferences/locale", async (c) => {
  const input = localeSchema.parse(await c.req.json());
  setLocaleCookie(c, input.locale);
  return c.json({ ok: true });
});

app.post("/api/feedback", async (c) => {
  try {
    const input = feedbackSchema.parse(await c.req.json());
    const prisma = getPrismaClient();
    const user = await getSessionUser(c);

    if (!prisma) {
      return c.json({ error: "Databasanslutning saknas för feedbackinsamling." }, 503);
    }

    await prisma.betaFeedback.create({
      data: {
        userId: user?.id,
        email: input.email || user?.email,
        locale: input.locale === "en" ? "en-GB" : "sv-SE",
        category: input.category,
        message: input.message,
        rating: input.rating,
      },
    });

    return c.json({ message: "Tack. Feedbacken är registrerad för betakön." }, 201);
  } catch (error) {
    await reportServerError(error, { route: "feedback.create" });
    return c.json({ error: "Kunde inte registrera feedback." }, 400);
  }
});

app.post("/api/privacy/preferences", async (c) => {
  try {
    const input = preferencesSchema.parse(await c.req.json());
    const user = await getSessionUser(c);
    const prisma = getPrismaClient();

    setAnalyticsConsentCookie(c, input.analyticsConsent);

    if (prisma) {
      await prisma.privacyConsentEvent.create({
        data: {
          userId: user?.id,
          locale: input.locale === "en" ? "en-GB" : "sv-SE",
          policyVersion: "2026-03",
          acceptedTerms: true,
          acceptedPrivacy: true,
          marketingConsent: input.marketingConsent,
          analyticsConsent: input.analyticsConsent,
          personalizationConsent: input.personalizationConsent,
        },
      });

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            marketingConsent: input.marketingConsent,
            preferredLanguage: input.locale,
            locale: input.locale === "en" ? "en-GB" : "sv-SE",
            privacyConsentAt: new Date(),
          },
        });
      }
    }

    return c.json({ message: "Dina val är uppdaterade." });
  } catch (error) {
    await reportServerError(error, { route: "privacy.preferences" });
    return c.json({ error: "Kunde inte uppdatera dina val." }, 400);
  }
});

app.post("/api/privacy/request", async (c) => {
  try {
    const input = privacyRequestSchema.parse(await c.req.json());
    const prisma = getPrismaClient();
    const user = await getSessionUser(c);

    if (!prisma) {
      return c.json({ error: "Databasanslutning saknas för den här typen av begäran." }, 503);
    }

    await prisma.privacyRequest.create({
      data: {
        userId: user?.id,
        email: input.email,
        requestKind: input.requestKind,
        locale: input.locale === "en" ? "en-GB" : "sv-SE",
        details: input.details,
      },
    });

    return c.json({ message: "Din begäran är registrerad och ligger nu i kö för uppföljning." }, 201);
  } catch (error) {
    await reportServerError(error, { route: "privacy.request" });
    return c.json({ error: "Kunde inte skapa begäran." }, 400);
  }
});

app.get("/api/watchdog/authorities", async (c) => c.json({ items: await getWatchdogAuthorities() }));
app.get("/api/watchdog/people", async (c) => c.json({ items: await getWatchdogPeople() }));
app.get("/api/watchdog/snapshot", async (c) => c.json({ snapshot: await getWatchdogSnapshot() }));
app.get("/api/watchdog/profiles/:id", async (c) => {
  const profile = await getWatchdogProfile(c.req.param("id"));

  if (!profile) {
    return c.json({ error: "Profilen hittades inte." }, 404);
  }

  return c.json(profile);
});

app.get("/api/watchdog/feed", async (c) => {
  const { searchParams } = new URL(c.req.url);
  const limit = Number(searchParams.get("limit") || "24");
  const items = await getWatchdogPublicFeed(Number.isFinite(limit) ? limit : 24);
  return c.json({ items, updatedAt: new Date().toISOString() });
});

app.get("/api/watchdog/profiles/:id/feed", async (c) => {
  const prisma = getPrismaClient();
  if (!prisma) {
    return c.json({ items: [] });
  }

  const items = await prisma.publicRecord.findMany({
    where: { officialId: c.req.param("id") },
    orderBy: [{ publishedAt: "desc" }],
    take: 20,
  });

  return c.json({ items, updatedAt: new Date().toISOString() });
});

app.post("/api/admin/watchdog/import", async (c) => {
  const user = await getSessionUser(c);
  if (!user || !requireRole(user, ["ADMIN", "ANALYST"])) {
    return c.json({ error: "Behörighet saknas." }, 403);
  }

  const payload = await c.req.json();
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const result = await importWatchdogRows(rows);
  return c.json(result);
});

app.post("/api/admin/watchdog/ingest-cron", async (c) => {
  const cronSecret = process.env.CRON_SECRET;
  const provided = c.req.header("x-cron-secret");

  if (!cronSecret || provided !== cronSecret) {
    return c.json({ error: "Behörighet saknas." }, 403);
  }

  try {
    const result = await runConfiguredWatchdogIngestion();
    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingestion misslyckades.";
    return c.json({ error: message }, 500);
  }
});

app.get("/api/admin/watchdog/ingest-status", async (c) => {
  const user = await getSessionUser(c);
  if (!user || !requireRole(user, ["ADMIN", "ANALYST"])) {
    return c.json({ error: "Behörighet saknas." }, 403);
  }

  const [runs, connectors, reviewQueue] = await Promise.all([
    getIngestRunHistory(30),
    Promise.resolve(listWatchdogConnectors()),
    getIngestReviewQueue(20),
  ]);

  return c.json({ runs, connectors, reviewQueue, updatedAt: new Date().toISOString() });
});

app.post("/api/admin/watchdog/ingest-run", async (c) => {
  const user = await getSessionUser(c);
  if (!user || !requireRole(user, ["ADMIN", "ANALYST"])) {
    return c.json({ error: "Behörighet saknas." }, 403);
  }

  const payload = await c.req.json().catch(() => ({}));
  const connectorKeys = Array.isArray(payload.connectorKeys)
    ? payload.connectorKeys.filter((key: unknown) => typeof key === "string")
    : undefined;

  try {
    const result = await runWatchdogOrchestrator({
      connectorKeys,
      riksdagTravelFromYear: typeof payload.travelFromYear === "number" ? payload.travelFromYear : undefined,
      riksdagTravelToYear: typeof payload.travelToYear === "number" ? payload.travelToYear : undefined,
    });
    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingestion misslyckades.";
    return c.json({ error: message }, 500);
  }
});

app.post("/api/admin/watchdog/backfill", async (c) => {
  const user = await getSessionUser(c);
  if (!user || !requireRole(user, ["ADMIN", "ANALYST"])) {
    return c.json({ error: "Behörighet saknas." }, 403);
  }

  const { searchParams } = new URL(c.req.url);
  const fromYear = Number(searchParams.get("fromYear") || process.env.RIKSDAG_TRAVEL_FROM_YEAR || "2018");

  try {
    const result = await runWatchdogBackfill(Number.isFinite(fromYear) ? fromYear : 2018);
    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backfill misslyckades.";
    return c.json({ error: message }, 500);
  }
});

app.post("/api/admin/watchdog/review/:id/approve", async (c) => {
  const user = await getSessionUser(c);
  if (!user || !requireRole(user, ["ADMIN", "ANALYST"])) {
    return c.json({ error: "Behörighet saknas." }, 403);
  }

  const prisma = getPrismaClient();
  if (!prisma) return c.json({ error: "DATABASE_URL saknas." }, 500);

  try {
    const result = await approveIngestReviewItem(prisma, c.req.param("id"));
    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Godkännande misslyckades.";
    return c.json({ error: message }, 500);
  }
});

app.post("/api/admin/watchdog/review/:id/reject", async (c) => {
  const user = await getSessionUser(c);
  if (!user || !requireRole(user, ["ADMIN", "ANALYST"])) {
    return c.json({ error: "Behörighet saknas." }, 403);
  }

  const prisma = getPrismaClient();
  if (!prisma) return c.json({ error: "DATABASE_URL saknas." }, 500);

  try {
    const result = await rejectIngestReviewItem(prisma, c.req.param("id"));
    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Avvisning misslyckades.";
    return c.json({ error: message }, 500);
  }
});

app.get("/api/insights/leaderboard", async (c) => {
  const { searchParams } = new URL(c.req.url);
  const items = await getLeaderboard(searchParams.get("window") || undefined, searchParams.get("country") || "SE");
  return c.json({ items, updatedAt: new Date().toISOString() });
});

app.get("/api/insights/dashboard", async (c) => {
  const { searchParams } = new URL(c.req.url);
  const filters = parsePublicFilters(searchParams);
  const items = await getDashboardSnapshot(filters);
  return c.json({ filters, items, updatedAt: new Date().toISOString() });
});

app.get("/api/insights/scorecards", async (c) => {
  const { searchParams } = new URL(c.req.url);
  const filters = parsePublicFilters(searchParams);
  const items = await getAuthorityScorecards(filters);
  return c.json({ filters, items, updatedAt: new Date().toISOString() });
});

app.get("/api/byrakrati-bombaren/catalog", async (c) => c.json({ catalog: await getMassAppealCatalogAsync() }));

app.get("/api/byrakrati-bombaren/automated-appeal", async (c) => {
  const items = await listAutomatedAppealJobs();
  return c.json({ items });
});

app.post("/api/byrakrati-bombaren/automated-appeal", async (c) => {
  try {
    const payload = await c.req.json();
    const user = await getSessionUser(c);
    const item = await createAutomatedAppealJob(payload, {
      userId: user?.id,
      email: user?.email,
      subscriptionTier: user?.subscriptionTier,
      fingerprintSource: getFingerprintSource(c.req.raw),
      ipAddress: readIpAddress(c.req.raw),
    });
    return c.json(item, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunde inte skapa överklagandebunten.";
    return c.json({ error: message }, 400);
  }
});

app.post("/api/byrakrati-bombaren/preview", async (c) => {
  try {
    const body = await c.req.json();
    const senderEmail = typeof body?.senderEmail === "string" ? body.senderEmail : undefined;
    const preview = previewMassAppeal(body, getActorKey(c.req.raw, senderEmail));
    return c.json(preview);
  } catch (error) {
    const apiError = toApiError(error);
    return jsonError(apiError.message, apiError.status);
  }
});

app.post("/api/byrakrati-bombaren/send", async (c) => {
  try {
    const body = await c.req.json();
    const senderEmail = typeof body?.senderEmail === "string" ? body.senderEmail : undefined;
    const user = await getSessionUser(c);
    const batch = await sendMassAppeal(body, {
      actorKey: getActorKey(c.req.raw, senderEmail),
      ipAddress: readIpAddress(c.req.raw),
      user: user
        ? {
            id: user.id,
            email: user.email,
            subscriptionTier: user.subscriptionTier,
          }
        : null,
    });
    return c.json(batch);
  } catch (error) {
    const apiError = toApiError(error);
    return jsonError(apiError.message, apiError.status);
  }
});

app.get("/api/byrakrati-bombaren/batches", async (c) => {
  const user = await getSessionUser(c);
  const senderEmail = new URL(c.req.url).searchParams.get("senderEmail")?.trim().toLowerCase();
  const batches = await listRecentMassAppealBatches({
    userId: user?.id,
    senderEmail: user ? undefined : senderEmail,
  });

  return c.json({ batches });
});

app.get("/api/myndighetsgranskaren/reports", async (c) => c.json({ items: await listAuthorityFailureReports() }));

app.get("/api/myndighetsgranskaren/reports/:id", async (c) => {
  const item = await getAuthorityFailureReportById(c.req.param("id"));
  if (!item) {
    return c.json({ error: "Ärendet hittades inte." }, 404);
  }

  return c.json({ item });
});

app.post("/api/myndighetsgranskaren/reports", async (c) => {
  try {
    const payload = await c.req.json();
    const user = await getSessionUser(c);
    const item = await createAuthorityFailureReport(payload, {
      userId: user?.id,
      email: user?.email,
      subscriptionTier: user?.subscriptionTier,
      ipAddress: readIpAddress(c.req.raw),
      fingerprintSource: getFingerprintSource(c.req.raw),
    });
    return c.json(item, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunde inte skapa granskningsärendet.";
    return c.json({ error: message }, 400);
  }
});

app.get("/api/folkets-domstol/board", async (c) => c.json({ items: await getConfidenceBoard() }));

app.post("/api/folkets-domstol/vote", async (c) => {
  try {
    const payload = await c.req.json();
    const user = await getSessionUser(c);
    const result = await submitConfidenceVote(payload, {
      userId: user?.id,
      email: user?.email,
      subscriptionTier: user?.subscriptionTier,
      fingerprintSource: getFingerprintSource(c.req.raw),
    });
    return c.json(result, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunde inte registrera rösten.";
    return c.json({ error: message }, 400);
  }
});

app.post("/api/folkets-domstol/testimonials", async (c) => {
  try {
    const payload = await c.req.json();
    const result = await submitConfidenceTestimonial(payload, {
      fingerprintSource: getFingerprintSource(c.req.raw),
    });
    return c.json(result, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunde inte spara vittnesmålet.";
    return c.json({ error: message }, 400);
  }
});

app.get("/api/statens-svagheter/pages", async (c) => c.json({ items: await listWikiPages() }));

app.get("/api/statens-svagheter/pages/:slug", async (c) => {
  const page = await getWikiPageBySlug(c.req.param("slug"));
  if (!page) {
    return c.json({ error: "Artikeln hittades inte." }, 404);
  }

  return c.json({ page });
});

app.post("/api/statens-svagheter/pages", async (c) => {
  try {
    const payload = await c.req.json();
    const user = await getSessionUser(c);
    const result = await createWikiDraft(payload, {
      userId: user?.id,
      email: user?.email,
      subscriptionTier: user?.subscriptionTier,
    });
    return c.json(result, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunde inte skapa wikiutkastet.";
    return c.json({ error: message }, 400);
  }
});

app.post("/api/statens-svagheter/vote", async (c) => {
  try {
    const payload = await c.req.json();
    const user = await getSessionUser(c);
    const value = payload?.value === -1 ? -1 : 1;
    const pageId = typeof payload?.pageId === "string" ? payload.pageId : "";

    if (!pageId) {
      return c.json({ error: "pageId krävs." }, 400);
    }

    const result = await submitWikiVote({
      pageId,
      value,
      userId: user?.id,
      fingerprintSource: getFingerprintSource(c.req.raw),
    });
    return c.json(result, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunde inte registrera rösten.";
    return c.json({ error: message }, 400);
  }
});

app.get("/api/statens-svagheter/categories", async (c) => c.json(await listWikiCategories()));

app.get("/api/reverse-surveillance/submissions", async (c) => c.json({ items: await listReverseSurveillance() }));

app.get("/api/reverse-surveillance/submissions/:id", async (c) => {
  const item = await getReverseSurveillanceById(c.req.param("id"));
  if (!item) {
    return c.json({ error: "Videospåret hittades inte." }, 404);
  }

  return c.json({ item });
});

app.post("/api/uploads/evidence", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body.file;

    if (!file || typeof file === "string") {
      return c.json({ error: "Fil saknas." }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "application/octet-stream";
    const stored = await storeEvidenceFile(file.name, buffer, mimeType);
    const extractedText = (await extractDocumentText(buffer, mimeType, file.name)).slice(0, 5000) || undefined;
    return c.json({ ...stored, extractedText }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Uppladdning misslyckades.";
    return c.json({ error: message }, 400);
  }
});

app.post("/api/uploads/extract-text", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body.file;

    if (!file || typeof file === "string") {
      return c.json({ error: "Fil saknas." }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "application/octet-stream";
    const text = await extractDocumentText(buffer, mimeType, file.name);

    if (!text) {
      return c.json({ error: "Kunde inte extrahera text från filen." }, 422);
    }

    return c.json({ text: text.slice(0, 12000) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Textextraktion misslyckades.";
    return c.json({ error: message }, 400);
  }
});

app.get("/api/evidence/:assetId/stream", async (c) => {
  const prisma = getPrismaClient();
  if (!prisma) {
    return c.json({ error: "Databas saknas." }, 503);
  }

  const asset = await prisma.evidenceAsset.findUnique({
    where: { id: c.req.param("assetId") },
  });

  if (!asset || !asset.storageKey.startsWith("file://")) {
    return c.json({ error: "Filen hittades inte." }, 404);
  }

  const { readFile } = await import("node:fs/promises");
  const buffer = await readFile(asset.storageKey.slice("file://".length));
  return new Response(buffer, {
    headers: {
      "Content-Type": asset.mimeType,
      "Cache-Control": "private, max-age=300",
    },
  });
});

app.get("/api/evidence/:assetId/access", async (c) => {
  const prisma = getPrismaClient();
  if (!prisma) {
    return c.json({ error: "Databas saknas." }, 503);
  }

  const asset = await prisma.evidenceAsset.findUnique({
    where: { id: c.req.param("assetId") },
  });

  if (!asset) {
    return c.json({ error: "Filen hittades inte." }, 404);
  }

  const signedUrl = await resolveEvidenceAccessUrl(asset.storageKey);
  const url = signedUrl || (asset.storageKey.startsWith("file://") ? `/api/evidence/${asset.id}/stream` : null);

  if (!url) {
    return c.json({ error: "Uppspelnings-URL saknas." }, 404);
  }

  return c.json({ url, mimeType: asset.mimeType, fileName: asset.fileName });
});

app.post("/api/reverse-surveillance/submissions", async (c) => {
  try {
    const payload = await c.req.json();
    const item = await createReverseSurveillanceSubmission(payload, {
      fingerprintSource: getFingerprintSource(c.req.raw),
      ipAddress: readIpAddress(c.req.raw),
    });
    return c.json(item, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunde inte skapa videosubmission.";
    return c.json({ error: message }, 400);
  }
});

app.post("/api/skatteplanering/analyze", async (c) => {
  const payload = await c.req.json();
  const income = toNumber(payload?.income);
  const assets = toNumber(payload?.assets);
  const notes = typeof payload?.notes === "string" ? payload.notes.slice(0, 4000) : "";

  if (!Number.isFinite(income) || income < 0 || !Number.isFinite(assets) || assets < 0) {
    return c.json({ error: "Inkomst och tillgångar måste vara giltiga positiva tal." }, 400);
  }

  const sessionUser = await getSessionUser(c);
  const prisma = getPrismaClient();
  let jobId: string | null = null;

  if (prisma) {
    const job = await prisma.aiAnalysisJob.create({
      data: {
        userId: sessionUser?.id,
        featureKey: "tax.optimize",
        locale: "sv-SE",
        countryCode: "SE",
        status: "RUNNING",
        startedAt: new Date(),
        input: {
          income,
          assets,
          notes,
        },
      },
      select: { id: true },
    });
    jobId = job.id;
  }

  try {
    const result = await requestTaxOptimization({
      income,
      assets,
      notes,
      locale: "sv-SE",
      countryCode: "SE",
    });

    if (prisma && jobId) {
      await prisma.aiAnalysisJob.update({
        where: { id: jobId },
        data: {
          status: "SUCCEEDED",
          finishedAt: new Date(),
          output: result,
        },
      });
    }

    return c.json({ ...result, analysisId: jobId });
  } catch (error) {
    if (prisma && jobId) {
      await prisma.aiAnalysisJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          finishedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : "Okänt AI-fel.",
        },
      });
    }

    const message = error instanceof Error ? error.message : "Kunde inte analysera skatteoptimering.";
    return c.json({ error: message }, 502);
  }
});

app.get("/api/konto/overview", async (c) => {
  const user = await getSessionUser(c);
  if (!user) {
    return c.json({ error: "Inloggning krävs." }, 401);
  }

  return c.json(await getAccountOverview(user.id));
});

app.get("/api/konto/notifications", async (c) => {
  const user = await getSessionUser(c);
  if (!user) {
    return c.json({ error: "Inloggning krävs." }, 401);
  }

  return c.json({ items: await listAccountNotifications(user.id) });
});

app.get("/api/konto/tax-analyses", async (c) => {
  const user = await getSessionUser(c);
  if (!user) {
    return c.json({ error: "Inloggning krävs." }, 401);
  }

  return c.json({ items: await listTaxAnalyses(user.id) });
});

app.get("/api/konto/watches", async (c) => {
  const user = await getSessionUser(c);
  if (!user) {
    return c.json({ error: "Inloggning krävs." }, 401);
  }

  return c.json({ items: await listUserWatches(user.id) });
});

app.post("/api/konto/watches", async (c) => {
  const user = await getSessionUser(c);
  if (!user) {
    return c.json({ error: "Inloggning krävs." }, 401);
  }

  const payload = await c.req.json();
  const watch = await upsertUserWatch({
    userId: user.id,
    authorityId: String(payload.authorityId),
    officialId: typeof payload.officialId === "string" ? payload.officialId : null,
    cadence: payload.cadence || "DAILY",
    alertsEnabled: payload.alertsEnabled ?? true,
  });

  return c.json({ watch }, 201);
});

app.delete("/api/konto/watches/:id", async (c) => {
  const user = await getSessionUser(c);
  if (!user) {
    return c.json({ error: "Inloggning krävs." }, 401);
  }

  await deleteUserWatch(user.id, c.req.param("id"));
  return c.json({ ok: true });
});

app.get("/api/skatteplanering/result/:id", async (c) => {
  const result = await getTaxAnalysisById(c.req.param("id"));
  if (!result) {
    return c.json({ error: "Analysen hittades inte." }, 404);
  }

  return c.json(result);
});

app.post("/api/payments/checkout", async (c) => {
  try {
    const user = await getSessionUser(c);

    if (!user) {
      return c.json({ error: "Autentisering krävs för att starta betalning." }, 401);
    }

    const input = checkoutSchema.parse(await c.req.json());
    const paymentMethod = getPaymentMethodConfig(input.paymentMethod);
    const purchase = getPurchaseConfig(input.purchaseKey);
    const prisma = getPrismaClient();

    if (!paymentMethod || !purchase) {
      return c.json({ error: "Ogiltig betalningskonfiguration." }, 400);
    }

    const finalAmountSek = calculateDiscountedAmount(purchase.amountSek, paymentMethod.discountPercent);

    if (paymentMethod.usesStripeCheckout) {
      const stripePriceId = process.env[purchase.stripePriceEnvKey];

      if (!stripePriceId) {
        return c.json({ error: `Stripe price id saknas för ${purchase.label}. Lägg till ${purchase.stripePriceEnvKey}.` }, 503);
      }

      const result = await startStripeCheckout({
        user,
        purchaseKey: input.purchaseKey,
        paymentMethod: input.paymentMethod,
        stripePriceId,
      });

      return c.json(result);
    }

    if (!prisma) {
      return c.json({ error: "Databasanslutning saknas för manuella betalningsflöden." }, 503);
    }

    const paymentRequest = await prisma.paymentRequest.create({
      data: {
        userId: user.id,
        email: user.email,
        method: input.paymentMethod,
        flowType: purchase.flowType,
        amountSek: purchase.amountSek,
        discountPercent: paymentMethod.discountPercent,
        finalAmountSek,
        itemLabel: purchase.label,
        metadata: {
          purchaseKey: input.purchaseKey,
          authProvider: user.authProvider,
          note: paymentMethod.id === "CASH" ? "50% rabatt för kontantflöde med manuell verifiering." : "25% rabatt för kryptoflöde med manuell verifiering.",
        },
      },
    });

    await recordAuditEvent({
      userId: user.id,
      actorLabel: user.email,
      action: "payment.request.created",
      targetType: "PaymentRequest",
      targetId: paymentRequest.id,
      metadata: {
        purchaseKey: input.purchaseKey,
        paymentMethod: input.paymentMethod,
        finalAmountSek,
      },
    });

    return c.json({
      message: `Betalningsförfrågan skapad. Slutpris: ${finalAmountSek} kr efter ${paymentMethod.discountPercent}% rabatt.`,
      requestId: paymentRequest.id,
    });
  } catch (error) {
    await reportServerError(error, { route: "payments.checkout" });
    return c.json({ error: error instanceof Error ? error.message : "Kunde inte starta betalning." }, 400);
  }
});

app.post("/api/stripe/create-checkout-session", async (c) => {
  const user = await getSessionUser(c);

  if (!user) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const { priceId } = await c.req.json();

  if (!priceId) {
    return c.json({ error: "Missing priceId" }, 400);
  }

  try {
    const purchaseKey = findPurchaseKeyByStripePriceId(priceId);
    const purchase = purchaseKey ? getPurchaseConfig(purchaseKey) : null;
    const paymentMethod = getPaymentMethodConfig("CARD");

    if (!purchaseKey || !purchase || !paymentMethod) {
      return c.json({ error: "Unknown or unconfigured Stripe price" }, 400);
    }

    const result = await startStripeCheckout({
      user,
      purchaseKey,
      paymentMethod: "CARD",
      stripePriceId: priceId,
    });

    return c.json(result);
  } catch (error) {
    return c.json({ error: "Stripe error", detail: String(error) }, 500);
  }
});

app.post("/api/stripe/webhook", async (c) => {
  const signature = c.req.header("stripe-signature");

  if (!signature) {
    return c.json({ error: "Stripe-signatur saknas." }, 400);
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return c.json({ error: "STRIPE_WEBHOOK_SECRET saknas." }, 503);
  }

  const body = await c.req.raw.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "Ogiltig Stripe-signatur." }, 400);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await handleCheckoutCompleted(event, event.data.object as Stripe.Checkout.Session);
        break;
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed":
        await handleCheckoutExpired(event, event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.deleted":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event, event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }

    return c.json({ received: true });
  } catch (error) {
    await reportServerError(error, {
      route: "stripe.webhook",
      eventId: event.id,
      eventType: event.type,
    });

    return c.json({ error: "Kunde inte behandla Stripe-webhooken." }, 500);
  }
});

app.get("/api/admin/overview", async (c) => {
  const user = await getSessionUser(c);

  if (!user || !requireRole(user, ["ADMIN"])) {
    return c.json({ error: "Behörighet saknas." }, 403);
  }

  const prisma = getPrismaClient();
  const [counts, legalQueue, moderationQueue, paymentsQueue, privacyQueue, feedbackQueue] = prisma
    ? await Promise.all([
        Promise.all([
          prisma.user.count(),
          prisma.reviewQueueItem.count({ where: { moderationDecision: "PENDING" } }),
          prisma.legalReview.count({ where: { status: "PENDING" } }),
          prisma.paymentRequest.count({ where: { status: { in: ["PENDING_REVIEW", "AWAITING_PAYMENT"] } } }),
          prisma.privacyRequest.count({ where: { status: { in: ["PENDING", "IN_REVIEW"] } } }),
          prisma.apiConsumer.count(),
        ]),
        prisma.legalReview.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { report: { select: { title: true } } },
        }),
        prisma.reviewQueueItem.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, targetType: true, status: true, moderationDecision: true, legalDecision: true, createdAt: true },
        }),
        prisma.paymentRequest.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, email: true, method: true, status: true, finalAmountSek: true, itemLabel: true, createdAt: true },
        }),
        prisma.privacyRequest.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, email: true, requestKind: true, status: true, createdAt: true },
        }),
        prisma.betaFeedback.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, category: true, rating: true, status: true, createdAt: true },
        }),
      ])
    : [[0, 0, 0, 0, 0, 0], [], [], [], [], []];

  return c.json({
    user,
    counts: {
      users: counts[0],
      moderation: counts[1],
      legal: counts[2],
      payments: counts[3],
      privacy: counts[4],
      apiConsumers: counts[5],
    },
    legalQueue,
    moderationQueue,
    paymentsQueue,
    privacyQueue,
    feedbackQueue,
    databaseReady: Boolean(prisma),
  });
});

app.patch("/api/admin/review/:id", async (c) => {
  const user = await getSessionUser(c);
  if (!user || !requireRole(user, ["ADMIN", "ANALYST"])) {
    return c.json({ error: "Behörighet saknas." }, 403);
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    return c.json({ error: "Databasanslutning saknas." }, 503);
  }

  const payload = await c.req.json();
  const decision = payload.decision === "APPROVED" ? "APPROVED" : payload.decision === "REJECTED" ? "REJECTED" : "PENDING";

  const item = await prisma.reviewQueueItem.update({
    where: { id: c.req.param("id") },
    data: {
      moderationDecision: decision,
      status: decision === "APPROVED" ? "PUBLISHED" : decision === "REJECTED" ? "REJECTED" : "MODERATION",
    },
  });

  return c.json({ item });
});

app.patch("/api/admin/payments/:id", async (c) => {
  const user = await getSessionUser(c);

  if (!user || !requireRole(user, ["ADMIN"])) {
    return c.json({ error: "Behörighet saknas." }, 403);
  }

  try {
    const id = c.req.param("id");
    const input = updatePaymentSchema.parse(await c.req.json());

    const metadata = input.settlementReference ? { settlementReference: input.settlementReference } : undefined;

    const updated = input.action === "mark_paid"
      ? await markPaymentRequestPaid(id, {
          provider: "admin",
          note: input.note,
          metadata,
        })
      : await setPaymentRequestStatus(
          id,
          input.action === "mark_rejected"
            ? PaymentRequestStatus.REJECTED
            : input.action === "mark_expired"
              ? PaymentRequestStatus.EXPIRED
              : PaymentRequestStatus.AWAITING_PAYMENT,
          {
            provider: "admin",
            note: input.note,
            metadata,
          },
        );

    await recordAuditEvent({
      userId: user.id,
      actorLabel: user.email,
      action: `payment.request.${input.action}`,
      targetType: "PaymentRequest",
      targetId: id,
      metadata: {
        settlementReference: input.settlementReference,
      },
    });

    return c.json({ paymentRequest: updated });
  } catch (error) {
    await reportServerError(error, { route: "admin.payments.update" });
    return c.json({ error: error instanceof Error ? error.message : "Kunde inte uppdatera betalningsärendet." }, 400);
  }
});

app.get("/api/public/press-feed", async (c) => {
  const items = await listPressFeed(30);
  return c.json({ items, updatedAt: new Date().toISOString() });
});

app.get("/api/public/access-tiers", (c) => c.json({
  items: [
    {
      tier: "public",
      monthlyPriceSek: 0,
      scopes: ["leaderboard:read", "dashboard:read", "scorecards:read"],
      notes: "Anonymiserad och aggregerad data med standard rate limit.",
    },
    {
      tier: "premium",
      monthlyPriceSek: 1490,
      scopes: ["leaderboard:read", "dashboard:read", "scorecards:read", "bulk:export", "partner:integration"],
      notes: "Kräver kommersiell registrering och separat onboarding för tyngre dataflöden.",
    },
  ],
}));

app.get("/api/public/openapi", (c) => c.json(getPublicApiSpec(getFrontendBaseUrl())));

app.get("/api/public/leaderboard", async (c) => {
  const auth = await requirePublicApiAccess(c.req.raw, "leaderboard:read", "public:leaderboard");

  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  const { searchParams } = new URL(c.req.url);
  const items = await getLeaderboard(searchParams.get("window") || undefined, searchParams.get("country") || "SE");
  return c.json({ items, updatedAt: new Date().toISOString() });
});

app.get("/api/public/dashboard", async (c) => {
  const auth = await requirePublicApiAccess(c.req.raw, "dashboard:read", "public:dashboard");

  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  const { searchParams } = new URL(c.req.url);
  const filters = parsePublicFilters(searchParams);
  const items = await getDashboardSnapshot(filters);
  return c.json({ filters, items, updatedAt: new Date().toISOString() });
});

app.get("/api/public/scorecards", async (c) => {
  const auth = await requirePublicApiAccess(c.req.raw, "scorecards:read", "public:scorecards");

  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  const { searchParams } = new URL(c.req.url);
  const filters = parsePublicFilters(searchParams);
  const items = await getAuthorityScorecards(filters);
  return c.json({ filters, items, updatedAt: new Date().toISOString() });
});

app.post("/api/public/register", async (c) => {
  const payload = await c.req.json();
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const email = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : "";
  const scopes = Array.isArray(payload?.scopes) ? payload.scopes : undefined;
  const countryCode = typeof payload?.countryCode === "string" ? payload.countryCode.trim().toUpperCase() : undefined;

  if (!name || !email.includes("@")) {
    return c.json({ error: "Namn och giltig e-postadress krävs." }, 400);
  }

  try {
    const sessionUser = await getSessionUser(c);
    const result = await registerApiConsumer({
      name,
      email,
      scopes,
      countryCode,
      userId: sessionUser?.id,
    });

    return c.json(result, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunde inte registrera API-konsumenten.";
    return c.json({ error: message }, 500);
  }
});

app.get("/", (c) => c.json({ service: "spegeln-backend", status: "ok", backendUrl: getBackendBaseUrl() }));
app.notFound(() => jsonError("Hittades inte.", 404));

const port = Number(process.env.PORT || 4000);

serve({
  fetch: app.fetch,
  port,
});