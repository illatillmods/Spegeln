export function unstable_cache<TArgs extends readonly unknown[], TResult>(
  callback: (...args: TArgs) => TResult,
  keyParts?: string[],
  options?: { revalidate?: number },
) {
  void keyParts;
  void options;

  return (...args: TArgs): TResult => callback(...args);
}