import type { Metadata } from "next";
import { listAuthorityFailureReports } from "@/lib/civic-features";
import { AuthorityFailuresClient } from "./Client";

export const metadata: Metadata = {
  title: "Myndighetsgranskaren",
  description: "Anonym rapportering, AI-triagering, pressutkast och moderation för myndighetsfel och skandaler.",
};

export default async function AuthorityFailuresPage() {
  const initialItems = await listAuthorityFailureReports();

  return (
    <div className="shell space-y-10 pb-20 pt-10 md:pt-14">
      <section className="space-y-5 reveal">
        <p className="eyebrow">Myndighetsgranskaren</p>
        <h1 className="max-w-4xl font-title text-5xl leading-none sm:text-6xl">Anonym bevisinhämtning med AI-prioritering, moderering och juridisk grind.</h1>
        <p className="max-w-3xl text-(--muted) text-lg leading-8">Varje ärende får AI-triage, pressutkast och ett obligatoriskt modererings- och legal review-flöde före eventuell publicering.</p>
      </section>
      <AuthorityFailuresClient initialItems={initialItems} />
    </div>
  );
}