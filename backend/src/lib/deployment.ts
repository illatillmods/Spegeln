const FRONTEND_LOCAL_FALLBACK_URL = "http://localhost:3000";
const BACKEND_LOCAL_FALLBACK_URL = "http://localhost:4000";

function normalizeUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmedValue) ? trimmedValue : `https://${trimmedValue}`;
  return withProtocol.replace(/\/$/, "");
}

function firstDefinedUrl(...values: Array<string | undefined>) {
  for (const value of values) {
    const normalizedValue = normalizeUrl(value);

    if (normalizedValue) {
      return normalizedValue;
    }
  }

  return null;
}

function inferDatabaseProvider(databaseUrl?: string) {
  if (!databaseUrl) {
    return "not-configured";
  }

  if (/railway|rlwy/i.test(databaseUrl)) {
    return "railway-postgres";
  }

  if (/^postgres(ql)?:\/\//i.test(databaseUrl)) {
    return "external-postgres";
  }

  return "custom";
}

export function getFrontendBaseUrl() {
  return firstDefinedUrl(
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_URL,
  ) ?? FRONTEND_LOCAL_FALLBACK_URL;
}

export function getBackendBaseUrl() {
  return firstDefinedUrl(
    process.env.BACKEND_PUBLIC_URL,
    process.env.RAILWAY_PUBLIC_DOMAIN,
    process.env.RAILWAY_STATIC_URL,
    process.env.BACKEND_URL,
  ) ?? BACKEND_LOCAL_FALLBACK_URL;
}

export function getCookieDomain() {
  const value = process.env.AUTH_COOKIE_DOMAIN?.trim();
  return value ? value : undefined;
}

export function getDeploymentContext() {
  const runningOnRailway = [
    process.env.RAILWAY_PROJECT_ID,
    process.env.RAILWAY_ENVIRONMENT_ID,
    process.env.RAILWAY_SERVICE_ID,
    process.env.RAILWAY_PUBLIC_DOMAIN,
    process.env.RAILWAY_STATIC_URL,
  ].some(Boolean);

  return {
    frontendUrl: getFrontendBaseUrl(),
    backendUrl: getBackendBaseUrl(),
    hostedFirst: true,
    frontendProvider: process.env.VERCEL || process.env.VERCEL_ENV ? "vercel" : "generic",
    serviceProvider: runningOnRailway ? "railway" : "generic",
    databaseProvider: inferDatabaseProvider(process.env.DATABASE_URL),
    environment:
      process.env.RAILWAY_ENVIRONMENT_NAME ?? process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
  };
}