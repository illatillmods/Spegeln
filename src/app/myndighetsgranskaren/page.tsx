import type { Metadata } from "next";
import type { FailureReportView } from "@/lib/civic-features";
import { ModuleHero } from "@/components/ui/ModuleHero";
import { serverApiJson } from "@/lib/server-api";
import { AuthorityFailuresClient } from "./Client";

export const metadata: Metadata = {
  title: "Myndighetsgranskaren",
  description: "Anonym rapportering, AI-triage och pressbara spår för myndighetsfel och skandaler.",
};

export default async function AuthorityFailuresPage() {
  const response = await serverApiJson<{ items: FailureReportView[] }>("/api/myndighetsgranskaren/reports");
  const initialItems = response.items;

  return (
    <div className="shell space-y-10 pb-20 pt-10 md:pt-14">
      <ModuleHero
        description="Varje ärende får AI-triage, pressbara sammanfattningar och en tydlig väg vidare till feed, profil eller batch när systemet behöver svara."
        eyebrow="Myndighetsgranskaren"
        title="Anonym bevisinhämtning som sätter maktmissbruk under tryck."
      />
      <AuthorityFailuresClient initialItems={initialItems} />
    </div>
  );
}