import { cookies, headers } from "next/headers";
import { getAppBaseUrl } from "./deployment";

type ServerApiJsonOptions = {
  allowStatuses?: number[];
};

function getCookieHeader(pairs: Array<{ name: string; value: string }>) {
  return pairs.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

export async function serverApiFetch(path: string, init: RequestInit = {}) {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const requestHeaders = new Headers(init.headers);
  const cookieHeader = getCookieHeader(cookieStore.getAll());
  const acceptLanguage = headerStore.get("accept-language");

  if (cookieHeader && !requestHeaders.has("cookie")) {
    requestHeaders.set("cookie", cookieHeader);
  }

  if (acceptLanguage && !requestHeaders.has("accept-language")) {
    requestHeaders.set("accept-language", acceptLanguage);
  }

  return fetch(new URL(path, getAppBaseUrl()), {
    ...init,
    headers: requestHeaders,
    cache: init.cache ?? "no-store",
  });
}

export async function serverApiJson<T>(path: string, init?: RequestInit): Promise<T>;
export async function serverApiJson<T>(path: string, init: RequestInit, options: ServerApiJsonOptions): Promise<T | null>;
export async function serverApiJson<T>(
  path: string,
  init: RequestInit = {},
  options: ServerApiJsonOptions = {},
) {
  const response = await serverApiFetch(path, init);

  if (options.allowStatuses?.includes(response.status)) {
    return null as T | null;
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error || `API request failed with status ${response.status}.`);
  }

  return await response.json() as T;
}

export type ServerApiResult<T> = {
  data: T;
  ok: boolean;
  error?: string;
};

export async function serverApiJsonSafe<T>(
  path: string,
  fallback: T,
  init: RequestInit = {},
  options: ServerApiJsonOptions = {},
): Promise<ServerApiResult<T>> {
  try {
    const data = await serverApiJson<T>(path, init, options);
    if (data === null) {
      return { data: fallback, ok: false, error: "Resursen hittades inte." };
    }

    return { data, ok: true };
  } catch (error) {
    return {
      data: fallback,
      ok: false,
      error: error instanceof Error ? error.message : "API-anropet misslyckades.",
    };
  }
}