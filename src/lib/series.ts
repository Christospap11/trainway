/**
 * Buckets earning entries into the last N weekly windows (ending today) for the
 * earnings charts. Returns dollar totals labelled by the week-ending date.
 */
export function weeklyEarningSeries(
  entries: { createdAt: Date; amountCents: number }[],
  weeks = 8,
): { label: string; amount: number }[] {
  const now = Date.now();
  const WEEK = 7 * 86_400_000;
  const out: { label: string; amount: number }[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const end = now - i * WEEK;
    const start = end - WEEK;
    const cents = entries.reduce((n, e) => {
      const t = e.createdAt.getTime();
      return t > start && t <= end ? n + e.amountCents : n;
    }, 0);
    const d = new Date(end);
    out.push({
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      amount: Math.round(cents) / 100,
    });
  }
  return out;
}
