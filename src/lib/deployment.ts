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

  if (explicitUrl) {
    return explicitUrl;
  }

  if (process.env.VERCEL_ENV === "preview" && vercelPreviewUrl) {
    return vercelPreviewUrl;
  }

  return vercelProductionUrl ?? vercelPreviewUrl ?? LOCAL_FALLBACK_URL;
}

export function getDeploymentContext() {
  const runningOnVercel = Boolean(process.env.VERCEL);

  return {
    appUrl: getAppBaseUrl(),
    hostedFirst: true,
    frontendProvider: runningOnVercel ? "vercel" : "generic",
    serviceProvider: runningOnVercel ? "vercel" : "generic",
    databaseProvider: inferDatabaseProvider(process.env.DATABASE_URL),
    backendProxyConfigured: Boolean(process.env.BACKEND_URL),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
  };
}