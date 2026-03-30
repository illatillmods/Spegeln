import type { Metadata } from "next";
import { getMassAppealCatalog } from "@/lib/mass-appeals";
import { listAutomatedAppealJobs } from "@/lib/civic-features";
import { AutomatedAppealWorkbench } from "./AutomatedAppealWorkbench";
import { MassAppealsWorkbench } from "./MassAppealsWorkbench";

export const metadata: Metadata = {
  title: "Byråkrati-bombaren",
  description: "Automatiserade JO-anmälningar, GDPR-begäranden och informationsförfrågningar med bulk-sändning och statusspårning.",
};

export default async function MassAppealsPage() {
  const catalog = getMassAppealCatalog();
  const automatedAppeals = await listAutomatedAppealJobs();

  return (
    <div className="shell space-y-12 pb-20 pt-10 md:pt-14">
      <MassAppealsWorkbench catalog={catalog} />
      <AutomatedAppealWorkbench initialItems={automatedAppeals} />
    </div>
  );
}