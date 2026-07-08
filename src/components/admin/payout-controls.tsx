"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { markPayout } from "@/app/admin/actions";

export function PayoutControls({ payoutId }: { payoutId: string }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const mark = (result: "paid" | "failed") =>
    start(async () => {
      setError(null);
      const res = await markPayout(payoutId, result);
      if (!res.ok) setError(res.error ?? "Failed.");
      else router.refresh();
    });

  return (
    <div className="flex items-center gap-2">
      {error && <span className="mr-1 text-sm text-red-300">{error}</span>}
      <button
        onClick={() => mark("failed")}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-60"
      >
        <X size={15} /> Mark failed
      </button>
      <button
        onClick={() => mark("paid")}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-60"
      >
        <Check size={15} /> {busy ? "…" : "Mark paid"}
      </button>
    </div>
  );
}
