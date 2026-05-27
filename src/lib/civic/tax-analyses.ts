import { AiJobStatus, type Prisma } from "@prisma/client";
import type { TaxOptimizationResult } from "@/lib/ai-worker";
import { getPrismaClient } from "@/lib/prisma";

export async function saveTaxAnalysis(userId: string | undefined, input: Record<string, unknown>, result: TaxOptimizationResult) {
  const prisma = getPrismaClient();
  if (!prisma) {
    return null;
  }

  const record = await prisma.aiAnalysisJob.create({
    data: {
      userId,
      featureKey: "tax.optimize",
      status: AiJobStatus.SUCCEEDED,
      input: input as Prisma.InputJsonValue,
      output: result,
      finishedAt: new Date(),
    },
  });

  return record.id;
}

export async function getTaxAnalysisById(id: string) {
  const prisma = getPrismaClient();
  if (!prisma) {
    return null;
  }

  const record = await prisma.aiAnalysisJob.findFirst({
    where: { id, featureKey: "tax.optimize", status: AiJobStatus.SUCCEEDED },
  });

  if (!record?.output) {
    return null;
  }

  return record.output as TaxOptimizationResult;
}

export async function listTaxAnalyses(userId: string, limit = 10) {
  const prisma = getPrismaClient();
  if (!prisma) {
    return [];
  }

  const records = await prisma.aiAnalysisJob.findMany({
    where: { userId, featureKey: "tax.optimize", status: AiJobStatus.SUCCEEDED },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, createdAt: true, output: true },
  });

  return records.map((record) => ({
    id: record.id,
    createdAt: record.createdAt.toISOString(),
    result: record.output as TaxOptimizationResult,
  }));
}
