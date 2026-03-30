import { NextRequest, NextResponse } from "next/server";
import { requirePublicApiAccess } from "@/lib/public-api";
import { getLeaderboard } from "@/lib/public-insights";

export async function GET(request: NextRequest) {
  const auth = await requirePublicApiAccess(request, "leaderboard:read", "public:leaderboard");
  if (auth.response) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const items = await getLeaderboard(searchParams.get("window") || undefined, searchParams.get("country") || "SE");

  return NextResponse.json({
    items,
    updatedAt: new Date().toISOString(),
  });
}