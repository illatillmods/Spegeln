import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { priceId } = await req.json();
  if (!priceId) {
    return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
  }
  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/prissattning?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/prissattning?canceled=1`,
      metadata: {
        userId: user.id,
      },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json({ error: "Stripe error", detail: String(err) }, { status: 500 });
  }
}
