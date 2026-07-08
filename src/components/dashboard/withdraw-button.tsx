"use client";

import { useState } from "react";
import { ArrowDownToLine, X, Check } from "lucide-react";
import { Input, FieldLabel } from "@/components/ui/input";
import { requestWithdrawal } from "@/app/dashboard/actions";
import { cn } from "@/lib/utils";

const METHODS = [
  { key: "wise" as const, name: "Wise", rate: 0.005, label: "~0.5% fee" },
  { key: "paypal" as const, name: "PayPal", rate: 0.04, label: "~3–5% fee" },
];

export function WithdrawButton({
  balance,
  defaultMethod = "wise",
}: {
  balance: number;
  defaultMethod?: "wise" | "paypal";
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [amount, setAmount] = useState(balance.toFixed(2));
  const [method, setMethod] = useState<"wise" | "paypal">(defaultMethod);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amt = Math.min(Math.max(Number(amount) || 0, 0), balance);
  const rate = METHODS.find((m) => m.key === method)!.rate;
  const fee = amt * rate;
  const net = amt - fee;

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      setDone(false);
      setError(null);
    }, 200);
  };

  const confirm = async () => {
    setSubmitting(true);
    setError(null);
    const res = await requestWithdrawal({
      amountCents: Math.round(amt * 100),
      method,
    });
    setSubmitting(false);
    if (res.ok) setDone(true);
    else setError(res.error ?? "Could not process the withdrawal.");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia px-6 py-2.5 text-sm font-medium text-white shadow-[0_8px_30px_-6px_rgba(139,92,246,0.6)] transition-all hover:-translate-y-0.5"
      >
        <ArrowDownToLine size={16} />
        Withdraw ${balance.toFixed(2)}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={close}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-ink/10 bg-surface p-6 shadow-2xl">
            <button
              onClick={close}
              className="absolute right-4 top-4 text-muted transition-colors hover:text-foreground"
            >
              <X size={20} />
            </button>

            {done ? (
              <div className="py-6 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-indigo via-brand-violet to-brand-fuchsia text-white shadow-[0_0_30px_-6px_rgba(139,92,246,0.8)]">
                  <Check size={28} />
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-tight">
                  Withdrawal requested
                </h3>
                <p className="mt-2 text-sm text-muted">
                  ${net.toFixed(2)} is on its way via{" "}
                  {METHODS.find((m) => m.key === method)!.name}. Payouts are
                  processed weekly.
                </p>
                <button
                  onClick={close}
                  className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full border border-ink/15 bg-ink/5 font-medium transition-colors hover:bg-ink/10"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold tracking-tight">
                  Withdraw funds
                </h3>
                <p className="mt-1 text-sm text-muted">
                  Available: ${balance.toFixed(2)}
                </p>

                <div className="mt-5">
                  <FieldLabel htmlFor="amount">Amount (USD)</FieldLabel>
                  <Input
                    id="amount"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="mt-4">
                  <FieldLabel>Method</FieldLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {METHODS.map((m) => (
                      <button
                        key={m.key}
                        onClick={() => setMethod(m.key)}
                        className={cn(
                          "rounded-xl border px-4 py-2.5 text-sm transition-colors",
                          method === m.key
                            ? "border-primary/50 bg-primary/10 text-foreground"
                            : "border-ink/10 bg-ink/5 text-muted hover:text-foreground",
                        )}
                      >
                        <div className="font-medium">{m.name}</div>
                        <div className="text-xs text-muted">{m.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 space-y-2 rounded-xl border border-ink/10 bg-ink/[0.02] p-4 text-sm">
                  <Row label="Amount" value={`$${amt.toFixed(2)}`} />
                  <Row label="Estimated fee" value={`- $${fee.toFixed(2)}`} muted />
                  <div className="my-1 h-px bg-ink/10" />
                  <Row label="You receive" value={`$${net.toFixed(2)}`} bold />
                </div>

                {error && (
                  <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {error}
                  </p>
                )}

                <button
                  onClick={confirm}
                  disabled={amt <= 0 || submitting}
                  className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia font-medium text-white shadow-[0_8px_30px_-8px_rgba(139,92,246,0.6)] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {submitting ? "Processing…" : "Confirm withdrawal"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Row({
  label,
  value,
  muted,
  bold,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span
        className={cn(
          muted && "text-muted",
          bold && "font-semibold text-primary",
        )}
      >
        {value}
      </span>
    </div>
  );
}
