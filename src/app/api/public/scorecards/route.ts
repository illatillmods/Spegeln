import { NextRequest, NextResponse } from "next/server";
import { requirePublicApiAccess } from "@/lib/public-api";
import { getAuthorityScorecards, parsePublicFilters } from "@/lib/public-insights";

export async function GET(request: NextRequest) {
  const auth = await requirePublicApiAccess(request, "scorecards:read", "public:scorecards");
  if (auth.response) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const filters = parsePublicFilters(searchParams);
  const items = await getAuthorityScorecards(filters);

  return NextResponse.json({
    filters,
    items,
    updatedAt: new Date().toISOString(),
  });
}