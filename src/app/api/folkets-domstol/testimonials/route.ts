import { NextRequest, NextResponse } from "next/server";
import { submitConfidenceTestimonial } from "@/lib/civic-features";

function getFingerprintSource(request: NextRequest) {
  return [request.headers.get("x-forwarded-for"), request.headers.get("user-agent")].filter(Boolean).join("|");
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const result = await submitConfidenceTestimonial(payload, {
      fingerprintSource: getFingerprintSource(request),
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunde inte spara vittnesmålet.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}