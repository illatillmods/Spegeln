import type { Metadata } from "next";
import Link from "next/link";
import { Newsreader, Space_Grotesk } from "next/font/google";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SessionActions } from "@/components/SessionActions";
import { getSessionUser } from "@/lib/auth";
import { getAppBaseUrl } from "@/lib/deployment";
import { getCurrentLocale, getDictionary, localeToTag } from "@/lib/i18n";
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
    "Spegeln är ett svenskt koncept för säker myndighetsbevakning, rapportering och publik insyn med juridiska kontrollpunkter inbyggda från start.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getCurrentLocale();
  const dictionary = getDictionary(locale);
  const user = await getSessionUser();
  const navigation = [
    { href: "/byrakrati-bombaren", label: "Byråkrati-bombaren" },
    { href: "/overvakningsspegeln", label: locale === "en" ? "Watchdog" : "Övervakningsspegeln" },
    { href: "/insynsindex", label: locale === "en" ? "Transparency index" : "Insynsindex" },
    { href: "/plattform", label: dictionary.nav.platform },
    { href: "/prissattning", label: dictionary.nav.pricing },
    { href: "/integritet", label: dictionary.nav.privacy },
    { href: "/api-dokumentation", label: dictionary.nav.api },
    { href: "/juridik", label: dictionary.nav.legal },
  ];

  return (
    <html lang={localeToTag(locale)}>
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        <a className="skip-link" href="#main-content">
          {dictionary.utility.skipToContent}
        </a>
        <div className="relative min-h-screen">
          <header className="shell sticky top-4 z-20 pt-4">
            <div className="surface rounded-[2rem] px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <Link className="text-(--foreground) text-lg font-semibold uppercase tracking-[0.18em]" href="/">
                    Spegeln
                  </Link>
                  <p className="mt-1 text-(--muted) text-xs uppercase tracking-[0.24em]">{dictionary.brandTagline}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <LanguageSwitcher currentLocale={locale} label={dictionary.utility.localeLabel} />
                  {user ? (
                    <SessionActions
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
              <nav className="mt-4 hidden items-center gap-5 text-(--muted) text-sm md:flex">
                {navigation.map((item) => (
                  <Link className="transition hover:text-(--foreground)" href={item.href} key={item.href}>
                    {item.label}
                  </Link>
                ))}
              </nav>
              <details className="mt-4 md:hidden">
                <summary className="cursor-pointer text-(--foreground) text-sm font-semibold">Menu</summary>
                <nav className="mt-3 grid gap-2 text-(--muted) text-sm">
                  {navigation.map((item) => (
                    <Link className="rounded-2xl bg-white/60 px-3 py-2" href={item.href} key={item.href}>
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </details>
            </div>
          </header>
          <main id="main-content">{children}</main>
          <footer className="shell pb-10 pt-8">
            <div className="surface grid gap-6 rounded-4xl px-6 py-6 md:grid-cols-[1.3fr_0.7fr] md:px-8">
              <div>
                <p className="eyebrow">{dictionary.brandTagline}</p>
                <p className="mt-3 max-w-2xl text-(--muted) text-sm leading-7">
                  {dictionary.footer.copy}
                </p>
              </div>
              <div className="grid gap-2 text-(--muted) text-sm md:justify-items-end">
                <span>{dictionary.footer.built}</span>
                <span>{dictionary.footer.stack}</span>
                <span>{dictionary.footer.review}</span>
                <Link href="/villkor">{locale === "en" ? "Terms of use" : "Användarvillkor"}</Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}