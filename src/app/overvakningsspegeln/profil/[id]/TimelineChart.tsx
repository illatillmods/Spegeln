"use client";

import type { WatchTimelineEvent } from "@/lib/watchdog";

type TimelineChartProps = {
  events: WatchTimelineEvent[];
};

function getPosition(date: string, minTime: number, span: number) {
  const currentTime = new Date(date).getTime();

  if (span <= 0) {
    return 50;
  }

  return ((currentTime - minTime) / span) * 100;
}

export function TimelineChart({ events }: TimelineChartProps) {
  if (events.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-[1.75rem] bg-[rgba(22,32,42,0.04)] text-(--muted)">
        Ingen tidslinjedata tillgänglig ännu.
      </div>
    );
  }

  const orderedEvents = [...events].sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());
  const minTime = new Date(orderedEvents[0].date).getTime();
  const maxTime = new Date(orderedEvents[orderedEvents.length - 1].date).getTime();
  const span = maxTime - minTime;

  return (
    <div className="rounded-[1.75rem] border border-[rgba(22,32,42,0.08)] bg-white/75 p-5">
      <div className="relative h-28 overflow-hidden rounded-[1.4rem] bg-[linear-gradient(180deg,rgba(216,238,232,0.55),rgba(255,255,255,0.82))] px-4 py-5">
        <div className="absolute left-4 right-4 top-1/2 h-px -translate-y-1/2 bg-[rgba(22,32,42,0.18)]" />
        {orderedEvents.map((event) => {
          const position = getPosition(event.date, minTime, span);

          return (
            <div className="absolute top-1/2 w-32 -translate-x-1/2 -translate-y-1/2" key={event.id} style={{ left: `${position}%` }}>
              <div className="flex flex-col items-center text-center">
                <div className={`h-4 w-4 rounded-full border-2 border-white shadow ${event.highlight ? "bg-[rgb(194,107,20)]" : "bg-[rgb(15,118,110)]"}`} />
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-(--muted)">
                  {new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "short" }).format(new Date(event.date))}
                </p>
                <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-(--foreground)">{event.title}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {orderedEvents.map((event) => (
          <span className="tag" key={`${event.id}-legend`}>
            {event.category}
          </span>
        ))}
      </div>
    </div>
  );
}
