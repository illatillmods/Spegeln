export async function fetchJson<T>(url: string, timeoutMs = 25_000): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchText(url: string, timeoutMs = 25_000): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { Accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

export function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function paginateJson<TItem>(
  buildUrl: (page: number) => string,
  extractItems: (payload: unknown) => TItem[],
  options?: { maxPages?: number; rateLimitMs?: number },
): Promise<TItem[]> {
  const maxPages = options?.maxPages ?? 50;
  const rateLimitMs = options?.rateLimitMs ?? 300;
  const items: TItem[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const payload = await fetchJson<unknown>(buildUrl(page));
    if (!payload) break;

    const batch = extractItems(payload);
    if (batch.length === 0) break;

    items.push(...batch);
    if (rateLimitMs > 0) await sleep(rateLimitMs);
  }

  return items;
}
