import { NextResponse } from "next/server";
import { z } from "zod";
import { persistSession, registerEmailUser } from "@/lib/auth";
import { reportServerError } from "@/lib/observability";

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(10),
  name: z.string().trim().max(80).optional(),
  preferredLanguage: z.enum(["sv", "en"]).default("sv"),
  marketingConsent: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const input = registerSchema.parse(await request.json());
    const user = await registerEmailUser(input);
    await persistSession(user);

    return NextResponse.json({ user });
  } catch (error) {
    await reportServerError(error, { route: "auth.register" });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kunde inte skapa konto." },
      { status: 400 },
    );
  }
}