"use client";

import { useState, useTransition } from "react";

type AuthCenterProps = {
  locale: "sv" | "en";
  socialProviders: Array<{
    id: "google" | "github";
    label: string;
    enabled: boolean;
  }>;
};

export function AuthCenter({ locale, socialProviders }: AuthCenterProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [pending, startTransition] = useTransition();

  async function submit(path: string, payload: Record<string, unknown>) {
    setError(null);
    setMessage(null);

    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      setError(data.error || (locale === "en" ? "Something went wrong." : "Något gick fel."));
      return;
    }

    if (data.message) {
      setMessage(data.message);
    }

    window.location.href = mode === "register" ? "/konto/onboarding" : "/";
  }

  return (
    <div className="surface-strong rounded-4xl p-6 md:p-8">
      <div className="flex flex-wrap gap-3">
        <button className={mode === "login" ? "btn-primary" : "btn-secondary"} onClick={() => setMode("login")} type="button">
          {locale === "en" ? "Email sign in" : "E-postinloggning"}
        </button>
        <button className={mode === "register" ? "btn-primary" : "btn-secondary"} onClick={() => setMode("register")} type="button">
          {locale === "en" ? "Create account" : "Skapa konto"}
        </button>
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);

          startTransition(() => {
            void submit(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
              email: String(formData.get("email") || ""),
              password: String(formData.get("password") || ""),
              name: String(formData.get("name") || ""),
              preferredLanguage: locale,
              marketingConsent,
            });
          });
        }}
      >
        {mode === "register" ? <input className="input" name="name" placeholder={locale === "en" ? "Name" : "Namn"} /> : null}
        <input autoComplete="email" className="input" name="email" placeholder={locale === "en" ? "Email address" : "E-postadress"} required type="email" />
        <input
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="input"
          minLength={10}
          name="password"
          placeholder={locale === "en" ? "Password" : "Lösenord"}
          required
          type="password"
        />
        {mode === "register" ? (
          <label className="flex items-start gap-3 rounded-[1.4rem] border border-[rgba(22,32,42,0.12)] bg-white/75 p-4 text-sm leading-6">
            <input checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} type="checkbox" />
            <span>
              {locale === "en"
                ? "I want product drops, launch notes, and new tools. Operational alerts and account messages are always sent when needed."
                : "Jag vill få produktsläpp, lanseringsnotiser och nya verktyg. Driftlarm och kontomeddelanden skickas alltid när det behövs."}
            </span>
          </label>
        ) : null}
        <button className="btn-primary w-full" disabled={pending} type="submit">
          {pending
            ? locale === "en"
              ? "Working..."
              : "Arbetar..."
            : mode === "login"
              ? locale === "en"
                ? "Sign in"
                : "Logga in"
              : locale === "en"
                ? "Create account"
                : "Skapa konto"}
        </button>
      </form>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {socialProviders.map((provider) => (
          <button
            className="btn-secondary w-full"
            disabled={!provider.enabled || pending}
            key={provider.id}
            onClick={() => {
              if (!provider.enabled) {
                setError(locale === "en" ? `${provider.label} is not configured yet.` : `${provider.label} är inte konfigurerat ännu.`);
                return;
              }

              window.location.href = `/api/auth/social/${provider.id}`;
            }}
            type="button"
          >
            {locale === "en" ? `Continue with ${provider.label}` : `Fortsätt med ${provider.label}`}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <p className="text-(--muted) text-sm leading-7">
          {locale === "en"
            ? "Need the fastest way in? Start anonymously and upgrade later."
            : "Behöver du snabbaste vägen in? Starta anonymt och uppgradera senare."}
        </p>
        <button
          className="btn-secondary"
          disabled={pending}
          onClick={() => {
            startTransition(() => {
              void submit("/api/auth/anonymous", { preferredLanguage: locale });
            });
          }}
          type="button"
        >
          {locale === "en" ? "Continue anonymously" : "Fortsätt anonymt"}
        </button>
      </div>

      {error ? <p className="mt-4 rounded-2xl bg-[rgba(194,107,20,0.12)] px-4 py-3 text-sm text-(--foreground)">{error}</p> : null}
      {message ? <p className="mt-4 rounded-2xl bg-[rgba(15,118,110,0.12)] px-4 py-3 text-sm text-(--foreground)">{message}</p> : null}
    </div>
  );
}