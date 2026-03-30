import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { getCurrentLocale } from "@/lib/i18n";
import { PrivacyControlPanel } from "./PrivacyControlPanel";

export const metadata: Metadata = {
  title: "Integritet",
  description: "GDPR-kontroller, samtycken och data subject requests för Spegeln.",
};

export default async function PrivacyPage() {
  const locale = await getCurrentLocale();
  const user = await getSessionUser();

  return (
    <div className="shell space-y-16 pb-20 pt-10 md:pt-14">
      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-start">
        <div className="space-y-5 reveal">
          <p className="eyebrow">GDPR och kontroll</p>
          <h1 className="max-w-3xl font-title text-5xl leading-none sm:text-6xl">
            {locale === "en" ? "Privacy controls are product features, not legal afterthoughts." : "Integritetskontroller är produktfunktioner, inte juridiska eftertankar."}
          </h1>
          <p className="max-w-2xl text-(--muted) text-lg leading-8">
            {locale === "en"
              ? "This page centralizes consent preferences, data subject requests, and clear processing boundaries for Swedish and EU-facing operations."
              : "Den här sidan samlar samtycken, registerbegäran och tydliga behandlingsgränser för verksamhet riktad mot Sverige och EU."}
          </p>
        </div>
        <aside className="surface-strong rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "120ms" }}>
          <p className="eyebrow">Policy snapshot</p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-(--foreground)">
            <li className="flex gap-3"><span className="signal-dot mt-2 shrink-0" /><span>{locale === "en" ? "Separate retention and review flows for tips, reports, moderation, and billing." : "Separata gallrings- och granskningsflöden för tips, rapporter, moderation och betalningar."}</span></li>
            <li className="flex gap-3"><span className="signal-dot mt-2 shrink-0" /><span>{locale === "en" ? "Manual legal review remains mandatory before publication of sensitive claims." : "Manuell juridisk granskning är fortsatt obligatorisk före publicering av känsliga påståenden."}</span></li>
            <li className="flex gap-3"><span className="signal-dot mt-2 shrink-0" /><span>{locale === "en" ? "Data subject requests enter an auditable legal queue instead of ad hoc email handling." : "Begäran från registrerade går till en spårbar juridisk kö i stället för lös e-posthantering."}</span></li>
          </ul>
        </aside>
      </section>

      <PrivacyControlPanel
        defaultEmail={user?.isAnonymous ? undefined : user?.email}
        initialMarketingConsent={Boolean(user && !user.isAnonymous && user.marketingConsent)}
        isAuthenticated={Boolean(user && !user.isAnonymous)}
        locale={locale}
      />
    </div>
  );
}