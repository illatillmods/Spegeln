import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { buildSocialAuthorizeUrl, type SocialProviderId } from "@/lib/social-auth";

const OAUTH_STATE_COOKIE = "spegeln_oauth_state";

export async function GET(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;

  if (provider !== "google" && provider !== "github") {
    return NextResponse.redirect(new URL("/login?error=unsupported_provider", request.url));
  }

  try {
    const state = randomUUID();
    const cookieStore = await cookies();
    cookieStore.set(OAUTH_STATE_COOKIE, `${provider}:${state}`, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10,
    });

    return NextResponse.redirect(buildSocialAuthorizeUrl(provider as SocialProviderId, state));
  } catch {
    return NextResponse.redirect(new URL("/login?error=social_not_configured", request.url));
  }
}