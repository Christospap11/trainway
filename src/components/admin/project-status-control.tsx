"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setProjectStatus } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

const OPTIONS = [
  ["AVAILABLE", "Available"],
  ["ACTIVE", "Active"],
  ["QUALIFYING", "Qualifying"],
  ["PAUSED", "Paused"],
] as const;

export function ProjectStatusControl({
  slug,
  current,
}: {
  slug: string;
  current: string;
}) {
  const router = useRouter();
  const [busy, start] = useTransition();

  const set = (status: (typeof OPTIONS)[number][0]) =>
    start(async () => {
      await setProjectStatus(slug, status);
      router.refresh();
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted">Status:</span>
      {OPTIONS.map(([value, label]) => (
        <button
          key={value}
          onClick={() => set(value)}
          disabled={busy || current === value}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors disabled:opacity-60",
            current === value
              ? "border-primary/50 bg-primary/10 text-foreground"
              : "border-ink/15 bg-ink/5 text-muted hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
