"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  Star,
  Flag,
  SkipForward,
  ArrowRight,
  Check,
  ChevronDown,
  Keyboard,
  PartyPopper,
} from "lucide-react";
import { Textarea } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { submitTask, type TaskResult } from "@/app/work/actions";
import type { WorkspaceKind, WorkspaceTask } from "@/lib/mock-tasks";
import { cn } from "@/lib/utils";

type Project = {
  id: string;
  title: string;
  taskType: string;
  payRate: string;
};

const RATING_ISSUES = ["Inaccurate", "Unsafe", "Off-topic", "Poor grammar"];
const FLAG_REASONS = ["Broken / unreadable", "Offensive content", "Unclear prompt"];

function fmtTime(total: number) {
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function TaskWorkspace({
  project,
  kind,
  tasks,
}: {
  project: Project;
  kind: WorkspaceKind;
  tasks: WorkspaceTask[];
}) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"task" | "result">("task");
  const [elapsed, setElapsed] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [flagging, setFlagging] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // per-task answer state
  const [rating, setRating] = useState(0);
  const [issues, setIssues] = useState<string[]>([]);
  const [choice, setChoice] = useState<"A" | "tie" | "B" | null>(null);
  const [rationale, setRationale] = useState("");
  const [writingResponse, setWritingResponse] = useState("");

  // outcome of the task just submitted + running session totals
  const [last, setLast] = useState<{
    action: TaskResult["action"];
    amountCents: number;
    timeSec: number;
  } | null>(null);
  const [session, setSession] = useState({
    completed: 0,
    skipped: 0,
    flagged: 0,
    earnedCents: 0,
    timeSec: 0,
  });

  const task = tasks[index];
  const hasMore = index + 1 < tasks.length;

  const resetAnswer = useCallback(() => {
    setRating(0);
    setIssues([]);
    setChoice(null);
    setRationale("");
    setWritingResponse("");
    setFlagging(false);
    setNotice(null);
    setElapsed(0);
  }, []);

  // per-task timer — only runs while actively working a task
  useEffect(() => {
    if (phase !== "task") return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [phase, index]);

  // persist ONE task, then show its result screen
  const persist = useCallback(
    async (action: TaskResult["action"], data?: Record<string, unknown>) => {
      if (!task || submitting) return;
      setSubmitting(true);
      setNotice(null);
      let res;
      try {
        res = await submitTask(project.id, {
          taskId: task.id,
          action,
          timeSpentSec: elapsed,
          data,
        });
      } catch {
        setSubmitting(false);
        setNotice("Could not save your work. Please check your connection and try again.");
        return;
      }
      setSubmitting(false);
      if (!res.ok) {
        setNotice(res.error ?? "Could not save your work. Please try again.");
        return;
      }
      const amt = res.amountCents ?? 0;
      setLast({ action, amountCents: amt, timeSec: elapsed });
      setSession((s) => ({
        completed: s.completed + (action === "completed" ? 1 : 0),
        skipped: s.skipped + (action === "skipped" ? 1 : 0),
        flagged: s.flagged + (action === "flagged" ? 1 : 0),
        earnedCents: s.earnedCents + amt,
        timeSec: s.timeSec + elapsed,
      }));
      setPhase("result");
    },
    [task, submitting, elapsed, project.id],
  );

  const submit = useCallback(() => {
    if (!task) return;
    if (task.kind === "rating" && rating === 0) {
      setNotice("Please give a star rating before submitting.");
      return;
    }
    if (task.kind === "comparison" && choice === null) {
      setNotice("Please choose which response is better.");
      return;
    }
    if (task.kind === "writing" && writingResponse.trim().length < 10) {
      setNotice("Please write a response before submitting.");
      return;
    }
    const data =
      task.kind === "rating"
        ? { rating, issues, rationale }
        : task.kind === "comparison"
          ? { choice, rationale }
          : { response: writingResponse.trim(), rationale };
    persist("completed", data);
  }, [task, rating, issues, choice, rationale, writingResponse, persist]);

  const skip = useCallback(() => persist("skipped"), [persist]);
  const flag = useCallback(
    (reason?: string) => persist("flagged", reason ? { reason } : undefined),
    [persist],
  );

  const nextTask = useCallback(() => {
    if (!hasMore) return;
    setIndex((i) => i + 1);
    resetAnswer();
    setPhase("task");
  }, [hasMore, resetAnswer]);

  // keyboard shortcuts (only while working a task, ignored while typing)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || phase !== "task") return;
      if (!task) return;

      if (task.kind === "rating" && ["1", "2", "3", "4", "5"].includes(e.key)) {
        setRating(Number(e.key));
        setNotice(null);
      }
      if (task.kind === "comparison") {
        if (e.key === "1") setChoice("A");
        if (e.key === "2") setChoice("tie");
        if (e.key === "3") setChoice("B");
        if (["1", "2", "3"].includes(e.key)) setNotice(null);
      }
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [task, phase, submit]);

  /* ── unsupported type ───────────────────────────────────────────── */
  if (kind === "unsupported") {
    return (
      <CenteredMessage
        projectId={project.id}
        title="Workspace coming soon"
        body={`The "${project.taskType}" workspace isn't built yet. We started with rating, comparison, and writing tasks.`}
      />
    );
  }

  /* ── no tasks left for this trainer ─────────────────────────────── */
  if (tasks.length === 0) {
    return (
      <CenteredMessage
        projectId={project.id}
        title="You're all caught up! 🎉"
        body="There are no more tasks available on this project right now. Check back soon or pick another project."
      />
    );
  }

  /* ── per-task result ────────────────────────────────────────────── */
  if (phase === "result") {
    const action = last?.action ?? "completed";
    const title =
      action === "completed"
        ? "Task submitted!"
        : action === "skipped"
          ? "Task skipped"
          : "Task flagged";
    const Icon =
      action === "completed" ? PartyPopper : action === "skipped" ? SkipForward : Flag;
    return (
      <div className="relative grid min-h-screen place-items-center px-5">
        <div className="absolute right-5 top-5">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-indigo via-brand-violet to-brand-fuchsia text-white shadow-[0_0_40px_-6px_rgba(139,92,246,0.8)]">
            <Icon size={30} />
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-muted">
            {action === "completed"
              ? "Nice work — here's what this task earned you."
              : "Got it. Ready for the next one?"}
          </p>

          {/* this task */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <SummaryStat label="Time on task" value={fmtTime(last?.timeSec ?? 0)} />
            <SummaryStat
              label="Earned"
              value={`$${((last?.amountCents ?? 0) / 100).toFixed(2)}`}
              accent
            />
          </div>
          {action === "completed" && (
            <p className="mt-3 text-xs text-muted">
              Added to your pending balance — clears after QA review.
            </p>
          )}

          {/* session so far */}
          <div className="mt-6 rounded-2xl border border-ink/10 bg-ink/[0.02] p-4">
            <div className="text-xs uppercase tracking-wider text-muted">
              This session
            </div>
            <div className="mt-2 flex items-center justify-center gap-6 text-sm">
              <span>
                <span className="font-semibold">{session.completed}</span> done
              </span>
              <span>
                <span className="font-semibold text-primary">
                  ${(session.earnedCents / 100).toFixed(2)}
                </span>{" "}
                earned
              </span>
              <span>
                <span className="font-semibold">{fmtTime(session.timeSec)}</span> total
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            {hasMore ? (
              <button
                onClick={nextTask}
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia font-medium text-white shadow-[0_8px_30px_-6px_rgba(139,92,246,0.6)] transition-all hover:-translate-y-0.5"
              >
                Next task
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </button>
            ) : (
              <p className="rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-3 text-sm text-muted">
                That was the last available task here. 🎉
              </p>
            )}
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-full border border-ink/15 bg-ink/5 font-medium transition-colors hover:bg-ink/10"
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── active task ────────────────────────────────────────────────── */
  return (
    <div className="flex min-h-screen flex-col">
      {/* top bar */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-background/80 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/projects/${project.id}`}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-ink/5 hover:text-foreground"
              aria-label="Exit workspace"
            >
              <X size={18} />
            </Link>
            <div className="hidden sm:block">
              <div className="text-sm font-medium leading-tight">
                {project.title}
              </div>
              <div className="text-xs text-muted">{project.taskType}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <span className="font-mono text-sm tabular-nums text-muted">
              {fmtTime(elapsed)}
            </span>
            <span className="text-sm text-muted">
              Task <span className="text-foreground">{session.completed + session.skipped + session.flagged + 1}</span>
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* body */}
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
        {/* instructions */}
        <div className="mb-6 overflow-hidden rounded-xl border border-ink/10 bg-ink/[0.02]">
          <button
            onClick={() => setShowInstructions((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
          >
            <span className="flex items-center gap-2">
              <Keyboard size={16} className="text-primary" />
              Instructions & shortcuts
            </span>
            <ChevronDown
              size={18}
              className={cn(
                "text-muted transition-transform",
                showInstructions && "rotate-180",
              )}
            />
          </button>
          {showInstructions && (
            <div className="border-t border-ink/10 px-4 py-3 text-sm text-muted">
              {kind === "rating" ? (
                <p>
                  Read the prompt and the AI&apos;s response, then rate its
                  overall quality from 1–5 stars. Flag any issues and add a short
                  rationale. <br />
                  <span className="text-foreground/80">
                    Shortcuts: 1–5 to rate · Enter to submit.
                  </span>
                </p>
              ) : kind === "comparison" ? (
                <p>
                  Read the prompt and both responses, then choose which is better
                  (or a tie) and explain why. <br />
                  <span className="text-foreground/80">
                    Shortcuts: 1 = A better · 2 = Tie · 3 = B better · Enter to
                    submit.
                  </span>
                </p>
              ) : (
                <p>
                  Read the prompt carefully and write the best response you can —
                  accurate, clear, and complete. Take your time; quality matters.
                </p>
              )}
            </div>
          )}
        </div>

        {/* prompt */}
        <div className="mb-5">
          <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted">
            Prompt
          </div>
          <div className="rounded-xl border border-ink/10 bg-ink/[0.03] p-4 text-[15px] leading-relaxed">
            {task.prompt}
          </div>
        </div>

        {/* task body */}
        {task.kind === "rating" && (
          <RatingTask
            response={task.response}
            rating={rating}
            setRating={(n) => {
              setRating(n);
              setNotice(null);
            }}
            issues={issues}
            toggleIssue={(v) =>
              setIssues((arr) =>
                arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v],
              )
            }
          />
        )}

        {task.kind === "comparison" && (
          <ComparisonTask
            responseA={task.responseA}
            responseB={task.responseB}
            choice={choice}
            setChoice={(c) => {
              setChoice(c);
              setNotice(null);
            }}
          />
        )}

        {task.kind === "writing" && (
          <div>
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted">
              Your response
            </div>
            <Textarea
              rows={10}
              value={writingResponse}
              onChange={(e) => {
                setWritingResponse(e.target.value);
                setNotice(null);
              }}
              placeholder="Write your response to the prompt here…"
              className="font-mono text-sm"
            />
            <div className="mt-1 text-right text-xs text-muted">
              {writingResponse.trim().length} characters
            </div>
          </div>
        )}

        {/* rationale (not shown for writing — the response is the answer) */}
        {task.kind !== "writing" && (
          <div className="mt-5">
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted">
              Rationale {task.kind === "comparison" && "(why?)"}
            </div>
            <Textarea
              rows={3}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Optional: briefly explain your decision…"
            />
          </div>
        )}

        {notice && (
          <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
            {notice}
          </p>
        )}
      </div>

      {/* action bar */}
      <footer className="sticky bottom-0 border-t border-ink/10 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {flagging ? (
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <span className="text-sm text-muted">Reason:</span>
              {FLAG_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => flag(r)}
                  className="rounded-full border border-ink/10 bg-ink/5 px-3 py-1 text-sm text-muted hover:text-foreground"
                >
                  {r}
                </button>
              ))}
              <button
                onClick={() => setFlagging(false)}
                className="text-sm text-muted hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFlagging(true)}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted transition-colors hover:bg-ink/5 hover:text-foreground disabled:opacity-50"
                >
                  <Flag size={15} /> Flag
                </button>
                <button
                  onClick={skip}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted transition-colors hover:bg-ink/5 hover:text-foreground disabled:opacity-50"
                >
                  <SkipForward size={15} /> Skip
                </button>
              </div>

              <button
                onClick={submit}
                disabled={submitting}
                className="group inline-flex h-10 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia px-6 text-sm font-medium text-white shadow-[0_8px_30px_-8px_rgba(139,92,246,0.6)] transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {submitting ? "Saving…" : "Submit"}
                {!submitting && (
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                )}
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}

/* ───────────────────────────────────────────────────── task bodies ── */

function RatingTask({
  response,
  rating,
  setRating,
  issues,
  toggleIssue,
}: {
  response: string;
  rating: number;
  setRating: (n: number) => void;
  issues: string[];
  toggleIssue: (v: string) => void;
}) {
  return (
    <>
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted">
        AI response
      </div>
      <div className="rounded-xl border border-ink/10 bg-ink/[0.03] p-4 text-[15px] leading-relaxed">
        {response}
      </div>

      <div className="mt-5">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
          Overall quality
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              aria-label={`${n} stars`}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={30}
                className={
                  n <= rating ? "fill-amber-400 text-amber-400" : "text-ink/20"
                }
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-muted">{rating} / 5</span>
          )}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
          Issues (if any)
        </div>
        <div className="flex flex-wrap gap-2">
          {RATING_ISSUES.map((issue) => {
            const on = issues.includes(issue);
            return (
              <button
                key={issue}
                onClick={() => toggleIssue(issue)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                  on
                    ? "border-red-500/40 bg-red-500/10 text-red-300"
                    : "border-ink/10 bg-ink/5 text-muted hover:text-foreground",
                )}
              >
                {issue}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function ComparisonTask({
  responseA,
  responseB,
  choice,
  setChoice,
}: {
  responseA: string;
  responseB: string;
  choice: "A" | "tie" | "B" | null;
  setChoice: (c: "A" | "tie" | "B") => void;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {(["A", "B"] as const).map((key) => (
          <div
            key={key}
            className={cn(
              "rounded-xl border p-4 transition-colors",
              choice === key
                ? "border-primary/60 bg-primary/5"
                : "border-ink/10 bg-ink/[0.03]",
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">
                Response {key}
              </span>
              {choice === key && (
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
                  Selected
                </span>
              )}
            </div>
            <p className="text-[15px] leading-relaxed">
              {key === "A" ? responseA : responseB}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
          Which is better?
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { key: "A", label: "A is better", hint: "1" },
              { key: "tie", label: "Tie", hint: "2" },
              { key: "B", label: "B is better", hint: "3" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setChoice(opt.key)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors",
                choice === opt.key
                  ? "border-primary/60 bg-primary/15 text-foreground"
                  : "border-ink/10 bg-ink/5 text-muted hover:text-foreground",
              )}
            >
              {choice === opt.key && <Check size={15} className="text-primary" />}
              {opt.label}
              <kbd className="rounded bg-ink/10 px-1.5 text-xs text-muted">
                {opt.hint}
              </kbd>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/* ───────────────────────────────────────────────────────── helpers ── */

function SummaryStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-ink/10 bg-ink/[0.02] p-4">
      <div
        className={cn(
          "text-xl font-semibold tracking-tight",
          accent && "text-primary",
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
    </div>
  );
}

function CenteredMessage({
  projectId,
  title,
  body,
}: {
  projectId: string;
  title: string;
  body: string;
}) {
  return (
    <div className="relative grid min-h-screen place-items-center px-5 text-center">
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>
      <div className="max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-muted">{body}</p>
        <Link
          href={`/dashboard/projects/${projectId}`}
          className="mt-8 inline-flex h-11 items-center justify-center rounded-full border border-ink/15 bg-ink/5 px-6 font-medium transition-colors hover:bg-ink/10"
        >
          Back to project
        </Link>
      </div>
    </div>
  );
}
