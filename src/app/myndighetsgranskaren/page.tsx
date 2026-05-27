import type { Metadata } from "next";
import type { FailureReportView } from "@/lib/civic-features";
import { ModuleHero } from "@/components/ui/ModuleHero";
import { getProtestModule } from "@/lib/module-manifest";
import { serverApiJson } from "@/lib/server-api";
import { AuthorityFailuresClient } from "./Client";

const mod = getProtestModule("myndighetsgranskaren")!;

export const metadata: Metadata = {
  title: mod.shortTitle,
  description: mod.description,
};

export default async function AuthorityFailuresPage() {
  const response = await serverApiJson<{ items: FailureReportView[] }>("/api/myndighetsgranskaren/reports");
  const initialItems = response.items;

  return (
    <div className="shell space-y-10 pb-20 pt-10 md:pt-14">
      <ModuleHero
        description={`${mod.description} ${mod.extremLangfinger}`}
        eyebrow={mod.eyebrow}
        title={mod.title}
      />
      <AuthorityFailuresClient initialItems={initialItems} />
    </div>
  );
}