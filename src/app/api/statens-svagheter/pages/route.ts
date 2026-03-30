import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createWikiDraft, listWikiPages } from "@/lib/civic-features";

export async function GET() {
  const items = await listWikiPages();
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const user = await getSessionUser();
    const result = await createWikiDraft(payload, {
      userId: user?.id,
      email: user?.email,
      subscriptionTier: user?.subscriptionTier,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunde inte skapa wikiutkastet.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}