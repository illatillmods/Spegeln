import { AuthProvider } from "@prisma/client";
import { getFrontendBaseUrl } from "./deployment";

export type SocialProviderId = "google" | "github";

type ProviderConfig = {
  provider: SocialProviderId;
  prismaProvider: AuthProvider;
  label: string;
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
  clientId?: string;
  clientSecret?: string;
};

const providerConfigs: Record<SocialProviderId, ProviderConfig> = {
  google: {
    provider: "google",
    prismaProvider: AuthProvider.GOOGLE,
    label: "Google",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid email profile",
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  github: {
    provider: "github",
    prismaProvider: AuthProvider.GITHUB,
    label: "GitHub",
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    userInfoUrl: "https://api.github.com/user",
    scope: "read:user user:email",
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  },
};

export function getSocialProviderCatalog() {
  return (Object.values(providerConfigs) as ProviderConfig[]).map((config) => ({
    id: config.provider,
    label: config.label,
    enabled: Boolean(config.clientId && config.clientSecret),
  }));
}

export function getSocialProviderConfig(provider: SocialProviderId) {
  const config = providerConfigs[provider];

  if (!config) {
    throw new Error("Unsupported social provider");
  }

  if (!config.clientId || !config.clientSecret) {
    throw new Error(`${config.label} OAuth credentials are missing`);
  }

  return config;
}

export function getSocialCallbackUrl(provider: SocialProviderId) {
  return `${getFrontendBaseUrl()}/api/auth/social/${provider}/callback`;
}

export function buildSocialAuthorizeUrl(provider: SocialProviderId, state: string) {
  const config = getSocialProviderConfig(provider);
  const url = new URL(config.authorizeUrl);

  url.searchParams.set("client_id", config.clientId!);
  url.searchParams.set("redirect_uri", getSocialCallbackUrl(provider));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scope);
  url.searchParams.set("state", state);

  if (provider === "google") {
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
  }

  return url.toString();
}

export async function exchangeSocialCode(provider: SocialProviderId, code: string) {
  const config = getSocialProviderConfig(provider);
  const body = new URLSearchParams({
    client_id: config.clientId!,
    client_secret: config.clientSecret!,
    code,
    grant_type: "authorization_code",
    redirect_uri: getSocialCallbackUrl(provider),
  });

  const tokenResponse = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!tokenResponse.ok) {
    throw new Error(`${config.label} token exchange failed`);
  }

  const tokenPayload = (await tokenResponse.json()) as { access_token?: string };

  if (!tokenPayload.access_token) {
    throw new Error(`${config.label} did not return an access token`);
  }

  if (provider === "google") {
    const userResponse = await fetch(config.userInfoUrl, {
      headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
      cache: "no-store",
    });

    if (!userResponse.ok) {
      throw new Error("Google user profile request failed");
    }

    const user = (await userResponse.json()) as { email?: string; name?: string };

    if (!user.email) {
      throw new Error("Google account did not return an email address");
    }

    return {
      email: user.email,
      name: user.name,
      provider: config.prismaProvider,
    };
  }

  const userResponse = await fetch(config.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${tokenPayload.access_token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "Spegeln",
    },
    cache: "no-store",
  });

  if (!userResponse.ok) {
    throw new Error("GitHub user profile request failed");
  }

  const user = (await userResponse.json()) as { email?: string; name?: string; login?: string };
  let email = user.email;

  if (!email) {
    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${tokenPayload.access_token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "Spegeln",
      },
      cache: "no-store",
    });

    if (emailsResponse.ok) {
      const emails = (await emailsResponse.json()) as Array<{ email: string; primary?: boolean; verified?: boolean }>;
      email = emails.find((item) => item.primary && item.verified)?.email || emails.find((item) => item.verified)?.email;
    }
  }

  if (!email) {
    throw new Error("GitHub account did not return a verified email address");
  }

  return {
    email,
    name: user.name || user.login,
    provider: config.prismaProvider,
  };
}