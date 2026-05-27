export const ANALYTICS_CONSENT_COOKIE_NAME = "spegeln_analytics_consent";

export function serializeAnalyticsConsent(value: boolean) {
  return value ? "granted" : "denied";
}

export function parseAnalyticsConsent(value?: string | null) {
  if (value === "granted") {
    return true;
  }

  if (value === "denied") {
    return false;
  }

  return true;
}