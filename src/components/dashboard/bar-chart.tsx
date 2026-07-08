/** Minimal dependency-free bar chart for weekly earnings. */
export function BarChart({
  data,
}: {
  data: { week: string; amount: number }[];
}) {
  const max = Math.max(...data.map((d) => d.amount), 1);

  return (
    <div>
      {/* bars — columns stretch to full height so % heights resolve */}
      <div className="flex h-40 gap-2">
        {data.map((d, i) => {
          const h = d.amount > 0 ? Math.max(4, Math.round((d.amount / max) * 100)) : 1.5;
          const isLast = i === data.length - 1;
          return (
            <div key={d.week} className="group relative flex-1">
              <div
                style={{ height: `${h}%` }}
                className={`absolute bottom-0 w-full rounded-t-md transition-all duration-500 ${
                  isLast
                    ? "bg-gradient-to-t from-brand-indigo to-brand-fuchsia"
                    : "bg-primary/30 group-hover:bg-primary/55"
                }`}
              >
                <span className="pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-ink/10 bg-background px-1.5 py-0.5 text-[11px] opacity-0 transition-opacity group-hover:opacity-100">
                  ${d.amount}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {data.map((d) => (
          <span key={d.week} className="flex-1 text-center text-[11px] text-muted">
            {d.week}
          </span>
        ))}
      </div>
    </div>
  );
}
