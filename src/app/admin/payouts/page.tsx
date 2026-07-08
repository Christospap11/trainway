import type { Metadata } from "next";
import { Banknote } from "lucide-react";
import { listPayouts } from "@/lib/admin-queries";
import { PayoutControls } from "@/components/admin/payout-controls";

export const metadata: Metadata = { title: "Payouts · Admin" };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const STATUS_STYLE: Record<string, string> = {
  PAID: "bg-emerald-500/15 text-emerald-300",
  FAILED: "bg-red-500/15 text-red-300",
  PROCESSING: "bg-amber-500/15 text-amber-300",
};

export default async function AdminPayoutsPage() {
  const { processing, history } = await listPayouts();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Payouts</h2>
        <p className="mt-1 text-muted">
          {processing.length === 0 ? "Nothing to process." : `${processing.length} awaiting processing.`}
        </p>
      </div>

      {/* needs processing */}
      <div>
        <h3 className="mb-4 font-semibold">Needs processing</h3>
        {processing.length === 0 ? (
          <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-8 text-center text-muted">
            No payouts waiting. When trainers withdraw, requests appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {processing.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-fuchsia text-sm font-semibold text-white">
                    {p.initials}
                  </div>
                  <div>
                    <div className="font-medium">{p.trainer}</div>
                    <div className="text-xs text-muted">
                      {p.method} · requested {fmtDate(p.date)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-primary">${p.net.toFixed(2)}</div>
                    <div className="text-xs text-muted">${p.amount.toFixed(2)} − ${p.fee.toFixed(2)} fee</div>
                  </div>
                  <PayoutControls payoutId={p.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* history */}
      <div>
        <h3 className="mb-4 font-semibold">History</h3>
        <div className="space-y-2">
          {history.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-ink/10 bg-ink/[0.02] px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-ink/5 text-primary">
                  <Banknote size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium">{p.trainer}</div>
                  <div className="text-xs text-muted">{p.method} · {fmtDate(p.date)}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[p.status] ?? ""}`}>
                  {p.status.toLowerCase()}
                </span>
                <span className="font-semibold">${p.amount.toFixed(2)}</span>
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <div className="rounded-xl border border-ink/10 bg-ink/[0.02] px-5 py-6 text-center text-sm text-muted">
              No settled payouts yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
