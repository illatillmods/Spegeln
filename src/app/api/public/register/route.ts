import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { registerApiConsumer } from "@/lib/public-api";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const email = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : "";
  const scopes = Array.isArray(payload?.scopes) ? payload.scopes : undefined;
  const countryCode = typeof payload?.countryCode === "string" ? payload.countryCode.trim().toUpperCase() : undefined;

  if (!name || !email.includes("@")) {
    return NextResponse.json({ error: "Namn och giltig e-postadress krävs." }, { status: 400 });
  }

  try {
    const sessionUser = await getSessionUser();
    const result = await registerApiConsumer({
      name,
      email,
      scopes,
      countryCode,
      userId: sessionUser?.id,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunde inte registrera API-konsumenten.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}