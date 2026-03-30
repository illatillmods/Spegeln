import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createAuthorityFailureReport, listAuthorityFailureReports } from "@/lib/civic-features";

function getFingerprintSource(request: NextRequest) {
  return [request.headers.get("x-forwarded-for"), request.headers.get("user-agent")].filter(Boolean).join("|");
}

export async function GET() {
  const items = await listAuthorityFailureReports();
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const user = await getSessionUser();
    const item = await createAuthorityFailureReport(payload, {
      userId: user?.id,
      email: user?.email,
      subscriptionTier: user?.subscriptionTier,
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      fingerprintSource: getFingerprintSource(request),
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunde inte skapa granskningsärendet.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}