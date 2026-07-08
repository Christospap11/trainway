"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus } from "lucide-react";
import { setTrainerStatus, toggleQualification } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

type Status = "PENDING" | "APPROVED" | "WAITLISTED" | "REJECTED" | "SUSPENDED";

const OPTIONS: { value: Status; label: string; tone: string }[] = [
  { value: "APPROVED", label: "Approve", tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20" },
  { value: "WAITLISTED", label: "Waitlist", tone: "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20" },
  { value: "SUSPENDED", label: "Suspend", tone: "border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20" },
  { value: "REJECTED", label: "Reject", tone: "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20" },
];

export function TrainerStatusControl({ userId, current }: { userId: string; current: Status }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const set = (status: Status) =>
    start(async () => {
      setError(null);
      const res = await setTrainerStatus(userId, status);
      if (!res.ok) setError(res.error ?? "Failed.");
      else router.refresh();
    });

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => set(o.value)}
            disabled={busy || current === o.value}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40",
              o.tone,
            )}
          >
            {current === o.value && <Check size={14} />}
            {o.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}

export function QualificationToggle({
  userId,
  projectId,
  qualified,
}: {
  userId: string;
  projectId: string;
  qualified: boolean;
}) {
  const router = useRouter();
  const [busy, start] = useTransition();

  const toggle = () =>
    start(async () => {
      await toggleQualification(userId, projectId, !qualified);
      router.refresh();
    });

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
        qualified
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
          : "border-ink/15 bg-ink/5 text-muted hover:bg-ink/10 hover:text-foreground",
      )}
    >
      {qualified ? <Check size={14} /> : <Plus size={14} />}
      {qualified ? "Qualified" : "Qualify"}
    </button>
  );
}
