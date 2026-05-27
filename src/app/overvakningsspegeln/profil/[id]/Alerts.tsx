"use client";

import type { WatchAlertItem } from "@/lib/watchdog";

type AlertsProps = {
  alerts: WatchAlertItem[];
};

const severityClasses = {
  info: "bg-[rgba(15,118,110,0.1)] border-[rgba(15,118,110,0.16)]",
  warning: "bg-[rgba(194,107,20,0.12)] border-[rgba(194,107,20,0.18)]",
  critical: "bg-[rgba(153,27,27,0.1)] border-[rgba(153,27,27,0.18)]",
};

export function Alerts({ alerts }: AlertsProps) {
  return (
    <section className="surface rounded-4xl p-6 md:p-8 reveal">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Offentliga alerts</p>
          <h2 className="mt-2 font-title text-4xl">Nya verifierade poster som kräver uppföljning.</h2>
        </div>
        <span className="tag">{alerts.length} aktiva alerts</span>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {alerts.length === 0 ? (
          <div className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/80 p-4 text-(--muted)">Inga nya alerts.</div>
        ) : (
          alerts.map((alert) => (
            <article className={`rounded-3xl border p-4 ${severityClasses[alert.severity]}`} key={alert.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">{alert.source}</p>
                  <h3 className="mt-1 text-lg font-semibold">{alert.message}</h3>
                </div>
                <span className="tag">{alert.severity}</span>
              </div>
              <p className="mt-3 text-(--muted) text-sm leading-7">Utlösare: {alert.trigger}</p>
              <p className="mt-2 text-(--muted) text-xs">{alert.date}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
