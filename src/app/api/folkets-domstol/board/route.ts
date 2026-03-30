import { NextResponse } from "next/server";
import { getConfidenceBoard } from "@/lib/civic-features";

export async function GET() {
  const items = await getConfidenceBoard();
  return NextResponse.json({ items });
}