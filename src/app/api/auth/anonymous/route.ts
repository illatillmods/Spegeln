import { NextResponse } from "next/server";
import { z } from "zod";
import { createAnonymousUser, persistSession } from "@/lib/auth";
import { reportServerError } from "@/lib/observability";

const anonymousSchema = z.object({
  preferredLanguage: z.enum(["sv", "en"]).default("sv"),
});

export async function POST(request: Request) {
  try {
    const input = anonymousSchema.parse(await request.json());
    const user = await createAnonymousUser(input.preferredLanguage);
    await persistSession(user);

    return NextResponse.json({ user, message: "Anonym session skapad." });
  } catch (error) {
    await reportServerError(error, { route: "auth.anonymous" });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kunde inte skapa anonym session." },
      { status: 400 },
    );
  }
}