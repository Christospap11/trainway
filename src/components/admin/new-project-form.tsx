"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea, Select, FieldLabel } from "@/components/ui/input";
import { createProject } from "@/app/admin/actions";

// Only task types with a working trainer workspace are offered, so admins
// can't create projects that trainers can't actually work.
const TASK_TYPES = [
  ["RESPONSE_RATING", "Response rating"],
  ["SIDE_BY_SIDE", "Side-by-side comparison"],
  ["RESPONSE_WRITING", "Response writing"],
  ["CODE_GENERATION", "Code generation"],
  ["CODE_REFACTORING", "Code refactoring"],
  ["CODE_DEBUGGING", "Code debugging"],
  ["CODE_REVIEW", "Code review"],
] as const;

// What each type's upload file has to contain, shown under the picker so an
// admin knows the required columns before they build the CSV.
const TYPE_COLUMNS: Record<string, string> = {
  RESPONSE_RATING: "CSV columns: prompt, response",
  SIDE_BY_SIDE: "CSV columns: prompt, response_a, response_b",
  RESPONSE_WRITING: "CSV columns: prompt",
  CODE_GENERATION: "CSV columns: prompt, code (+ optional language)",
  CODE_REFACTORING: "CSV columns: prompt, original_code, refactored_code (+ optional language)",
  CODE_DEBUGGING: "CSV columns: prompt, buggy_code, ai_response (+ optional error_output, language)",
  CODE_REVIEW: "CSV columns: prompt, code, ai_review (+ optional language)",
};

export function NewProjectForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({
    title: "",
    description: "",
    taskType: "RESPONSE_RATING",
    difficulty: "INTERMEDIATE",
    status: "AVAILABLE",
    payRateDollars: "20",
    tasksAvailable: "0",
  });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true);
    setError(null);
    const res = await createProject({
      title: f.title,
      description: f.description,
      taskType: f.taskType as never,
      difficulty: f.difficulty as never,
      status: f.status as never,
      payRateDollars: Number(f.payRateDollars),
      tasksAvailable: Number(f.tasksAvailable),
    });
    if (res.ok && res.slug) {
      router.push(`/admin/projects/${res.slug}`);
    } else {
      setError(res.error ?? "Could not create the project.");
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5 rounded-2xl border border-ink/10 bg-ink/[0.02] p-6">
      <div>
        <FieldLabel htmlFor="title">Title</FieldLabel>
        <Input id="title" value={f.title} onChange={set("title")} placeholder="Project Atlas — Reasoning Evaluations" />
      </div>
      <div>
        <FieldLabel htmlFor="desc">Description</FieldLabel>
        <Textarea id="desc" rows={3} value={f.description} onChange={set("description")} placeholder="What trainers will work on…" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="type">Task type</FieldLabel>
          <Select id="type" value={f.taskType} onChange={set("taskType")}>
            {TASK_TYPES.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
          <p className="mt-1.5 text-xs text-muted">{TYPE_COLUMNS[f.taskType]}</p>
        </div>
        <div>
          <FieldLabel htmlFor="diff">Difficulty</FieldLabel>
          <Select id="diff" value={f.difficulty} onChange={set("difficulty")}>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </Select>
        </div>
        <div>
          <FieldLabel htmlFor="status">Status</FieldLabel>
          <Select id="status" value={f.status} onChange={set("status")}>
            <option value="AVAILABLE">Available</option>
            <option value="ACTIVE">Active</option>
            <option value="QUALIFYING">Qualifying</option>
            <option value="PAUSED">Paused</option>
          </Select>
        </div>
        <div>
          <FieldLabel htmlFor="pay">Pay rate ($/hr)</FieldLabel>
          <Input id="pay" type="number" inputMode="decimal" value={f.payRateDollars} onChange={set("payRateDollars")} />
        </div>
        <div>
          <FieldLabel htmlFor="avail">Tasks available (display)</FieldLabel>
          <Input id="avail" type="number" inputMode="numeric" value={f.tasksAvailable} onChange={set("tasksAvailable")} />
        </div>
      </div>

      {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <button
        onClick={submit}
        disabled={busy}
        className="inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia px-6 text-sm font-medium text-white shadow-[0_8px_30px_-8px_rgba(139,92,246,0.6)] transition-all hover:-translate-y-0.5 disabled:opacity-60"
      >
        {busy ? "Creating…" : "Create project"}
      </button>
    </div>
  );
}
