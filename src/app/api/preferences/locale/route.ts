import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { LOCALE_COOKIE_NAME, normalizeLocale } from "@/lib/i18n";

const localeSchema = z.object({
  locale: z.enum(["sv", "en"]),
});

export async function POST(request: Request) {
  const input = localeSchema.parse(await request.json());
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, normalizeLocale(input.locale), {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ ok: true });
}