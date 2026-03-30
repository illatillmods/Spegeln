"use client";

type IncomePoint = {
  year: number;
  income: number;
};

type IncomeChartProps = {
  data: IncomePoint[];
};

export function IncomeChart({ data }: IncomeChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center rounded-[1.75rem] bg-[rgba(22,32,42,0.04)] text-(--muted)">
        Ingen inkomstdata tillgänglig.
      </div>
    );
  }

  const maxIncome = Math.max(...data.map((item) => item.income));

  return (
    <div className="rounded-[1.75rem] border border-[rgba(22,32,42,0.08)] bg-white/80 p-5">
      <div className="flex h-52 items-end justify-between gap-3">
        {data.map((item) => {
          const heightPercent = maxIncome === 0 ? 0 : (item.income / maxIncome) * 100;

          return (
            <div className="flex flex-1 flex-col items-center gap-3" key={item.year}>
              <p className="text-center text-xs font-medium text-(--muted)">{item.income.toLocaleString("sv-SE")} kr</p>
              <div className="flex h-40 w-full items-end rounded-[1.5rem] bg-[rgba(22,32,42,0.05)] px-2 pb-2">
                <div
                  className="w-full rounded-[1rem] bg-[linear-gradient(180deg,rgba(15,118,110,0.92),rgba(15,118,110,0.48))]"
                  style={{ height: `${Math.max(12, heightPercent)}%` }}
                />
              </div>
              <p className="text-sm font-semibold">{item.year}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
