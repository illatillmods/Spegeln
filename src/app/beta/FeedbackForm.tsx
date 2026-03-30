"use client";

import { useState, useTransition } from "react";

type FeedbackFormProps = {
  locale: "sv" | "en";
  defaultEmail?: string;
};

export function FeedbackForm({ locale, defaultEmail }: FeedbackFormProps) {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="surface rounded-4xl p-6 md:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          setError(null);
          setResult(null);

          const response = await fetch("/api/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: String(formData.get("email") || ""),
              category: String(formData.get("category") || "beta"),
              rating: Number(formData.get("rating") || 0),
              message: String(formData.get("message") || ""),
              locale,
            }),
          });

          const data = (await response.json()) as { error?: string; message?: string };

          if (!response.ok) {
            setError(data.error || (locale === "en" ? "Could not save feedback." : "Kunde inte spara feedback."));
            return;
          }

          setResult(data.message || (locale === "en" ? "Feedback received." : "Feedback mottagen."));
          event.currentTarget.reset();
        });
      }}
    >
      <p className="eyebrow">Beta</p>
      <h2 className="mt-3 font-title text-4xl">{locale === "en" ? "Send feedback" : "Skicka feedback"}</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input className="input" defaultValue={defaultEmail} name="email" placeholder={locale === "en" ? "Email address" : "E-postadress"} type="email" />
        <select className="select-field" defaultValue="beta" name="category">
          <option value="beta">{locale === "en" ? "Beta feedback" : "Betafeedback"}</option>
          <option value="ux">UX</option>
          <option value="bug">Bug</option>
          <option value="legal">{locale === "en" ? "Legal review" : "Juridisk granskning"}</option>
        </select>
      </div>
      <div className="mt-4">
        <select className="select-field" defaultValue="4" name="rating">
          <option value="5">5/5</option>
          <option value="4">4/5</option>
          <option value="3">3/5</option>
          <option value="2">2/5</option>
          <option value="1">1/5</option>
        </select>
      </div>
      <textarea className="textarea mt-4" name="message" placeholder={locale === "en" ? "What worked, what failed, and what should happen next?" : "Vad fungerade, vad brast och vad bör hända härnäst?"} required rows={6} />
      <button className="btn-primary mt-4 w-full" disabled={pending} type="submit">
        {pending ? (locale === "en" ? "Submitting..." : "Skickar...") : locale === "en" ? "Send feedback" : "Skicka feedback"}
      </button>
      {error ? <p className="mt-4 rounded-2xl bg-[rgba(194,107,20,0.12)] px-4 py-3 text-sm">{error}</p> : null}
      {result ? <p className="mt-4 rounded-2xl bg-[rgba(15,118,110,0.12)] px-4 py-3 text-sm">{result}</p> : null}
    </form>
  );
}