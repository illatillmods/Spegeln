import type { Metadata } from "next";
import type { AutomatedAppealView } from "@/lib/civic-features";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ModuleHero } from "@/components/ui/ModuleHero";
import { serverApiJsonSafe } from "@/lib/server-api";
import { AutomatedAppealWorkbench } from "@/app/byrakrati-bombaren/AutomatedAppealWorkbench";
import { BureaucracyTabs } from "@/app/byrakrati-bombaren/BureaucracyTabs";

export const metadata: Metadata = {
  title: "Automatiserad överklagare",
  description: "Ladda upp myndighetsbeslut och låt AI generera överklaganden, JO-anmälningar och handlingbegäran.",
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
          description="Ladda upp eller klistra in ett beslut. AI skriver överklagande, klagomål och begäran om handling — du väljer om du bara vill ha utkast eller skicka vidare."
          eyebrow="AI-verktyg"
          primaryAction={{ href: "/byrakrati-bombaren", label: "Massutskick" }}
          secondaryAction={{ href: "/konto", label: "Mina ärenden" }}
          title="Automatiserad överklagare"
        />
        <BureaucracyTabs />
        <AutomatedAppealWorkbench initialItems={automatedAppeals} />
      </div>
    </>
  );
}
