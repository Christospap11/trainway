"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProject } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

const OPTIONS = [
  ["RESPONSE_RATING", "Response rating", "Trainer rates a stored AI response — file needs a response column."],
  ["SIDE_BY_SIDE", "Side by side", "Trainer picks the better of two responses — needs responseA & responseB."],
  ["RESPONSE_WRITING", "Response writing", "Trainer writes the answer — file needs only a prompt."],
  ["CODE_GENERATION", "Code generation", "Trainer scores AI-written code against a spec — needs a code column (language optional)."],
  ["CODE_REFACTORING", "Code refactoring", "Trainer judges a refactor — needs original_code & refactored_code."],
  ["CODE_DEBUGGING", "Code debugging", "Trainer judges a diagnosis + fix — needs buggy_code & ai_response (error_output optional)."],
  ["CODE_REVIEW", "Code review", "Trainer reviews the AI's review — needs code & ai_review."],
] as const;

export function ProjectTypeControl({
  slug,
  current,
  taskCount,
}: {
  slug: string;
  current: string;
  taskCount: number;
}) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const locked = taskCount > 0;

  const set = (taskType: (typeof OPTIONS)[number][0]) =>
    start(async () => {
      setErr(null);
      const res = await updateProject(slug, { taskType });
      if (res.ok) router.refresh();
      else setErr(res.error ?? "Could not change the task type.");
    });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">Task type:</span>
        {OPTIONS.map(([value, label]) => (
          <button
            key={value}
            onClick={() => set(value)}
            disabled={busy || locked || current === value}
            title={locked && current !== value ? "Remove all tasks to change the type" : undefined}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              current === value
                ? "border-primary/50 bg-primary/10 text-foreground"
                : "border-ink/15 bg-ink/5 text-muted hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted">
        {locked
          ? "Remove all tasks below to switch this project to a different task type."
          : OPTIONS.find(([v]) => v === current)?.[2]}
      </p>
      {err && <p className="text-xs text-red-300">{err}</p>}
    </div>
  );
}
