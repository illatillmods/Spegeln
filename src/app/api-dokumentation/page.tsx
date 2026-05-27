import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentLocale } from "@/lib/i18n";
import { serverApiJson } from "@/lib/server-api";

type ApiDocumentationSpec = {
  paths: Record<string, Record<string, { summary?: string }>>;
};

export const metadata: Metadata = {
  title: "API-dokumentation",
  description: "OpenAPI och integrationsinformation för Spegelns publika och premiumorienterade API-flöden.",
};

export default async function ApiDocumentationPage() {
  const locale = await getCurrentLocale();
  const spec = await serverApiJson<ApiDocumentationSpec>("/api/public/openapi");
  const endpoints = Object.entries(spec.paths);

  return (
    <div className="shell space-y-16 pb-20 pt-10 md:pt-14">
      <section className="grid gap-6 lg:grid-cols-[1fr_0.92fr] lg:items-start">
        <div className="space-y-5 reveal">
          <p className="eyebrow">OpenAPI</p>
          <h1 className="font-title text-5xl leading-none sm:text-6xl">
            {locale === "en" ? "Third-party integrations with explicit pressure tiers." : "Tredjepartsintegrationer med tydliga trycknivåer."}
          </h1>
          <p className="max-w-2xl text-(--muted) text-lg leading-8">
            {locale === "en"
              ? "The public API stays open and rate-limited. Premium API access unlocks heavier data flows for newsrooms, partners, and custom systems that want to build on the pressure."
              : "Det publika API:t är öppet och rate-limitat. Premium-API låser upp tyngre dataflöden för redaktioner, partners och egna system som vill bygga vidare på trycket."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="btn-primary" href="/api/public/openapi">
              {locale === "en" ? "Open raw OpenAPI JSON" : "Öppna rå OpenAPI-JSON"}
            </Link>
            <Link className="btn-secondary" href="/prissattning">
              {locale === "en" ? "See API pricing" : "Se API-pris"}
            </Link>
          </div>
        </div>
        <aside className="surface-strong rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "120ms" }}>
          <p className="eyebrow">Integration notes</p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-(--foreground)">
            <li className="flex gap-3"><span className="signal-dot mt-2 shrink-0" /><span>{locale === "en" ? "API keys are hashed in PostgreSQL and checked against route-level scopes." : "API-nycklar hash:as i PostgreSQL och kontrolleras mot rutspecifika scopes."}</span></li>
            <li className="flex gap-3"><span className="signal-dot mt-2 shrink-0" /><span>{locale === "en" ? "Premium access is intended for bulk data, newsroom dashboards, and partner integrations." : "Premium-access är avsedd för bulkdata, redaktionsdashboards och partnerintegrationer."}</span></li>
            <li className="flex gap-3"><span className="signal-dot mt-2 shrink-0" /><span>{locale === "en" ? "Elevated scopes are handed out for uses that strengthen open data flows, exports, and public scrutiny." : "Utökade scopes delas ut för användning som stärker öppna dataflöden, export och offentlig granskning."}</span></li>
          </ul>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {endpoints.map(([path, methods], index) => (
          <article className="surface rounded-[1.9rem] p-6 reveal" key={path} style={{ animationDelay: `${index * 90}ms` }}>
            <p className="eyebrow">{path}</p>
            {Object.entries(methods || {}).map(([method, operation]) => {
              const typedOperation = operation as { summary?: string };

              return (
                <div className="mt-3 rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/75 p-4" key={method}>
                  <p className="text-(--muted) text-xs font-semibold uppercase tracking-[0.24em]">{method}</p>
                  <p className="mt-2 text-(--foreground) text-sm leading-7">{typedOperation.summary}</p>
                </div>
              );
            })}
          </article>
        ))}
      </section>
    </div>
  );
}