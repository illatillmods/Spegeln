import { NextRequest, NextResponse } from "next/server";
import { previewMassAppeal, toApiError } from "@/lib/mass-appeals";

function getActorKey(request: NextRequest, senderEmail?: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `${forwardedFor || "local"}:${senderEmail || "anonymous"}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const senderEmail = typeof body?.senderEmail === "string" ? body.senderEmail : undefined;
    const preview = previewMassAppeal(body, getActorKey(request, senderEmail));
    return NextResponse.json(preview);
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json({ error: apiError.message }, { status: apiError.status });
  }
}