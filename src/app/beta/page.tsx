import type { Metadata } from "next";
import type { SessionUser } from "@/lib/auth";
import { getCurrentLocale } from "@/lib/i18n";
import { serverApiJson } from "@/lib/server-api";
import { FeedbackForm } from "./FeedbackForm";

export const metadata: Metadata = {
  title: "Beta",
  description: "Betaintag, feedbackinsamling och launch readiness för Spegeln.",
};

export default async function BetaPage() {
  const locale = await getCurrentLocale();
  const user = await serverApiJson<SessionUser>("/api/me", {}, { allowStatuses: [401] });

  return (
    <div className="shell space-y-16 pb-20 pt-10 md:pt-14">
      <section className="grid gap-6 lg:grid-cols-[1fr_0.92fr] lg:items-start">
        <div className="space-y-5 reveal">
          <p className="eyebrow">{locale === "en" ? "Beta program" : "Betaprogram"}</p>
          <h1 className="font-title text-5xl leading-none sm:text-6xl">
            {locale === "en" ? "Collect hard feedback before you scale the pressure." : "Samla hård feedback innan du skalar trycket."}
          </h1>
          <p className="max-w-2xl text-(--muted) text-lg leading-8">
            {locale === "en"
              ? "The beta layer is for pilots, stress tests, accessibility checks, and blunt feedback before the platform goes wider."
              : "Betalagret är till för pilotdrift, stresstester, tillgänglighetskontroller och rak feedback innan plattformen går bredare."}
          </p>
        </div>
        <aside className="surface-strong rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "120ms" }}>
          <p className="eyebrow">Launch path</p>
          <ol className="mt-4 space-y-3 text-sm leading-7 text-(--foreground)">
            <li>1. {locale === "en" ? "Run a closed beta with journalists, analysts, and users who will actually push the product hard." : "Kör sluten beta med journalister, analytiker och användare som faktiskt kommer trycka hårt på produkten."}</li>
            <li>2. {locale === "en" ? "Review feedback weekly across product, signal flow, and account requests." : "Gå igenom feedback veckovis över produkt, signalflöden och kontobegäran."}</li>
            <li>3. {locale === "en" ? "Ship release notes and press material when the sharp blockers are gone." : "Skicka release notes och pressmaterial när de skarpa blockerarna är borta."}</li>
          </ol>
        </aside>
      </section>

      <FeedbackForm defaultEmail={user?.isAnonymous ? undefined : user?.email} locale={locale} />
    </div>
  );
}