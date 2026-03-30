import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { submitConfidenceVote } from "@/lib/civic-features";

function getFingerprintSource(request: NextRequest) {
  return [request.headers.get("x-forwarded-for"), request.headers.get("user-agent")].filter(Boolean).join("|");
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const user = await getSessionUser();
    const result = await submitConfidenceVote(payload, {
      userId: user?.id,
      email: user?.email,
      subscriptionTier: user?.subscriptionTier,
      fingerprintSource: getFingerprintSource(request),
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunde inte registrera rösten.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}