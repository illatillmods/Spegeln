"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SkatteplaneringResult from "../../result";
import ReportPremiumLock from "../../ReportPremiumLock";
import type { TaxOptimizationResult } from "@/lib/ai-worker";

export default function ResultByIdPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [result, setResult] = useState<TaxOptimizationResult | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch(`/api/skatteplanering/result/${encodeURIComponent(params.id)}`);
      if (!response.ok) {
        router.replace("/skatteplanering/onboarding");
        return;
      }

      setResult((await response.json()) as TaxOptimizationResult);
    }

    void load();
  }, [params.id, router]);

  if (!result) {
    return null;
  }

  return (
    <div className="shell space-y-8 pb-20 pt-10 md:pt-14">
      <section className="space-y-4 reveal">
        <p className="eyebrow">Steg 2</p>
        <h1 className="font-title text-5xl leading-none sm:text-6xl">Här är analysens första förslag.</h1>
      </section>
      <SkatteplaneringResult strategies={result.strategies} disclaimer={result.disclaimer} />
      {result.premium ? <ReportPremiumLock /> : null}
    </div>
  );
}
