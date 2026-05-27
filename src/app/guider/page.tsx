import type { Metadata } from "next";
import { StartHub } from "@/components/StartHub";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export const metadata: Metadata = {
  title: "Så fungerar Spegeln",
  description: "Guide till Spegelns viktigaste arbetsytor, flöden och beslutsvägar.",
};

export default function GuidesPage() {
  return (
    <>
      <Breadcrumbs items={[{ href: "/", label: "Start" }, { label: "Guide" }]} />
      <StartHub />
    </>
  );
}