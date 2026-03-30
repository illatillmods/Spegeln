import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createAutomatedAppealJob, listAutomatedAppealJobs } from "@/lib/civic-features";

function getFingerprintSource(request: NextRequest) {
  return [request.headers.get("x-forwarded-for"), request.headers.get("user-agent")].filter(Boolean).join("|");
}

export async function GET() {
  const items = await listAutomatedAppealJobs();
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const user = await getSessionUser();
    const item = await createAutomatedAppealJob(payload, {
      userId: user?.id,
      email: user?.email,
      subscriptionTier: user?.subscriptionTier,
      fingerprintSource: getFingerprintSource(request),
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunde inte skapa överklagandebunten.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}