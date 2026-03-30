const LOCAL_FALLBACK_URL = "http://localhost:3000";

function firstDefinedUrl(...values: Array<string | undefined>) {
  for (const value of values) {
    const normalizedValue = normalizeUrl(value);

    if (normalizedValue) {
      return normalizedValue;
    }
  }

  return null;
}

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

export function getAppBaseUrl() {
  const explicitUrl = firstDefinedUrl(process.env.NEXT_PUBLIC_APP_URL);
  const vercelProductionUrl = firstDefinedUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  const vercelPreviewUrl = firstDefinedUrl(process.env.VERCEL_BRANCH_URL, process.env.VERCEL_URL);
  const railwayUrl = firstDefinedUrl(process.env.RAILWAY_PUBLIC_DOMAIN, process.env.RAILWAY_STATIC_URL);

  if (explicitUrl) {
    return explicitUrl;
  }

  if (process.env.VERCEL_ENV === "preview" && vercelPreviewUrl) {
    return vercelPreviewUrl;
  }

  return vercelProductionUrl ?? vercelPreviewUrl ?? railwayUrl ?? LOCAL_FALLBACK_URL;
}

export function getDeploymentContext() {
  const runningOnVercel = Boolean(process.env.VERCEL);
  const runningOnRailway = [
    process.env.RAILWAY_PROJECT_ID,
    process.env.RAILWAY_ENVIRONMENT_ID,
    process.env.RAILWAY_SERVICE_ID,
    process.env.RAILWAY_PUBLIC_DOMAIN,
    process.env.RAILWAY_STATIC_URL,
  ].some(Boolean);

  return {
    appUrl: getAppBaseUrl(),
    hostedFirst: true,
    frontendProvider: runningOnVercel ? "vercel" : "generic",
    serviceProvider: runningOnRailway ? "railway" : runningOnVercel ? "vercel" : "generic",
    databaseProvider: inferDatabaseProvider(process.env.DATABASE_URL),
    environment:
      process.env.VERCEL_ENV ?? process.env.RAILWAY_ENVIRONMENT_NAME ?? process.env.NODE_ENV ?? "development",
  };
}