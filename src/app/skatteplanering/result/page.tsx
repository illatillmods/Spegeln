"use client";
import React, { useEffect, useState } from "react";
import SkatteplaneringResult from "../result";
import ReportPremiumLock from "../ReportPremiumLock";
import { useRouter } from "next/navigation";
import type { TaxOptimizationResult } from "@/lib/ai-worker";

function readStoredResult(): TaxOptimizationResult | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.sessionStorage.getItem("skatteplanering_result");
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as TaxOptimizationResult;
  } catch {
    return null;
  }
}

export default function ResultPage() {
  const [result] = useState<TaxOptimizationResult | null>(() => readStoredResult());
  const router = useRouter();

  useEffect(() => {
    if (!result) {
      router.replace("/skatteplanering/onboarding");
    }
  }, [result, router]);

  if (!result) return null;

  return (
    <div className="shell space-y-8 pb-20 pt-10 md:pt-14">
      <section className="space-y-4 reveal">
        <p className="eyebrow">Steg 2</p>
        <h1 className="font-title text-5xl leading-none sm:text-6xl">Här är analysens första förslag.</h1>
        <p className="max-w-2xl text-(--muted) text-lg leading-8">
          Resultatet visas direkt i samma flöde. Vill du köra om eller justera input går du tillbaka till onboarding utan att lämna modulen.
        </p>
      </section>

      <SkatteplaneringResult strategies={result.strategies} disclaimer={result.disclaimer} />
      {result.premium ? <ReportPremiumLock /> : null}
    </div>
  );
}
