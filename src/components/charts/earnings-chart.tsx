/**
 * Dependency-free earnings bar chart (earnings over time). Each bar = one week,
 * labelled by the week-ending date; hover shows the exact amount.
 *
 * Bars use absolute positioning inside full-height (stretched) columns so the
 * percentage heights always resolve — a plain `items-end` flex row collapses
 * the columns to zero height and the bars never show.
 */
export function EarningsChart({
  data,
}: {
  data: { label: string; amount: number }[];
}) {
  const max = Math.max(...data.map((d) => d.amount), 1);
  const total = data.reduce((n, d) => n + d.amount, 0);
  const peak = data.reduce(
    (m, d) => (d.amount > m.amount ? d : m),
    data[0] ?? { label: "", amount: 0 },
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-x-6 gap-y-1">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted">
            Last {data.length} weeks
          </div>
          <div className="text-2xl font-semibold tracking-tight text-primary">
            ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="text-xs text-muted">
          Best week: <span className="text-foreground">${peak.amount.toFixed(2)}</span>
        </div>
      </div>

      {/* bars — columns stretch to full height so % heights resolve */}
      <div className="flex h-44 gap-1.5 sm:gap-2">
        {data.map((d, i) => {
          const h = d.amount > 0 ? Math.max(4, Math.round((d.amount / max) * 100)) : 1.5;
          const isPeak = d.amount === peak.amount && d.amount > 0;
          return (
            <div key={i} className="group relative flex-1">
              <div
                style={{ height: `${h}%` }}
                className={`absolute bottom-0 w-full rounded-t-md transition-all duration-500 ${
                  isPeak
                    ? "bg-gradient-to-t from-brand-indigo to-brand-fuchsia"
                    : "bg-primary/30 group-hover:bg-primary/55"
                }`}
              >
                <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-ink/10 bg-background px-2 py-1 text-[11px] opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                  {d.label} · ${d.amount.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* date labels, aligned under the bars */}
      <div className="mt-2 flex gap-1.5 sm:gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[10px] tabular-nums text-muted">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
