import type { Metadata } from "next";
import type { MassAppealCatalog } from "@/lib/mass-appeals-types";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ModuleHero } from "@/components/ui/ModuleHero";
import { serverApiJsonSafe } from "@/lib/server-api";
import { BureaucracyTabs } from "./BureaucracyTabs";
import { MassAppealsWorkbench } from "./MassAppealsWorkbench";

export const metadata: Metadata = {
  title: "Byråkrati-bombaren",
  description: "Automatiserade JO-anmälningar, registerkrav och informationsförfrågningar med bulk-sändning och statusspårning.",
};

export default async function MassAppealsPage() {
  const catalogResponse = await serverApiJsonSafe<{ catalog: MassAppealCatalog }>(
    "/api/byrakrati-bombaren/catalog",
    {
      catalog: {
        appealTypes: [],
        authorities: [],
        regions: ["Nationell"],
        billingModels: [],
        antiAbuseSummary: [],
      },
    },
  );
  const catalog = catalogResponse.data.catalog;

  return (
    <>
      <Breadcrumbs
        items={[
          { href: "/", label: "Start" },
          { label: "Byråkrati-bombaren" },
        ]}
      />
      <div className="shell space-y-10 pb-20 pt-4 md:pt-6">
        <ModuleHero
          description="Skapa JO-anmälningar, registerkrav och informationsbegäran i batch. Välj mottagare, förhandsgranska och skicka med spårning."
          eyebrow="Mottryck"
          primaryAction={{ href: "/automatiserad-overklagare", label: "AI-överklagare" }}
          secondaryAction={{ href: "/prissattning", label: "Priser" }}
          title="Byråkrati-bombaren"
        />
        <BureaucracyTabs />
        <MassAppealsWorkbench catalog={catalog} />
      </div>
    </>
  );
}
