import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Newsreader, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SessionActions } from "@/components/SessionActions";
import type { SessionUser } from "@/lib/auth";
import { getAppBaseUrl } from "@/lib/deployment";
import { getCurrentLocale, getDictionary, localeToTag } from "@/lib/i18n";
import { ANALYTICS_CONSENT_COOKIE_NAME, parseAnalyticsConsent } from "@/lib/privacy-consent";
import { serverApiJson } from "@/lib/server-api";
import "./globals.css";

const displayFont = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
});

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  metadataBase: new URL(getAppBaseUrl()),
  title: {
    default: "Spegeln | Myndighetsbevakning på svenska",
    template: "%s | Spegeln",
  },
  description:
    "Spegeln är ett svenskt protestverktyg för myndighetsgranskning, offentlig dokumentation och maximal insyn i maktens korridorer.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getCurrentLocale();
  const cookieStore = await cookies();
  const dictionary = getDictionary(locale);
  const user = await serverApiJson<SessionUser>("/api/me", {}, { allowStatuses: [401] });
  const analyticsConsent = parseAnalyticsConsent(cookieStore.get(ANALYTICS_CONSENT_COOKIE_NAME)?.value);
  const primaryNavigation = [
    { href: "/", label: "Start" },
    { href: "/overvakningsspegeln", label: "Utforska" },
    { href: "/byrakrati-bombaren", label: "Agera" },
    { href: "/myndighetsgranskaren", label: "Bidra" },
    { href: "/insynsindex", label: "Insynsindex" },
    { href: "/guider", label: "Guider" },
  ];
  const moduleNavigation = [
    {
      href: "/automatiserad-overklagare",
      label: "Automatiserad överklagare",
      summary: "AI som överklagar allt — överbelasta byråkratin lagligt.",
    },
    {
      href: "/byrakrati-bombaren",
      label: "Byråkrati-bombaren",
      summary: "Legal DDOS: massöverklagan i batch.",
    },
    {
      href: "/myndighetsgranskaren",
      label: "Myndighetsgranskaren",
      summary: locale === "en" ? "Auto-publish authority failures." : "Publicera myndighetsmisslyckanden automatiskt.",
    },
    {
      href: "/reverse-surveillance",
      label: "Motbevakning",
      summary: "Övervakningskamera mot polisen — sprid motbilder.",
    },
    {
      href: "/folkets-domstol",
      label: "Folkets domstol",
      summary: locale === "en" ? "Parallel court for power holders." : "Parallellt rättssystem mot makthavare.",
    },
    {
      href: "/statens-svagheter",
      label: "Statens svagheter",
      summary: locale === "en" ? "Wiki of loopholes and weak points." : "Wiki över kryphål och sårbarheter.",
    },
    {
      href: "/skatteplanering",
      label: "Skatteplaneringsmaskinen",
      summary: locale === "en" ? "Aggressive tax optimization AI." : "Aggressiv AI för skatteoptimering.",
    },
  ];
  const supportNavigation = [
    { href: "/prissattning", label: dictionary.nav.pricing },
    { href: "/integritet", label: dictionary.nav.privacy },
    { href: "/api-dokumentation", label: dictionary.nav.api },
    { href: "/juridik", label: dictionary.nav.legal },
    { href: "/beta", label: dictionary.nav.beta },
  ];

  return (
    <html lang={localeToTag(locale)}>
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        <a className="skip-link" href="#main-content">
          {dictionary.utility.skipToContent}
        </a>
        <div className="relative min-h-screen">
          <header className="shell sticky top-4 z-20 pt-4">
            <div className="surface rounded-4xl px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <Link className="text-(--foreground) text-lg font-semibold uppercase tracking-[0.18em]" href="/">
                    Spegeln
                  </Link>
                  <p className="mt-1 text-(--muted) text-xs uppercase tracking-[0.24em]">{dictionary.brandTagline}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link className="btn-secondary hidden lg:inline-flex" href="/overvakningsspegeln/sok">
                    {locale === "en" ? "Open search" : "Öppna sök"}
                  </Link>
                  <LanguageSwitcher currentLocale={locale} label={dictionary.utility.localeLabel} />
                  {user ? (
                    <SessionActions
                      accountHref="/konto"
                      accountLabel={locale === "en" ? "My account" : "Mina spår"}
                      adminHref={user.role === "ADMIN" || user.role === "ANALYST" ? "/admin" : undefined}
                      adminLabel={dictionary.nav.admin}
                      logoutLabel={locale === "en" ? "Sign out" : "Logga ut"}
                    />
                  ) : (
                    <Link className="btn-secondary" href="/login">
                      {dictionary.nav.login}
                    </Link>
                  )}
                </div>
              </div>
              <div className="mt-4 hidden items-center justify-between gap-4 md:flex">
                <nav className="flex flex-wrap items-center gap-2 text-sm">
                  {primaryNavigation.map((item) => (
                    <Link
                      className="inline-flex items-center rounded-full border border-[rgba(22,32,42,0.08)] bg-white/70 px-4 py-2 font-medium text-(--foreground) transition hover:-translate-y-0.5"
                      href={item.href}
                      key={item.href}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <details className="group relative shrink-0">
                  <summary className="btn-secondary cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    {locale === "en" ? "More modules" : "Fler moduler"}
                  </summary>
                  <div className="surface-strong absolute right-0 mt-3 w-[min(34rem,calc(100vw-5rem))] rounded-[1.8rem] p-5 shadow-2xl">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {moduleNavigation.map((item) => (
                        <Link className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/75 p-4 transition hover:-translate-y-0.5" href={item.href} key={item.href}>
                          <p className="text-sm font-semibold text-(--foreground)">{item.label}</p>
                          <p className="mt-2 text-(--muted) text-xs leading-6">{item.summary}</p>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      {supportNavigation.map((item) => (
                        <Link className="tag transition hover:-translate-y-0.5" href={item.href} key={item.href}>
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </details>
              </div>
              <details className="mt-4 md:hidden">
                <summary className="cursor-pointer list-none text-(--foreground) text-sm font-semibold [&::-webkit-details-marker]:hidden">
                  {locale === "en" ? "Navigation" : "Navigering"}
                </summary>
                <div className="mt-3 grid gap-4 text-(--muted) text-sm">
                  <div className="grid gap-2">
                    {primaryNavigation.map((item) => (
                      <Link className="rounded-2xl bg-white/70 px-3 py-2 font-medium text-(--foreground)" href={item.href} key={item.href}>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  <div>
                    <p className="eyebrow">{locale === "en" ? "Modules" : "Moduler"}</p>
                    <div className="mt-2 grid gap-2">
                      {moduleNavigation.map((item) => (
                        <Link className="rounded-2xl bg-white/60 px-3 py-3" href={item.href} key={item.href}>
                          <p className="font-medium text-(--foreground)">{item.label}</p>
                          <p className="mt-1 text-xs leading-6">{item.summary}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="eyebrow">{locale === "en" ? "Support" : "Mer"}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {supportNavigation.map((item) => (
                        <Link className="tag" href={item.href} key={item.href}>
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </header>
          <main id="main-content">{children}</main>
          <footer className="shell pb-10 pt-8">
            <div className="surface grid gap-8 rounded-4xl px-6 py-6 lg:grid-cols-[1.15fr_0.85fr_0.85fr] md:px-8">
              <div>
                <p className="eyebrow">{dictionary.brandTagline}</p>
                <p className="mt-3 max-w-2xl text-(--muted) text-sm leading-7">
                  {dictionary.footer.copy}
                </p>
              </div>
              <div>
                <p className="eyebrow">{locale === "en" ? "Core paths" : "Huvudvägar"}</p>
                <nav className="mt-3 grid gap-2 text-(--muted) text-sm">
                  {primaryNavigation.map((item) => (
                    <Link href={item.href} key={item.href}>
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="grid gap-2 text-(--muted) text-sm">
                <p className="eyebrow">{locale === "en" ? "More" : "Mer"}</p>
                {moduleNavigation.slice(0, 4).map((item) => (
                  <Link href={item.href} key={item.href}>
                    {item.label}
                  </Link>
                ))}
                {supportNavigation.map((item) => (
                  <Link href={item.href} key={item.href}>
                    {item.label}
                  </Link>
                ))}
                <Link href="/villkor">{locale === "en" ? "Terms of use" : "Användarvillkor"}</Link>
                <span>{dictionary.footer.built}</span>
                <span>{dictionary.footer.stack}</span>
                <span>{dictionary.footer.review}</span>
              </div>
            </div>
          </footer>
        </div>
        {analyticsConsent ? <Analytics /> : null}
        {analyticsConsent ? <SpeedInsights /> : null}
      </body>
    </html>
  );
}