"use client";

import { useState, useTransition } from "react";

type PrivacyControlPanelProps = {
  locale: "sv" | "en";
  isAuthenticated: boolean;
  defaultEmail?: string;
  initialMarketingConsent: boolean;
};

export function PrivacyControlPanel({ locale, isAuthenticated, defaultEmail, initialMarketingConsent }: PrivacyControlPanelProps) {
  const [marketingConsent, setMarketingConsent] = useState(initialMarketingConsent);
  const [analyticsConsent, setAnalyticsConsent] = useState(true);
  const [personalizationConsent, setPersonalizationConsent] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function savePreferences() {
    setFeedback(null);
    setError(null);

    const response = await fetch("/api/privacy/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale,
        marketingConsent,
        analyticsConsent,
        personalizationConsent,
      }),
    });

    const data = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      setError(data.error || (locale === "en" ? "Unable to save preferences." : "Kunde inte spara inställningarna."));
      return;
    }

    setFeedback(data.message || (locale === "en" ? "Preferences saved." : "Inställningarna sparades."));
  }

  async function submitRequest(formData: FormData) {
    setFeedback(null);
    setError(null);

    const response = await fetch("/api/privacy/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(formData.get("email") || defaultEmail || ""),
        requestKind: String(formData.get("requestKind") || "ACCESS"),
        details: String(formData.get("details") || ""),
        locale,
      }),
    });

    const data = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      setError(data.error || (locale === "en" ? "Could not submit privacy request." : "Kunde inte skicka integritetsbegäran."));
      return;
    }

    setFeedback(data.message || (locale === "en" ? "Privacy request submitted." : "Integritetsbegäran skickades."));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.94fr_1.06fr]">
      <section className="surface rounded-4xl p-6 md:p-8">
        <p className="eyebrow">{locale === "en" ? "Controls" : "Kontroller"}</p>
        <h2 className="mt-3 font-title text-4xl">{locale === "en" ? "Consent and tracking preferences" : "Samtycke och spårningsinställningar"}</h2>
        <div className="mt-6 space-y-4 text-sm leading-7">
          <label className="flex items-start gap-3 rounded-[1.4rem] border border-[rgba(22,32,42,0.12)] bg-white/75 p-4">
            <input checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} type="checkbox" />
            <span>{locale === "en" ? "Product updates and launch information" : "Produktuppdateringar och lanseringsinformation"}</span>
          </label>
          <label className="flex items-start gap-3 rounded-[1.4rem] border border-[rgba(22,32,42,0.12)] bg-white/75 p-4">
            <input checked={analyticsConsent} onChange={(event) => setAnalyticsConsent(event.target.checked)} type="checkbox" />
            <span>{locale === "en" ? "Anonymous analytics for reliability and abuse protection" : "Anonym analys för driftsäkerhet och abuse-skydd"}</span>
          </label>
          <label className="flex items-start gap-3 rounded-[1.4rem] border border-[rgba(22,32,42,0.12)] bg-white/75 p-4">
            <input checked={personalizationConsent} onChange={(event) => setPersonalizationConsent(event.target.checked)} type="checkbox" />
            <span>{locale === "en" ? "Personalized recommendations in guides and dashboards" : "Personliga rekommendationer i guider och dashboards"}</span>
          </label>
        </div>
        <button
          className="btn-primary mt-6"
          disabled={pending}
          onClick={() => {
            startTransition(() => {
              void savePreferences();
            });
          }}
          type="button"
        >
          {pending ? (locale === "en" ? "Saving..." : "Sparar...") : locale === "en" ? "Save preferences" : "Spara inställningar"}
        </button>
        {!isAuthenticated ? (
          <p className="mt-4 text-(--muted) text-sm leading-7">
            {locale === "en"
              ? "Anonymous users can still submit privacy requests below. Persistent account-level settings are applied after sign-in."
              : "Anonyma användare kan fortfarande skicka integritetsbegäran nedan. Beständiga kontoinställningar tillämpas efter inloggning."}
          </p>
        ) : null}
      </section>

      <section className="surface rounded-4xl p-6 md:p-8">
        <p className="eyebrow">GDPR</p>
        <h2 className="mt-3 font-title text-4xl">{locale === "en" ? "Data subject requests" : "Begäran enligt GDPR"}</h2>
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);

            startTransition(() => {
              void submitRequest(formData);
            });
          }}
        >
          <input className="input" defaultValue={defaultEmail} name="email" placeholder={locale === "en" ? "Email address" : "E-postadress"} required type="email" />
          <select className="select-field" defaultValue="ACCESS" name="requestKind">
            <option value="ACCESS">{locale === "en" ? "Access request" : "Registerutdrag"}</option>
            <option value="EXPORT">{locale === "en" ? "Data export" : "Dataexport"}</option>
            <option value="DELETE">{locale === "en" ? "Deletion request" : "Raderingsbegäran"}</option>
            <option value="RECTIFY">{locale === "en" ? "Rectification" : "Rättelse"}</option>
            <option value="OBJECTION">{locale === "en" ? "Object to processing" : "Invändning mot behandling"}</option>
            <option value="RESTRICTION">{locale === "en" ? "Restriction of processing" : "Begränsning av behandling"}</option>
          </select>
          <textarea className="textarea" name="details" placeholder={locale === "en" ? "Describe what data or account area the request concerns." : "Beskriv vilka uppgifter eller vilket kontoärende begäran gäller."} rows={5} />
          <button className="btn-primary w-full" disabled={pending} type="submit">
            {pending ? (locale === "en" ? "Submitting..." : "Skickar...") : locale === "en" ? "Submit privacy request" : "Skicka integritetsbegäran"}
          </button>
        </form>
        {error ? <p className="mt-4 rounded-2xl bg-[rgba(194,107,20,0.12)] px-4 py-3 text-sm">{error}</p> : null}
        {feedback ? <p className="mt-4 rounded-2xl bg-[rgba(15,118,110,0.12)] px-4 py-3 text-sm">{feedback}</p> : null}
      </section>
    </div>
  );
}