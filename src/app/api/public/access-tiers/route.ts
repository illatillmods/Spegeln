import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    items: [
      {
        tier: "public",
        monthlyPriceSek: 0,
        scopes: ["leaderboard:read", "dashboard:read", "scorecards:read"],
        notes: "Anonymiserad och aggregerad data med standard rate limit.",
      },
      {
        tier: "premium",
        monthlyPriceSek: 1490,
        scopes: ["leaderboard:read", "dashboard:read", "scorecards:read", "bulk:export", "partner:integration"],
        notes: "Kräver kommersiell registrering, juridisk granskning och separata avtalsvillkor.",
      },
    ],
  });
}