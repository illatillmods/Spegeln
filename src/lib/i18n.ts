export const localeOptions = [
  { code: "sv", label: "Svenska" },
  { code: "en", label: "English" },
] as const;

export type AppLocale = (typeof localeOptions)[number]["code"];

export const LOCALE_COOKIE_NAME = "spegeln_locale";

const dictionaries = {
  sv: {
    brandTagline: "Ansvarsfull transparens",
    nav: {
      platform: "Plattform",
      pricing: "Prissättning",
      legal: "Juridik",
      privacy: "Integritet",
      guides: "Guider",
      api: "API",
      beta: "Beta",
      login: "Logga in",
      admin: "Admin",
    },
    footer: {
      copy:
        "Spegeln är designad för offentlig insyn, inte för automatisk utpekning. All publicering ska föregås av mänsklig och juridisk granskning.",
      built: "Byggd som svensk MVP för myndighetsbevakning",
      stack: "Vercel, Railway, Next.js och Prisma",
      review: "Juridisk granskning krävs före skarp drift",
    },
    utility: {
      skipToContent: "Hoppa till innehåll",
      localeLabel: "Språk",
    },
  },
  en: {
    brandTagline: "Responsible transparency",
    nav: {
      platform: "Platform",
      pricing: "Pricing",
      legal: "Legal",
      privacy: "Privacy",
      guides: "Guides",
      api: "API",
      beta: "Beta",
      login: "Sign in",
      admin: "Admin",
    },
    footer: {
      copy:
        "Spegeln is designed for public accountability, not automated accusation. Publication should always pass human editorial and legal review.",
      built: "Built as a Swedish watchdog MVP",
      stack: "Vercel, Railway, Next.js and Prisma",
      review: "Legal review is required before production launch",
    },
    utility: {
      skipToContent: "Skip to content",
      localeLabel: "Language",
    },
  },
} as const;

export function normalizeLocale(input?: string | null): AppLocale {
  if (!input) {
    return "sv";
  }

  return input.toLowerCase().startsWith("en") ? "en" : "sv";
}

export async function getCurrentLocale() {
  const { cookies, headers } = await import("next/headers");
  const cookieStore = await cookies();
  const headerStore = await headers();

  return normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value || headerStore.get("accept-language"));
}

export function getDictionary(locale: AppLocale) {
  return dictionaries[locale];
}

export function localeToTag(locale: AppLocale) {
  return locale === "en" ? "en-GB" : "sv-SE";
}