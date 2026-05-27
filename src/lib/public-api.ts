import { createHash, randomBytes } from "node:crypto";
import type { ApiConsumerStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/prisma";
import { getCurrentRateWindow } from "@/lib/public-insights";

const DEFAULT_SCOPES = ["leaderboard:read", "dashboard:read", "scorecards:read"] as const;

export type PublicApiScope = (typeof DEFAULT_SCOPES)[number];

export function createApiKey() {
  return `spgl_live_${randomBytes(24).toString("hex")}`;
}

export function hashApiKey(rawKey: string) {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function sanitizeScopes(scopes: string[] | undefined) {
  if (!scopes || scopes.length === 0) {
    return [...DEFAULT_SCOPES];
  }

  return scopes.filter((scope): scope is PublicApiScope => DEFAULT_SCOPES.includes(scope as PublicApiScope));
}

export async function registerApiConsumer(input: {
  name: string;
  email: string;
  scopes?: string[];
  userId?: string;
  countryCode?: string;
}) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new Error("DATABASE_URL saknas. Publika API-nycklar kräver databaspersistens.");
  }

  const apiKey = createApiKey();
  const hashedKey = hashApiKey(apiKey);
  const scopes = sanitizeScopes(input.scopes);

  const consumer = await prisma.apiConsumer.create({
    data: {
      name: input.name,
      email: input.email,
      userId: input.userId,
      countryCode: input.countryCode || "SE",
      hashedKey,
      scopes,
    },
    select: {
      id: true,
      name: true,
      email: true,
      scopes: true,
      rateLimitPerHour: true,
      countryCode: true,
      createdAt: true,
    },
  });

  return {
    consumer,
    apiKey,
  };
}

function extractApiKey(request: NextRequest) {
  const headerKey = request.headers.get("x-api-key");
  if (headerKey) {
    return headerKey;
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length);
}

export async function requirePublicApiAccess(request: NextRequest, scope: PublicApiScope, routeKey: string) {
  const rawApiKey = extractApiKey(request);
  if (!rawApiKey) {
    return { response: NextResponse.json({ error: "API key krävs." }, { status: 401 }) };
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    return { response: NextResponse.json({ error: "Publika API:t är inte tillgängligt utan databasanslutning." }, { status: 503 }) };
  }

  const consumer = await prisma.apiConsumer.findUnique({
    where: { hashedKey: hashApiKey(rawApiKey) },
    select: {
      id: true,
      scopes: true,
      status: true,
      rateLimitPerHour: true,
    },
  });

  if (!consumer || consumer.status !== ("ACTIVE" satisfies ApiConsumerStatus)) {
    return { response: NextResponse.json({ error: "Ogiltig eller spärrad API-nyckel." }, { status: 403 }) };
  }

  if (!consumer.scopes.includes(scope)) {
    return { response: NextResponse.json({ error: "API-nyckeln saknar rätt scope." }, { status: 403 }) };
  }

  const windowStart = getCurrentRateWindow();
  const existing = await prisma.apiRequestStat.findUnique({
    where: {
      consumerId_routeKey_windowStart: {
        consumerId: consumer.id,
        routeKey,
        windowStart,
      },
    },
    select: {
      id: true,
      requestCount: true,
    },
  });

  if (existing && existing.requestCount >= consumer.rateLimitPerHour) {
    return { response: NextResponse.json({ error: "Rate limit uppnådd för aktuell timme." }, { status: 429 }) };
  }

  await prisma.$transaction([
    prisma.apiRequestStat.upsert({
      where: {
        consumerId_routeKey_windowStart: {
          consumerId: consumer.id,
          routeKey,
          windowStart,
        },
      },
      update: {
        requestCount: { increment: 1 },
        lastRequestAt: new Date(),
      },
      create: {
        consumerId: consumer.id,
        routeKey,
        windowStart,
        requestCount: 1,
      },
    }),
    prisma.apiConsumer.update({
      where: { id: consumer.id },
      data: { lastUsedAt: new Date() },
    }),
  ]);

  return {
    consumer,
    response: null,
  };
}

export function getPublicApiSpec(baseUrl: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "Spegeln Public API",
      version: "1.0.0",
      description:
        "Anonymiserade och aggregerade data för leaderboard, dashboards och myndighetsscorecards. Premium-access för bulkdata och integrationer granskas separat.",
    },
    servers: [{ url: `${baseUrl}/api/public` }],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
        },
      },
      schemas: {
        LeaderboardEntry: {
          type: "object",
          properties: {
            rank: { type: "integer" },
            alias: { type: "string" },
            score: { type: "integer" },
            complaintsWithResponse: { type: "integer" },
            investigationsReported: { type: "integer" },
            peerEndorsements: { type: "integer" },
            upvotes: { type: "integer" },
          },
        },
        DashboardItem: {
          type: "object",
          properties: {
            authorityId: { type: "string" },
            authorityName: { type: "string" },
            category: { type: "string" },
            regionCode: { type: ["string", "null"] },
            countryCode: { type: "string" },
            complaints: { type: "integer" },
            investigations: { type: "integer" },
            reports: { type: "integer" },
            attentionScore: { type: "integer" },
            resolutionRate: { type: "number" },
          },
        },
        ApiAccessTier: {
          type: "object",
          properties: {
            tier: { type: "string" },
            monthlyPriceSek: { type: "integer" },
            scopes: { type: "array", items: { type: "string" } },
            notes: { type: "string" },
          },
        },
      },
    },
    security: [{ ApiKeyAuth: [] }],
    paths: {
      "/register": {
        post: {
          summary: "Registrera en publik API-konsument",
          description: "Standardregistrering för anonymiserade endpoints. Premium-access och bulkdata öppnar tyngre flöden för redaktioner, partnerpaneler och egna verktyg.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email"],
                  properties: {
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    scopes: { type: "array", items: { type: "string" } },
                    countryCode: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "API key created" },
          },
        },
      },
      "/leaderboard": {
        get: {
          summary: "Hämta pseudonymiserad leaderboard",
          parameters: [
            { name: "window", in: "query", schema: { type: "string", enum: ["weekly", "monthly", "all-time"] } },
            { name: "country", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "Leaderboard rows",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      items: { type: "array", items: { $ref: "#/components/schemas/LeaderboardEntry" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/dashboard": {
        get: {
          summary: "Hämta realtidsaggregerad myndighetsdashboard",
          parameters: [
            { name: "country", in: "query", schema: { type: "string" } },
            { name: "region", in: "query", schema: { type: "string" } },
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "period", in: "query", schema: { type: "string", enum: ["7d", "30d", "90d"] } },
          ],
          responses: {
            "200": {
              description: "Dashboard rows",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      items: { type: "array", items: { $ref: "#/components/schemas/DashboardItem" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/scorecards": {
        get: {
          summary: "Hämta myndighetsscorecards med reproducerbara formler",
          parameters: [
            { name: "country", in: "query", schema: { type: "string" } },
            { name: "region", in: "query", schema: { type: "string" } },
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "period", in: "query", schema: { type: "string", enum: ["7d", "30d", "90d"] } },
          ],
          responses: {
            "200": { description: "Scorecard rows" },
          },
        },
      },
      "/access-tiers": {
        get: {
          summary: "Beskriv publika och premiumorienterade API-nivåer",
          responses: {
            "200": {
              description: "Available access tiers",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      items: {
                        type: "array",
                        items: { $ref: "#/components/schemas/ApiAccessTier" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}