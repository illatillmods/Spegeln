import React from "react";
import OnboardingForm from "./OnboardingForm";

export default function OnboardingPage() {
  return (
    <div className="shell space-y-8 pb-20 pt-10 md:pt-14">
      <section className="grid gap-6 lg:grid-cols-[0.96fr_1.04fr] lg:items-start">
        <div className="space-y-5 reveal">
          <p className="eyebrow">Steg 1</p>
          <h1 className="font-title text-5xl leading-none sm:text-6xl">Fyll i ekonomin en gång och låt analysen göra resten.</h1>
          <p className="max-w-2xl text-(--muted) text-lg leading-8">
            Formuläret är avsiktligt kort. Målet är att användaren ska komma till första resultatet snabbt, inte fastna i onboarding.
          </p>
        </div>

        <article className="surface-strong rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "120ms" }}>
          <p className="eyebrow">Det här behövs</p>
          <ul className="mt-4 space-y-3 text-(--foreground) text-sm leading-7">
            <li className="flex gap-3"><span className="signal-dot mt-2 shrink-0" /><span>Årsinkomst i SEK</span></li>
            <li className="flex gap-3"><span className="signal-dot mt-2 shrink-0" /><span>Tillgångar i SEK</span></li>
            <li className="flex gap-3"><span className="signal-dot mt-2 shrink-0" /><span>Frivilliga upplysningar om upplägg, mål eller begränsningar</span></li>
          </ul>
        </article>
      </section>

      <section className="surface rounded-4xl p-6 md:p-8 reveal">
        <OnboardingForm />
      </section>
    </div>
  );
}
