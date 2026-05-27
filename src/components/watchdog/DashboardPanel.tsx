import type { DashboardItem } from "@/lib/public-insights";

type DashboardPanelProps = {
  items: DashboardItem[];
};

export function DashboardPanel({ items }: DashboardPanelProps) {
  return (
    <section className="surface rounded-4xl p-6 md:p-8">
      <p className="eyebrow">Realtidsdashboard</p>
      <h2 className="mt-2 font-title text-4xl">Mest belastade myndigheter just nu</h2>
      <p className="mt-4 max-w-2xl text-(--muted) text-sm leading-7">
        Tabellen kombinerar klagomål, granskningar och publicerad uppmärksamhet i en enkel, cachelagrad vy som kan filtreras på land, region och myndighetstyp via API:t.
      </p>
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm">
          <thead>
            <tr className="text-(--muted)">
              <th className="px-3">Myndighet</th>
              <th className="px-3">Kategori</th>
              <th className="px-3">Klagomål</th>
              <th className="px-3">Granskningar</th>
              <th className="px-3">Rapporter</th>
              <th className="px-3">Resolution</th>
              <th className="px-3">Attention</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr className="rounded-3xl bg-white/80" key={item.authorityId}>
                <td className="rounded-l-3xl px-3 py-4 font-semibold">{item.authorityName}</td>
                <td className="px-3 py-4">{item.category}</td>
                <td className="px-3 py-4">{item.complaints}</td>
                <td className="px-3 py-4">{item.investigations}</td>
                <td className="px-3 py-4">{item.reports}</td>
                <td className="px-3 py-4">{Math.round(item.resolutionRate * 100)}%</td>
                <td className="rounded-r-3xl px-3 py-4 font-semibold">{item.attentionScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}