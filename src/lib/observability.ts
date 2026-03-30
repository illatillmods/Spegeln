import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { getPrismaClient } from "@/lib/prisma";

type LogLevel = "info" | "warn" | "error";

export function getClientIpAddress(request: NextRequest | Request | null | undefined) {
  if (!request) {
    return undefined;
  }

  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || undefined;
}

export function logServerEvent(level: LogLevel, message: string, metadata?: Record<string, unknown>) {
  const payload = {
    level,
    message,
    metadata,
    timestamp: new Date().toISOString(),
  };

  const serialized = JSON.stringify(payload);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}

export async function recordAuditEvent(input: {
  userId: string;
  actorLabel: string;
  action: string;
  targetType: string;
  targetId?: string;
  ipAddress?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  const prisma = getPrismaClient();

  if (!prisma) {
    return;
  }

  try {
    await prisma.auditEvent.create({
      data: {
        userId: input.userId,
        actorLabel: input.actorLabel,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        ipAddress: input.ipAddress,
        metadata: input.metadata,
      },
    });
  } catch (error) {
    logServerEvent("warn", "Failed to persist audit event", {
      action: input.action,
      targetType: input.targetType,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function reportServerError(error: unknown, context: Record<string, unknown>) {
  logServerEvent("error", error instanceof Error ? error.message : "Unknown server error", {
    ...context,
    stack: error instanceof Error ? error.stack : undefined,
  });
}