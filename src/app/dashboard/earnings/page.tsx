import type { Metadata } from "next";
import { Wallet, ArrowDownToLine } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getEarnings, getEarningsChart } from "@/lib/queries";
import { WithdrawButton } from "@/components/dashboard/withdraw-button";
import { EarningsChart } from "@/components/charts/earnings-chart";

export const metadata: Metadata = { title: "Earnings" };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function EarningsPage() {
  const user = await getSession();
  if (!user) return null;
  const { available, pending, lifetime, payoutMethod, recent: recentEarnings, payouts } =
    await getEarnings(user.id);
  const chart = await getEarningsChart(user.id);

  const cards = [
    { label: "Available to withdraw", value: available, accent: true },
    { label: "Pending", value: pending, accent: false },
    { label: "Lifetime earnings", value: lifetime, accent: false },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Earnings</h2>
        <p className="mt-1 text-muted">
          Track what you&apos;ve earned and withdraw your balance.
        </p>
      </div>

      {/* balance cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-6"
          >
            <div className="text-sm text-muted">{c.label}</div>
            <div
              className={`mt-2 text-3xl font-semibold tracking-tight ${
                c.accent ? "text-primary" : ""
              }`}
            >
              ${c.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        ))}
      </div>

      {/* earnings over time */}
      <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-6">
        <h3 className="mb-1 font-semibold">Earnings over time</h3>
        <p className="mb-5 text-sm text-muted">Your weekly earnings by date.</p>
        <EarningsChart data={chart} />
      </div>

      {/* pending QA review (cleared by QA, not self-serve) */}
      {pending > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-5 py-4 text-sm text-muted">
          <span className="font-medium text-foreground">
            ${pending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>{" "}
          is pending QA review — it moves to your available balance once your work
          is approved.
        </div>
      )}

      {/* withdraw bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-gradient-to-r from-brand-indigo/10 via-brand-violet/10 to-brand-fuchsia/10 p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-ink/5 text-primary">
            <Wallet size={22} />
          </div>
          <div>
            <div className="font-medium">Ready to get paid?</div>
            <div className="text-sm text-muted">
              Withdraw to PayPal · paid out weekly
            </div>
          </div>
        </div>
        <WithdrawButton balance={available} defaultMethod={payoutMethod} />
      </div>

      {/* recent earnings */}
      <div>
        <h3 className="mb-4 font-semibold">Recent activity</h3>
        <div className="overflow-hidden rounded-2xl border border-ink/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-ink/[0.02] text-left text-muted">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Project</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">
                  Tasks
                </th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentEarnings.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-ink/5 last:border-0 hover:bg-ink/[0.02]"
                >
                  <td className="px-5 py-3.5 text-muted">{fmtDate(e.date)}</td>
                  <td className="px-5 py-3.5">
                    <div className="font-medium">{e.project}</div>
                    <div className="text-xs text-muted">{e.taskType}</div>
                  </td>
                  <td className="hidden px-5 py-3.5 text-muted sm:table-cell">
                    {e.tasks}
                  </td>
                  <td className="px-5 py-3.5">
                    {e.status === "cleared" ? (
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                        Cleared
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold">
                    ${e.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* payout history */}
      <div>
        <h3 className="mb-4 font-semibold">Payout history</h3>
        <div className="space-y-2">
          {payouts.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-ink/10 bg-ink/[0.02] px-5 py-3.5"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-ink/5 text-primary">
                  <ArrowDownToLine size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {p.method} withdrawal
                  </div>
                  <div className="text-xs text-muted">{fmtDate(p.date)}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    p.status === "paid"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : p.status === "failed"
                        ? "bg-red-500/15 text-red-300"
                        : "bg-amber-500/15 text-amber-300"
                  }`}
                >
                  {p.status === "paid" ? "Paid" : p.status === "failed" ? "Failed" : "Processing"}
                </span>
                <span className="font-semibold">${p.amount.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
