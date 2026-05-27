export const localeOptions = [
  { code: "sv", label: "Svenska" },
  { code: "en", label: "English" },
] as const;

export type AppLocale = (typeof localeOptions)[number]["code"];

export const LOCALE_COOKIE_NAME = "spegeln_locale";

const dictionaries = {
  sv: {
    brandTagline: "Maximal insyn mot makten",
    nav: {
      platform: "Plattform",
      pricing: "Prissättning",
      legal: "Manifest",
      privacy: "Spårkontroll",
      guides: "Guider",
      api: "API",
      beta: "Beta",
      login: "Logga in",
      admin: "Admin",
    },
    footer: {
      copy:
        "Spegeln finns inte för att låta myndighetsspråk stå oemotsagt. Vi samlar signaler, dokument och vittnesmål för att pressa makten ut i ljuset.",
      built: "Byggd i Sverige för att störa maktens bekvämlighet",
      stack: "Vercel, Railway, Next.js och Prisma",
      review: "Ingen neutral kuliss. Bara öppet mottryck.",
    },
    utility: {
      skipToContent: "Hoppa till innehåll",
      localeLabel: "Språk",
    },
  },
  en: {
    brandTagline: "Maximum transparency",
    nav: {
      platform: "Platform",
      pricing: "Pricing",
      legal: "Manifesto",
      privacy: "Trace control",
      guides: "Guides",
      api: "API",
      beta: "Beta",
      login: "Sign in",
      admin: "Admin",
    },
    footer: {
      copy:
        "Spegeln is not here to make official language feel comfortable. It collects signals, documents, and testimony to drag power into the light.",
      built: "Built in Sweden to disturb institutional comfort",
      stack: "Vercel, Railway, Next.js and Prisma",
      review: "No neutral facade. Only public pressure.",
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
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE_NAME)?.value;

  if (!cookieValue) {
    return "sv";
  }

  return normalizeLocale(cookieValue);
}

export function getDictionary(locale: AppLocale) {
  return dictionaries[locale];
}

export function localeToTag(locale: AppLocale) {
  return locale === "en" ? "en-GB" : "sv-SE";
}