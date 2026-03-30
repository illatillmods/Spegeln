import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getCurrentLocale } from "@/lib/i18n";
import { getSocialProviderCatalog } from "@/lib/social-auth";
import { AuthCenter } from "./AuthCenter";

export default async function LoginPage() {
  const locale = await getCurrentLocale();
  const user = await getSessionUser();
  if (user) redirect("/");

  return (
    <div className="shell space-y-12 pb-20 pt-10 md:pt-14">
      <section className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
        <div className="space-y-5 reveal">
          <p className="eyebrow">{locale === "en" ? "Authentication" : "Autentisering"}</p>
          <h1 className="font-title text-5xl leading-none sm:text-6xl">
            {locale === "en" ? "Email, social, and anonymous access on one entry page." : "E-post, social inloggning och anonym åtkomst på en och samma startsida."}
          </h1>
          <p className="max-w-2xl text-(--muted) text-lg leading-8">
            {locale === "en"
              ? "Use password-based sign-in today, provider-based OAuth when configured, or an anonymous guest session for low-friction exploration."
              : "Använd lösenordsbaserad inloggning i dag, leverantörsbaserad OAuth när det är konfigurerat, eller en anonym gästsession för lågfriktionsutforskning."}
          </p>
          <div className="rounded-[1.8rem] bg-[rgba(22,32,42,0.94)] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.28em] text-white/60">Security notes</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-white/80">
              <li className="flex gap-3"><span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-white" /><span>{locale === "en" ? "Sessions are signed server-side and stored in secure HTTP-only cookies." : "Sessioner signeras serverside och lagras i säkra HTTP-only-cookies."}</span></li>
              <li className="flex gap-3"><span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-white" /><span>{locale === "en" ? "Anonymous users can be upgraded later without exposing payment or moderation tools by default." : "Anonyma användare kan uppgraderas senare utan att betal- eller moderationsverktyg exponeras som standard."}</span></li>
              <li className="flex gap-3"><span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-white" /><span>{locale === "en" ? "Google and GitHub flows are enabled automatically when OAuth credentials are present." : "Google- och GitHub-flöden aktiveras automatiskt när OAuth-uppgifter finns på plats."}</span></li>
            </ul>
          </div>
        </div>

        <div className="reveal" style={{ animationDelay: "120ms" }}>
          <AuthCenter locale={locale} socialProviders={getSocialProviderCatalog()} />
        </div>
      </section>
    </div>
  );
}
