import { NextResponse } from "next/server";
import { getDeploymentContext } from "@/lib/deployment";
import { getPrismaClient } from "@/lib/prisma";

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

export async function GET() {
  const deployment = getDeploymentContext();
  const database = await getDatabaseCheck();
  const overallStatus = database.status === "configured_but_unreachable" ? "degraded" : "ok";
  const auth = process.env.AUTH_SESSION_SECRET ? "configured" : "missing";
  const payments = process.env.STRIPE_SECRET_KEY ? "configured" : "missing";
  const aiWorker = process.env.AI_WORKER_URL ? "configured" : "missing";
  const socialAuth = process.env.GOOGLE_CLIENT_ID || process.env.GITHUB_CLIENT_ID ? "partially-configured" : "missing";

  return NextResponse.json({
    name: "Spegeln",
    status: overallStatus,
    timestamp: new Date().toISOString(),
    deployment,
    checks: {
      web: "ready",
      database,
      auth,
      payments,
      aiWorker,
      socialAuth,
      legalReviewGate: "manual approval required",
    },
  });
}