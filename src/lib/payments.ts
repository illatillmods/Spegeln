import { SubscriptionTier } from "@prisma/client";

export const paymentMethodCatalog = [
  {
    id: "CARD",
    label: "Card",
    description: "Hosted Stripe checkout for subscriptions and one-off purchases.",
    discountPercent: 0,
    usesStripeCheckout: true,
  },
  {
    id: "KLARNA",
    label: "Klarna",
    description: "Hosted checkout with deferred payment where supported by Stripe.",
    discountPercent: 0,
    usesStripeCheckout: true,
  },
  {
    id: "SWISH",
    label: "Swish",
    description: "Manual payment request until a PSP-backed Swish flow is connected.",
    discountPercent: 0,
    usesStripeCheckout: false,
  },
  {
    id: "BTC",
    label: "Bitcoin",
    description: "Manual crypto settlement with direct wallet confirmation.",
    discountPercent: 25,
    usesStripeCheckout: false,
  },
  {
    id: "XMR",
    label: "Monero",
    description: "Manual discreet settlement with direct confirmation.",
    discountPercent: 25,
    usesStripeCheckout: false,
  },
  {
    id: "LTC",
    label: "Litecoin",
    description: "Manual crypto settlement with admin confirmation.",
    discountPercent: 25,
    usesStripeCheckout: false,
  },
  {
    id: "CASH",
    label: "Cash",
    description: "Offline payment workflow with manual activation.",
    discountPercent: 50,
    usesStripeCheckout: false,
  },
] as const;

export const purchaseCatalog = {
  plus_monthly: {
    label: "Plus monthly",
    amountSek: 249,
    flowType: "SUBSCRIPTION",
    stripePriceEnvKey: "STRIPE_PRICE_PLUS_MONTHLY",
  },
  pro_monthly: {
    label: "Pro monthly",
    amountSek: 990,
    flowType: "SUBSCRIPTION",
    stripePriceEnvKey: "STRIPE_PRICE_PRO_MONTHLY",
  },
  usage_mass_appeal: {
    label: "Mass appeal batch",
    amountSek: 39,
    flowType: "PAY_PER_USE",
    stripePriceEnvKey: "STRIPE_PRICE_USAGE_MASS_APPEAL",
  },
  usage_ai_analysis: {
    label: "AI analysis run",
    amountSek: 29,
    flowType: "PAY_PER_USE",
    stripePriceEnvKey: "STRIPE_PRICE_USAGE_AI_ANALYSIS",
  },
  api_partner: {
    label: "Premium API access",
    amountSek: 1490,
    flowType: "API_ACCESS",
    stripePriceEnvKey: "STRIPE_PRICE_API_PARTNER",
  },
  civic_donation: {
    label: "Public-interest donation",
    amountSek: 120,
    flowType: "DONATION",
    stripePriceEnvKey: "STRIPE_PRICE_DONATION",
  },
} as const;

export type PaymentMethodId = (typeof paymentMethodCatalog)[number]["id"];
export type PurchaseKey = keyof typeof purchaseCatalog;

export function getPaymentMethodConfig(method: string) {
  return paymentMethodCatalog.find((candidate) => candidate.id === method) || null;
}

export function getPurchaseConfig(key: string) {
  if (key in purchaseCatalog) {
    return purchaseCatalog[key as PurchaseKey];
  }

  return null;
}

export function calculateDiscountedAmount(amountSek: number, discountPercent: number) {
  return Math.max(0, Math.round((amountSek * (100 - discountPercent)) / 100));
}

export function findPurchaseKeyByStripePriceId(priceId: string): PurchaseKey | null {
  const match = Object.entries(purchaseCatalog).find(([, config]) => process.env[config.stripePriceEnvKey] === priceId);
  return match ? (match[0] as PurchaseKey) : null;
}

export function getManagedSubscriptionTierForPurchase(key: PurchaseKey | null) {
  if (key === "plus_monthly") {
    return SubscriptionTier.PLUS;
  }

  if (key === "pro_monthly") {
    return SubscriptionTier.PRO;
  }

  return null;
}

export function resolveStripePaymentTypes(method: PaymentMethodId) {
  if (method === "KLARNA") {
    return ["card", "klarna"] as const;
  }

  return ["card"] as const;
}