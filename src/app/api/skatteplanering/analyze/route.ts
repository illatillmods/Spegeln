import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { requestTaxOptimization } from "@/lib/ai-worker";
import { getPrismaClient } from "@/lib/prisma";

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : Number.NaN;
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const income = toNumber(payload?.income);
  const assets = toNumber(payload?.assets);
  const notes = typeof payload?.notes === "string" ? payload.notes.slice(0, 4000) : "";

  if (!Number.isFinite(income) || income < 0 || !Number.isFinite(assets) || assets < 0) {
    return NextResponse.json({ error: "Inkomst och tillgångar måste vara giltiga positiva tal." }, { status: 400 });
  }

  const sessionUser = await getSessionUser();
  const prisma = getPrismaClient();
  let jobId: string | null = null;

  if (prisma) {
    const job = await prisma.aiAnalysisJob.create({
      data: {
        userId: sessionUser?.id,
        featureKey: "tax-optimization",
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

    return NextResponse.json(result);
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
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
