import { PaymentRequestStatus, SubscriptionTier, type Prisma } from "@prisma/client";
import { getManagedSubscriptionTierForPurchase, getPurchaseConfig, type PurchaseKey } from "@/lib/payments";
import { requirePrismaClient } from "@/lib/prisma";

type PaymentRequestMetadataPatch = {
  provider?: string;
  externalReference?: string;
  processedAt?: string;
  purchaseKey?: PurchaseKey;
  paymentMethod?: string;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  stripeLastEventId?: string;
  stripePaymentStatus?: string | null;
  stripeCheckoutStatus?: string | null;
  settlementReference?: string;
  failureReason?: string;
  note?: string;
};

function isRecord(value: Prisma.JsonValue | null | undefined): value is Prisma.JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function rankTier(tier: SubscriptionTier) {
  switch (tier) {
    case SubscriptionTier.CIVIC_LAB:
      return 3;
    case SubscriptionTier.PRO:
      return 2;
    case SubscriptionTier.PLUS:
      return 1;
    default:
      return 0;
  }
}

function appendComplianceNote(existing: string | null, note?: string) {
  const trimmedNote = note?.trim();

  if (!trimmedNote) {
    return existing ?? null;
  }

  return [existing?.trim(), trimmedNote].filter(Boolean).join("\n\n");
}

export function mergePaymentRequestMetadata(existing: Prisma.JsonValue | null | undefined, patch: PaymentRequestMetadataPatch): Prisma.InputJsonValue {
  const current = isRecord(existing) ? { ...existing } : {};

  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) {
      current[key] = value;
    }
  }

  return current;
}

export function readPurchaseKeyFromMetadata(metadata: Prisma.JsonValue | null | undefined): PurchaseKey | null {
  if (!isRecord(metadata)) {
    return null;
  }

  const rawValue = metadata.purchaseKey;

  if (typeof rawValue !== "string") {
    return null;
  }

  return getPurchaseConfig(rawValue) ? (rawValue as PurchaseKey) : null;
}

async function recalculateManagedSubscriptionTier(transaction: Prisma.TransactionClient, userId: string) {
  const [user, paymentRequests] = await Promise.all([
    transaction.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    }),
    transaction.paymentRequest.findMany({
      where: {
        userId,
        status: PaymentRequestStatus.PAID,
      },
      select: { metadata: true },
    }),
  ]);

  if (!user) {
    return;
  }

  if (user.subscriptionTier === SubscriptionTier.CIVIC_LAB) {
    return;
  }

  let nextTier: SubscriptionTier = SubscriptionTier.FREE;

  for (const request of paymentRequests) {
    const tier = getManagedSubscriptionTierForPurchase(readPurchaseKeyFromMetadata(request.metadata));

    if (tier && rankTier(tier) > rankTier(nextTier)) {
      nextTier = tier;
    }
  }

  if (user.subscriptionTier !== nextTier) {
    await transaction.user.update({
      where: { id: userId },
      data: { subscriptionTier: nextTier },
    });
  }
}

export async function markPaymentRequestPaid(
  requestId: string,
  input: {
    provider: string;
    paidAt?: Date;
    note?: string;
    metadata?: PaymentRequestMetadataPatch;
  },
) {
  const prisma = requirePrismaClient("DATABASE_URL saknas. Betalningsärenden kräver databaspersistens.");

  return prisma.$transaction(async (transaction) => {
    const request = await transaction.paymentRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        userId: true,
        status: true,
        metadata: true,
        complianceNotes: true,
        paidAt: true,
      },
    });

    if (!request) {
      throw new Error("Betalningsärendet hittades inte.");
    }

    const paidAt = input.paidAt ?? request.paidAt ?? new Date();
    const updated = await transaction.paymentRequest.update({
      where: { id: request.id },
      data: {
        status: PaymentRequestStatus.PAID,
        paidAt,
        complianceNotes: appendComplianceNote(request.complianceNotes, input.note),
        metadata: mergePaymentRequestMetadata(request.metadata, {
          provider: input.provider,
          processedAt: paidAt.toISOString(),
          ...(input.metadata || {}),
        }),
      },
      select: {
        id: true,
        status: true,
        paidAt: true,
        updatedAt: true,
        metadata: true,
      },
    });

    if (request.userId) {
      await recalculateManagedSubscriptionTier(transaction, request.userId);
    }

    return updated;
  });
}

export async function setPaymentRequestStatus(
  requestId: string,
  status: Exclude<PaymentRequestStatus, "PAID">,
  input: {
    provider: string;
    note?: string;
    metadata?: PaymentRequestMetadataPatch;
  },
) {
  const prisma = requirePrismaClient("DATABASE_URL saknas. Betalningsärenden kräver databaspersistens.");

  return prisma.$transaction(async (transaction) => {
    const request = await transaction.paymentRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        userId: true,
        metadata: true,
        complianceNotes: true,
      },
    });

    if (!request) {
      throw new Error("Betalningsärendet hittades inte.");
    }

    const updated = await transaction.paymentRequest.update({
      where: { id: request.id },
      data: {
        status,
        paidAt: null,
        complianceNotes: appendComplianceNote(request.complianceNotes, input.note),
        metadata: mergePaymentRequestMetadata(request.metadata, {
          provider: input.provider,
          processedAt: new Date().toISOString(),
          ...(input.metadata || {}),
        }),
      },
      select: {
        id: true,
        status: true,
        paidAt: true,
        updatedAt: true,
        metadata: true,
      },
    });

    if (request.userId) {
      await recalculateManagedSubscriptionTier(transaction, request.userId);
    }

    return updated;
  });
}