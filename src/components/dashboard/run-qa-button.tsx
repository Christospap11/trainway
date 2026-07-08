"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { runQA } from "@/app/dashboard/actions";

/**
 * Manual QA trigger (dev/admin). Runs gold-task review over pending batches:
 * passing batches clear to the available balance, failing ones are rejected.
 */
export function RunQAButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const run = () =>
    start(async () => {
      setMsg(null);
      const r = await runQA();
      if (!r.ok) {
        setMsg(r.error ?? "QA failed.");
        return;
      }
      const parts: string[] = [];
      if (r.cleared) parts.push(`${r.cleared} cleared (+$${((r.clearedCents ?? 0) / 100).toFixed(2)})`);
      if (r.rejected) parts.push(`${r.rejected} rejected`);
      setMsg(parts.length ? parts.join(" · ") : "Nothing eligible to review.");
      router.refresh();
    });

  return (
    <div className="flex items-center gap-3">
      {msg && <span className="text-sm text-muted">{msg}</span>}
      <button
        onClick={run}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-ink/5 px-4 py-2 text-sm font-medium transition-colors hover:bg-ink/10 disabled:opacity-60"
      >
        <ShieldCheck size={16} className="text-primary" />
        {pending ? "Reviewing…" : "Run QA review"}
      </button>
    </div>
  );
}
