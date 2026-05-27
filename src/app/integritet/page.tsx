import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { SessionUser } from "@/lib/auth";
import { getCurrentLocale } from "@/lib/i18n";
import { ANALYTICS_CONSENT_COOKIE_NAME, parseAnalyticsConsent } from "@/lib/privacy-consent";
import { serverApiJson } from "@/lib/server-api";
import { PrivacyControlPanel } from "./PrivacyControlPanel";

export const metadata: Metadata = {
  title: "Spårkontroll",
  description: "Styr vilka spår du lämnar, vilka utskick du får och hur du kräver export eller radering.",
};

export default async function PrivacyPage() {
  const locale = await getCurrentLocale();
  const cookieStore = await cookies();
  const user = await serverApiJson<SessionUser>("/api/me", {}, { allowStatuses: [401] });
  const analyticsConsent = parseAnalyticsConsent(cookieStore.get(ANALYTICS_CONSENT_COOKIE_NAME)?.value);

  return (
    <div className="shell space-y-16 pb-20 pt-10 md:pt-14">
      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-start">
        <div className="space-y-5 reveal">
          <p className="eyebrow">Spårkontroll</p>
          <h1 className="max-w-3xl font-title text-5xl leading-none sm:text-6xl">
            {locale === "en" ? "Decide which traces you leave while you track power." : "Bestäm vilka spår du lämnar medan du granskar makten."}
          </h1>
          <p className="max-w-2xl text-(--muted) text-lg leading-8">
            {locale === "en"
              ? "This page lets you tune what follows you, what reaches your inbox, and how you demand export, correction, or deletion from the platform."
              : "Den här sidan låter dig styra vad som följer dig, vad som når din inkorg och hur du kräver export, rättelse eller radering från plattformen."}
          </p>
        </div>
        <aside className="surface-strong rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "120ms" }}>
          <p className="eyebrow">Ingen blankettromantik</p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-(--foreground)">
            <li className="flex gap-3"><span className="signal-dot mt-2 shrink-0" /><span>{locale === "en" ? "Cut off marketing noise and keep only the signals you actually want." : "Stäng av marknadssurr och behåll bara de signaler du faktiskt vill ha."}</span></li>
            <li className="flex gap-3"><span className="signal-dot mt-2 shrink-0" /><span>{locale === "en" ? "Demand export or correction when you want to inspect your own trace in the system." : "Kräv export eller rättelse när du vill se ditt eget avtryck i systemet."}</span></li>
            <li className="flex gap-3"><span className="signal-dot mt-2 shrink-0" /><span>{locale === "en" ? "Push for deletion when you are done. The request path is meant to be direct, not ceremonial." : "Tryck på för radering när du är klar. Begäran ska vara direkt, inte ceremoniell."}</span></li>
          </ul>
        </aside>
      </section>

      <PrivacyControlPanel
        defaultEmail={user?.isAnonymous ? undefined : user?.email}
        initialAnalyticsConsent={analyticsConsent}
        initialMarketingConsent={Boolean(user && !user.isAnonymous && user.marketingConsent)}
        isAuthenticated={Boolean(user && !user.isAnonymous)}
        locale={locale}
      />
    </div>
  );
}