import { NextRequest, NextResponse } from "next/server";
import { createReverseSurveillanceSubmission, listReverseSurveillance } from "@/lib/civic-features";

function getFingerprintSource(request: NextRequest) {
  return [request.headers.get("x-forwarded-for"), request.headers.get("user-agent")].filter(Boolean).join("|");
}

export async function GET() {
  const items = await listReverseSurveillance();
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const item = await createReverseSurveillanceSubmission(payload, {
      fingerprintSource: getFingerprintSource(request),
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunde inte skapa videosubmission.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}