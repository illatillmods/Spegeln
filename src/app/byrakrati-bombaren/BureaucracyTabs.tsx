"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/byrakrati-bombaren", label: "Massutskick" },
  { href: "/automatiserad-overklagare", label: "AI-överklagare" },
  { href: "/konto?tab=batcher", label: "Mina batcher" },
];

export function BureaucracyTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Byråkrati-verktyg" className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = pathname === tab.href || (tab.href === "/byrakrati-bombaren" && pathname === "/byrakrati-bombaren");

        return (
          <Link
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${active ? "bg-(--foreground) text-white" : "border border-[rgba(22,32,42,0.1)] bg-white/75 text-(--foreground) hover:-translate-y-0.5"}`}
            href={tab.href}
            key={tab.href}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
