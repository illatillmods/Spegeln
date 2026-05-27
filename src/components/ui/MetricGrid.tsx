type MetricItem = {
  label: string;
  value: string | number;
  hint?: string;
};

export function MetricGrid({ items }: { items: MetricItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <article className="metric-card" key={item.label}>
          <p className="eyebrow">{item.label}</p>
          <p className="mt-1 text-2xl font-semibold">{item.value}</p>
          {item.hint ? <p className="mt-1 text-(--muted) text-xs leading-6">{item.hint}</p> : null}
        </article>
      ))}
    </div>
  );
}
