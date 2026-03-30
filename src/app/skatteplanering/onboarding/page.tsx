import React from "react";
import OnboardingForm from "./OnboardingForm";

export default function OnboardingPage() {
  return (
    <main className="max-w-xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-4">Steg 1: Fyll i din ekonomi</h2>
      <OnboardingForm />
    </main>
  );
}
