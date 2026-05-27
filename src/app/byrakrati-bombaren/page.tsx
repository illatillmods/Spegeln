import type { Metadata } from "next";
import type { MassAppealCatalog } from "@/lib/mass-appeals-types";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ModuleHero } from "@/components/ui/ModuleHero";
import { getProtestModule } from "@/lib/module-manifest";
import { serverApiJsonSafe } from "@/lib/server-api";
import { BureaucracyTabs } from "./BureaucracyTabs";
import { MassAppealsWorkbench } from "./MassAppealsWorkbench";

const mod = getProtestModule("byrakrati-bombaren")!;

export const metadata: Metadata = {
  title: mod.shortTitle,
  description: mod.description,
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
          description={`${mod.description} ${mod.extremLangfinger}`}
          eyebrow={mod.eyebrow}
          primaryAction={{ href: "/automatiserad-overklagare", label: "AI-överklagare" }}
          secondaryAction={{ href: "/prissattning", label: "Priser" }}
          title={mod.title}
        />
        <BureaucracyTabs />
        <MassAppealsWorkbench catalog={catalog} />
      </div>
    </>
  );
}
