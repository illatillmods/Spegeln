import { NextResponse } from "next/server";
import { listRecentMassAppealBatches } from "@/lib/mass-appeals";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getSessionUser();
  const senderEmail = new URL(request.url).searchParams.get("senderEmail")?.trim().toLowerCase();
  const batches = await listRecentMassAppealBatches({
    userId: user?.id,
    senderEmail: user ? undefined : senderEmail,
  });

  return NextResponse.json({ batches });
}