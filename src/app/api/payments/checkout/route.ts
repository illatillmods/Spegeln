import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { getAppBaseUrl } from "@/lib/deployment";
import { recordAuditEvent, reportServerError } from "@/lib/observability";
import { calculateDiscountedAmount, getPaymentMethodConfig, getPurchaseConfig, resolveStripePaymentTypes } from "@/lib/payments";
import { getPrismaClient } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";

const checkoutSchema = z.object({
  purchaseKey: z.enum(["plus_monthly", "pro_monthly", "usage_mass_appeal", "usage_ai_analysis", "api_partner", "civic_donation"]),
  paymentMethod: z.enum(["CARD", "KLARNA", "SWISH", "BTC", "XMR", "LTC", "CASH"]),
});

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Autentisering krävs för att starta betalning." }, { status: 401 });
    }

    const input = checkoutSchema.parse(await request.json());
    const paymentMethod = getPaymentMethodConfig(input.paymentMethod);
    const purchase = getPurchaseConfig(input.purchaseKey);

    if (!paymentMethod || !purchase) {
      return NextResponse.json({ error: "Ogiltig betalningskonfiguration." }, { status: 400 });
    }

    const finalAmountSek = calculateDiscountedAmount(purchase.amountSek, paymentMethod.discountPercent);

    if (paymentMethod.usesStripeCheckout) {
      const stripePriceId = process.env[purchase.stripePriceEnvKey];

      if (!stripePriceId) {
        return NextResponse.json(
          { error: `Stripe price id saknas för ${purchase.label}. Lägg till ${purchase.stripePriceEnvKey}.` },
          { status: 503 },
        );
      }

      const stripe = getStripeClient();
      const baseUrl = getAppBaseUrl();
      const session = await stripe.checkout.sessions.create({
        mode: purchase.flowType === "SUBSCRIPTION" ? "subscription" : "payment",
        payment_method_types: [...resolveStripePaymentTypes(input.paymentMethod)],
        customer_email: user.email,
        line_items: [
          {
            price: stripePriceId,
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/prissattning?success=1`,
        cancel_url: `${baseUrl}/prissattning?canceled=1`,
        metadata: {
          userId: user.id,
          purchaseKey: input.purchaseKey,
          paymentMethod: input.paymentMethod,
        },
      });

      await recordAuditEvent({
        userId: user.id,
        actorLabel: user.email,
        action: "payment.checkout.started",
        targetType: "StripeCheckoutSession",
        targetId: session.id,
        metadata: {
          purchaseKey: input.purchaseKey,
          paymentMethod: input.paymentMethod,
        },
      });

      return NextResponse.json({ url: session.url });
    }

    const prisma = getPrismaClient();

    if (!prisma) {
      return NextResponse.json({ error: "Databasanslutning saknas för manuella betalningsflöden." }, { status: 503 });
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

    return NextResponse.json({
      message: `Betalningsförfrågan skapad. Slutpris: ${finalAmountSek} kr efter ${paymentMethod.discountPercent}% rabatt.`,
      requestId: paymentRequest.id,
    });
  } catch (error) {
    await reportServerError(error, { route: "payments.checkout" });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Kunde inte starta betalning." }, { status: 400 });
  }
}