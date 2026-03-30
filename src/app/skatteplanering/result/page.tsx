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
    <main className="max-w-xl mx-auto py-10 px-4">
      <SkatteplaneringResult strategies={result.strategies} disclaimer={result.disclaimer} />
      {result.premium && <ReportPremiumLock />}
    </main>
  );
}
