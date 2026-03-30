import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { persistSession, upsertSocialUser } from "@/lib/auth";
import { reportServerError } from "@/lib/observability";
import { exchangeSocialCode, type SocialProviderId } from "@/lib/social-auth";

const OAUTH_STATE_COOKIE = "spegeln_oauth_state";

export async function GET(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const storedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

  cookieStore.set(OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });

  if ((provider !== "google" && provider !== "github") || !code || !state || storedState !== `${provider}:${state}`) {
    return NextResponse.redirect(new URL("/login?error=social_state", request.url));
  }

  try {
    const profile = await exchangeSocialCode(provider as SocialProviderId, code);
    const user = await upsertSocialUser(profile);
    await persistSession(user);

    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    await reportServerError(error, { route: "auth.social.callback", provider });
    return NextResponse.redirect(new URL("/login?error=social_failed", request.url));
  }
}