import type { Metadata } from "next";
import type { AutomatedAppealView } from "@/lib/civic-features";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ModuleHero } from "@/components/ui/ModuleHero";
import { getProtestModule } from "@/lib/module-manifest";
import { serverApiJsonSafe } from "@/lib/server-api";
import { AutomatedAppealWorkbench } from "@/app/byrakrati-bombaren/AutomatedAppealWorkbench";
import { BureaucracyTabs } from "@/app/byrakrati-bombaren/BureaucracyTabs";

const mod = getProtestModule("automatiserad-overklagare")!;

export const metadata: Metadata = {
  title: mod.shortTitle,
  description: mod.description,
};

export default async function AutomatedAppealPage() {
  const response = await serverApiJsonSafe<{ items: AutomatedAppealView[] }>("/api/byrakrati-bombaren/automated-appeal", { items: [] });
  const automatedAppeals = response.data.items;

  return (
    <>
      <Breadcrumbs
        items={[
          { href: "/", label: "Start" },
          { href: "/byrakrati-bombaren", label: "Byråkrati-bombaren" },
          { label: "Automatiserad överklagare" },
        ]}
      />
      <div className="shell space-y-10 pb-20 pt-4 md:pt-6">
        <ModuleHero
          description={`${mod.description} ${mod.extremLangfinger}`}
          eyebrow={mod.eyebrow}
          primaryAction={{ href: "/byrakrati-bombaren", label: "Massutskick" }}
          secondaryAction={{ href: "/konto", label: "Mina ärenden" }}
          title={mod.title}
        />
        <BureaucracyTabs />
        <AutomatedAppealWorkbench initialItems={automatedAppeals} />
      </div>
    </>
  );
}
