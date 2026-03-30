import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateEmailUser, persistSession } from "@/lib/auth";
import { reportServerError } from "@/lib/observability";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());
    const user = await authenticateEmailUser(input);
    await persistSession(user);

    return NextResponse.json({ user });
  } catch (error) {
    await reportServerError(error, { route: "auth.login" });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kunde inte logga in." },
      { status: 400 },
    );
  }
}