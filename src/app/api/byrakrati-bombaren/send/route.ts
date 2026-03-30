import { NextRequest, NextResponse } from "next/server";
import { sendMassAppeal, toApiError } from "@/lib/mass-appeals";
import { getSessionUser } from "@/lib/auth";

function getActorKey(request: NextRequest, senderEmail?: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `${forwardedFor || "local"}:${senderEmail || "anonymous"}`;
}

function getIpAddress(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const senderEmail = typeof body?.senderEmail === "string" ? body.senderEmail : undefined;
    const user = await getSessionUser();
    const batch = await sendMassAppeal(body, {
      actorKey: getActorKey(request, senderEmail),
      ipAddress: getIpAddress(request),
      user,
    });
    return NextResponse.json(batch);
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json({ error: apiError.message }, { status: apiError.status });
  }
}