import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { getCurrentLocale } from "@/lib/i18n";
import { FeedbackForm } from "./FeedbackForm";

export const metadata: Metadata = {
  title: "Beta",
  description: "Betaintag, feedbackinsamling och launch readiness för Spegeln.",
};

export default async function BetaPage() {
  const locale = await getCurrentLocale();
  const user = await getSessionUser();

  return (
    <div className="shell space-y-16 pb-20 pt-10 md:pt-14">
      <section className="grid gap-6 lg:grid-cols-[1fr_0.92fr] lg:items-start">
        <div className="space-y-5 reveal">
          <p className="eyebrow">{locale === "en" ? "Beta program" : "Betaprogram"}</p>
          <h1 className="font-title text-5xl leading-none sm:text-6xl">
            {locale === "en" ? "Collect launch feedback before you scale visibility." : "Samla lanseringsfeedback innan du skalar synligheten."}
          </h1>
          <p className="max-w-2xl text-(--muted) text-lg leading-8">
            {locale === "en"
              ? "The beta layer is intended for newsroom pilots, legal review, accessibility checks, and controlled public-interest testing."
              : "Betalagret är avsett för pilotdrift med redaktioner, juridisk genomgång, tillgänglighetstester och kontrollerad samhällsnyttig testning."}
          </p>
        </div>
        <aside className="surface-strong rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "120ms" }}>
          <p className="eyebrow">Launch path</p>
          <ol className="mt-4 space-y-3 text-sm leading-7 text-(--foreground)">
            <li>1. {locale === "en" ? "Run closed beta with journalists, analysts, and legal reviewers." : "Kör sluten beta med journalister, analytiker och juridiska granskare."}</li>
            <li>2. {locale === "en" ? "Review feedback weekly across product, moderation, and privacy queues." : "Gå igenom feedback veckovis över produkt-, moderation- och integritetsköer."}</li>
            <li>3. {locale === "en" ? "Ship release notes and press materials only after critical blockers are closed." : "Skicka release notes och pressmaterial först när kritiska blockerare är stängda."}</li>
          </ol>
        </aside>
      </section>

      <FeedbackForm defaultEmail={user?.isAnonymous ? undefined : user?.email} locale={locale} />
    </div>
  );
}