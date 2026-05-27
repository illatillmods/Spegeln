"use client";

import { useState, useTransition } from "react";

type PrivacyControlPanelProps = {
  locale: "sv" | "en";
  isAuthenticated: boolean;
  defaultEmail?: string;
  initialMarketingConsent: boolean;
  initialAnalyticsConsent: boolean;
};

export function PrivacyControlPanel({ locale, isAuthenticated, defaultEmail, initialMarketingConsent, initialAnalyticsConsent }: PrivacyControlPanelProps) {
  const [marketingConsent, setMarketingConsent] = useState(initialMarketingConsent);
  const [analyticsConsent, setAnalyticsConsent] = useState(initialAnalyticsConsent);
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
      setError(data.error || (locale === "en" ? "Unable to save choices." : "Kunde inte spara valen."));
      return;
    }

    setFeedback(data.message || (locale === "en" ? "Choices saved." : "Valen sparades."));
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
      setError(data.error || (locale === "en" ? "Could not submit request." : "Kunde inte skicka begäran."));
      return;
    }

    setFeedback(data.message || (locale === "en" ? "Request submitted." : "Begäran skickades."));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.94fr_1.06fr]">
      <section className="surface rounded-4xl p-6 md:p-8">
        <p className="eyebrow">{locale === "en" ? "Signal traces" : "Signalspår"}</p>
        <h2 className="mt-3 font-title text-4xl">{locale === "en" ? "Alerts and tracking on your terms" : "Utskick och spårning på dina villkor"}</h2>
        <div className="mt-6 space-y-4 text-sm leading-7">
          <label className="flex items-start gap-3 rounded-[1.4rem] border border-[rgba(22,32,42,0.12)] bg-white/75 p-4">
            <input checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} type="checkbox" />
            <span>{locale === "en" ? "Product drops, launches, and new tools" : "Produktsläpp, lanseringar och nya verktyg"}</span>
          </label>
          <label className="flex items-start gap-3 rounded-[1.4rem] border border-[rgba(22,32,42,0.12)] bg-white/75 p-4">
            <input checked={analyticsConsent} onChange={(event) => setAnalyticsConsent(event.target.checked)} type="checkbox" />
            <span>{locale === "en" ? "Anonymous usage data that keeps the platform faster and harder to disrupt" : "Anonym användningsdata som gör plattformen snabbare och svårare att störa ut"}</span>
          </label>
          <label className="flex items-start gap-3 rounded-[1.4rem] border border-[rgba(22,32,42,0.12)] bg-white/75 p-4">
            <input checked={personalizationConsent} onChange={(event) => setPersonalizationConsent(event.target.checked)} type="checkbox" />
            <span>{locale === "en" ? "Personalized recommendations in guides, dashboards, and alerts" : "Personliga rekommendationer i guider, dashboards och larm"}</span>
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
          {pending ? (locale === "en" ? "Saving..." : "Sparar...") : locale === "en" ? "Save choices" : "Spara mina val"}
        </button>
        {!isAuthenticated ? (
          <p className="mt-4 text-(--muted) text-sm leading-7">
            {locale === "en"
              ? "Anonymous users can still send requests below. Persistent account choices are attached after sign-in."
              : "Anonyma användare kan fortfarande skicka begäran nedan. Beständiga kontoval kopplas på efter inloggning."}
          </p>
        ) : null}
      </section>

      <section className="surface rounded-4xl p-6 md:p-8">
        <p className="eyebrow">{locale === "en" ? "Requests" : "Krav mot plattformen"}</p>
        <h2 className="mt-3 font-title text-4xl">{locale === "en" ? "Demand export, correction, or deletion" : "Kräv export, rättelse eller radering"}</h2>
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
            <option value="ACCESS">{locale === "en" ? "Show me everything you have" : "Visa allt ni har"}</option>
            <option value="EXPORT">{locale === "en" ? "Export my account" : "Exportera mitt konto"}</option>
            <option value="DELETE">{locale === "en" ? "Delete my traces" : "Radera mina spår"}</option>
            <option value="RECTIFY">{locale === "en" ? "Correct wrong data" : "Rätta felaktiga uppgifter"}</option>
            <option value="OBJECTION">{locale === "en" ? "Stop certain processing" : "Stoppa viss behandling"}</option>
            <option value="RESTRICTION">{locale === "en" ? "Freeze processing" : "Frys behandlingen"}</option>
          </select>
          <textarea className="textarea" name="details" placeholder={locale === "en" ? "Describe which account area, trace, or dataset this concerns." : "Beskriv vilket konto, vilka spår eller vilken datamängd kravet gäller."} rows={5} />
          <button className="btn-primary w-full" disabled={pending} type="submit">
            {pending ? (locale === "en" ? "Submitting..." : "Skickar...") : locale === "en" ? "Send request" : "Skicka begäran"}
          </button>
        </form>
        {error ? <p className="mt-4 rounded-2xl bg-[rgba(194,107,20,0.12)] px-4 py-3 text-sm">{error}</p> : null}
        {feedback ? <p className="mt-4 rounded-2xl bg-[rgba(15,118,110,0.12)] px-4 py-3 text-sm">{feedback}</p> : null}
      </section>
    </div>
  );
}