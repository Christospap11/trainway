"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  Flag,
  SkipForward,
  ArrowRight,
  ChevronDown,
  Keyboard,
  PartyPopper,
} from "lucide-react";
import { Textarea } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { CodeBlock } from "@/components/work/code-block";
import { ScreenshotUpload } from "@/components/work/screenshot-upload";
import { submitTask, type TaskResult } from "@/app/work/actions";
import type { WorkspaceKind, WorkspaceTask } from "@/lib/mock-tasks";
import {
  CODING_CONFIGS,
  COMPARISON_DIMENSIONS,
  FEEDBACK_MIN,
  PREFERENCE_OPTIONS,
  RATING_DIMENSIONS,
  isCodingKind,
  prefDirection,
  type CodingConfig,
  type Dim,
} from "@/lib/rubrics";
import { cn } from "@/lib/utils";

type Project = {
  id: string;
  title: string;
  taskType: string;
  payRate: string;
};

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

  // per-task answer state (`ratings` + `feedback` are shared by rating & coding)
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [preferences, setPreferences] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");
  const [writingResponse, setWritingResponse] = useState("");
  const [proofChoice, setProofChoice] = useState("");
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [chips, setChips] = useState<string[]>([]);

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
  const coding: CodingConfig | null =
    task && isCodingKind(task.kind) ? CODING_CONFIGS[task.kind] : null;

  const resetAnswer = useCallback(() => {
    setRatings({});
    setPreferences({});
    setFeedback("");
    setWritingResponse("");
    setProofChoice("");
    setScreenshots([]);
    setChips([]);
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
    const needFeedback = () => {
      if (feedback.trim().length < FEEDBACK_MIN) {
        setNotice(`Please add feedback of at least ${FEEDBACK_MIN} characters.`);
        return true;
      }
      return false;
    };

    if (task.kind === "rating") {
      if (RATING_DIMENSIONS.some((d) => !ratings[d.key])) {
        setNotice("Please rate all five questions (1–5) before submitting.");
        return;
      }
      if (needFeedback()) return;
    }

    if (task.kind === "comparison") {
      if (COMPARISON_DIMENSIONS.some((d) => !preferences[d.key])) {
        setNotice("Please answer all five comparison questions before submitting.");
        return;
      }
      if (needFeedback()) return;
    }

    if (task.kind === "writing" && writingResponse.trim().length < 10) {
      setNotice("Please write a response before submitting.");
      return;
    }

    if (coding) {
      if (coding.dimensions.some((d) => !ratings[d.key])) {
        setNotice("Please score all five questions (1–5) before submitting.");
        return;
      }
      if (coding.proof) {
        if (!proofChoice) {
          setNotice(`Please answer: ${coding.proof.question}`);
          return;
        }
        // claiming you ran the code means you can show it running
        const opt = coding.proof.options.find((o) => o.key === proofChoice);
        if (opt?.requiresProof && screenshots.length === 0) {
          setNotice(
            `You said you ran the code — please attach a screenshot of the output as proof.`,
          );
          return;
        }
      }
      if (coding.chips && chips.length === 0) {
        setNotice(`Please answer: ${coding.chips.question}`);
        return;
      }
      if (needFeedback()) return;
    }

    const data: Record<string, unknown> = coding
      ? {
          ratings,
          feedback: feedback.trim(),
          ...(coding.proof ? { [coding.proof.key]: proofChoice } : {}),
          ...(coding.chips ? { [coding.chips.key]: chips } : {}),
          ...(screenshots.length ? { screenshots } : {}),
        }
      : task.kind === "rating"
        ? { ratings, feedback: feedback.trim() }
        : task.kind === "comparison"
          ? {
              preferences,
              // plain direction of the overall preference, for gold-QA + reports
              choice: prefDirection(preferences.overall),
              feedback: feedback.trim(),
            }
          : { response: writingResponse.trim() };

    persist("completed", data);
  }, [
    task,
    coding,
    ratings,
    feedback,
    preferences,
    writingResponse,
    proofChoice,
    screenshots,
    chips,
    persist,
  ]);

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

      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [task, phase, submit]);

  const setRating = (key: string, n: number) => {
    setRatings((r) => ({ ...r, [key]: n }));
    setNotice(null);
  };

  /* ── unsupported type ───────────────────────────────────────────── */
  if (kind === "unsupported") {
    return (
      <CenteredMessage
        projectId={project.id}
        title="Workspace coming soon"
        body={`The "${project.taskType}" workspace isn't built yet.`}
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
  // coding tasks show a lot of code — give them room to breathe
  const wide = !!coding;

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
              Task{" "}
              <span className="text-foreground">
                {session.completed + session.skipped + session.flagged + 1}
              </span>
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* body */}
      <div
        className={cn(
          "mx-auto w-full flex-1 px-4 py-6 sm:px-6",
          wide ? "max-w-5xl" : "max-w-3xl",
        )}
      >
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
              {coding ? (
                <p>
                  {coding.blurb} <br />
                  <span className="text-foreground/80">
                    Enter submits once every question is answered.
                  </span>
                </p>
              ) : kind === "rating" ? (
                <p>
                  Read the prompt and the AI&apos;s response, then rate it on each
                  of the five questions from 1 (worst) to 5 (best), and leave
                  feedback explaining your scores. <br />
                  <span className="text-foreground/80">
                    Enter submits once every question is answered.
                  </span>
                </p>
              ) : kind === "comparison" ? (
                <p>
                  Read the prompt and both responses, then for each question pick
                  which response is better and how strongly (Strongly A → Tie →
                  Strongly B), and leave feedback explaining your call. <br />
                  <span className="text-foreground/80">
                    Enter submits once every question is answered.
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
            {coding ? "Task" : "Prompt"}
          </div>
          <div className="whitespace-pre-wrap rounded-xl border border-ink/10 bg-ink/[0.03] p-4 text-[15px] leading-relaxed">
            {task.prompt}
          </div>
        </div>

        {/* task body */}
        {task.kind === "rating" && (
          <RatingTask
            response={task.response}
            ratings={ratings}
            setRating={setRating}
            feedback={feedback}
            setFeedback={(v) => {
              setFeedback(v);
              setNotice(null);
            }}
          />
        )}

        {task.kind === "comparison" && (
          <ComparisonTask
            responseA={task.responseA}
            responseB={task.responseB}
            preferences={preferences}
            setPreference={(key, v) => {
              setPreferences((p) => ({ ...p, [key]: v }));
              setNotice(null);
            }}
            feedback={feedback}
            setFeedback={(v) => {
              setFeedback(v);
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

        {coding && (
          <CodingTask
            task={task}
            config={coding}
            ratings={ratings}
            setRating={setRating}
            proofChoice={proofChoice}
            setProofChoice={(v) => {
              setProofChoice(v);
              setNotice(null);
            }}
            screenshots={screenshots}
            setScreenshots={(v) => {
              setScreenshots(v);
              setNotice(null);
            }}
            chips={chips}
            setChips={(v) => {
              setChips(v);
              setNotice(null);
            }}
            feedback={feedback}
            setFeedback={(v) => {
              setFeedback(v);
              setNotice(null);
            }}
          />
        )}

        {notice && (
          <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
            {notice}
          </p>
        )}
      </div>

      {/* action bar */}
      <footer className="sticky bottom-0 border-t border-ink/10 bg-background/80 backdrop-blur-xl">
        <div
          className={cn(
            "mx-auto flex items-center justify-between gap-3 px-4 py-3 sm:px-6",
            wide ? "max-w-5xl" : "max-w-3xl",
          )}
        >
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

/* ───────────────────────────────────────────────── shared controls ── */

/** The 1–5 scale used by both response rating and every coding category. */
function ScoreScale({
  dimensions,
  ratings,
  setRating,
  heading,
}: {
  dimensions: Dim[];
  ratings: Record<string, number>;
  setRating: (key: string, n: number) => void;
  heading: string;
}) {
  return (
    <div className="mt-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-muted">
          {heading}
        </div>
        <div className="text-xs text-muted">1 = worst · 5 = best</div>
      </div>

      {dimensions.map((dim, i) => {
        const value = ratings[dim.key] ?? 0;
        return (
          <div key={dim.key}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium">
                {i + 1}. {dim.label}
              </span>
              <span className="text-xs text-muted">{value ? `${value} / 5` : "—"}</span>
            </div>
            <p className="mt-0.5 text-xs text-muted">{dim.hint}</p>
            <div className="mt-2 flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(dim.key, n)}
                  aria-label={`${dim.label}: ${n}`}
                  className={cn(
                    "h-10 flex-1 rounded-lg border text-sm font-medium transition-colors",
                    value === n
                      ? "border-primary/60 bg-primary/15 text-foreground"
                      : "border-ink/10 bg-ink/5 text-muted hover:text-foreground",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FeedbackBox({
  feedback,
  setFeedback,
  placeholder,
}: {
  feedback: string;
  setFeedback: (v: string) => void;
  placeholder: string;
}) {
  const len = feedback.trim().length;
  return (
    <div className="mt-6">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">
          Feedback <span className="text-red-300">*</span>
        </span>
        <span className={cn("text-xs", len >= FEEDBACK_MIN ? "text-emerald-300" : "text-muted")}>
          {len} / {FEEDBACK_MIN} minimum
        </span>
      </div>
      <Textarea
        rows={3}
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

/* ───────────────────────────────────────────────────── task bodies ── */

function RatingTask({
  response,
  ratings,
  setRating,
  feedback,
  setFeedback,
}: {
  response: string;
  ratings: Record<string, number>;
  setRating: (key: string, n: number) => void;
  feedback: string;
  setFeedback: (v: string) => void;
}) {
  return (
    <>
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted">
        AI response
      </div>
      <div className="rounded-xl border border-ink/10 bg-ink/[0.03] p-4 text-[15px] leading-relaxed">
        {response}
      </div>

      <ScoreScale
        dimensions={RATING_DIMENSIONS}
        ratings={ratings}
        setRating={setRating}
        heading="Rate this response"
      />

      <FeedbackBox
        feedback={feedback}
        setFeedback={setFeedback}
        placeholder="Explain your scores — what is good or wrong with this response?"
      />
    </>
  );
}

function ComparisonTask({
  responseA,
  responseB,
  preferences,
  setPreference,
  feedback,
  setFeedback,
}: {
  responseA: string;
  responseB: string;
  preferences: Record<string, string>;
  setPreference: (key: string, v: string) => void;
  feedback: string;
  setFeedback: (v: string) => void;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {(["A", "B"] as const).map((key) => (
          <div key={key} className="rounded-xl border border-ink/10 bg-ink/[0.03] p-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
              Response {key}
            </div>
            <p className="text-[15px] leading-relaxed">
              {key === "A" ? responseA : responseB}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-5">
        <div className="text-xs font-medium uppercase tracking-wider text-muted">
          Compare the two responses
        </div>

        {COMPARISON_DIMENSIONS.map((dim, i) => {
          const value = preferences[dim.key];
          return (
            <div key={dim.key}>
              <div className="text-sm font-medium">
                {i + 1}. {dim.label}
              </div>
              <p className="mt-0.5 text-xs text-muted">{dim.hint}</p>
              <div className="mt-2 grid grid-cols-5 gap-1.5">
                {PREFERENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setPreference(dim.key, opt.key)}
                    className={cn(
                      "rounded-lg border px-1 py-2 text-xs font-medium leading-tight transition-colors",
                      value === opt.key
                        ? "border-primary/60 bg-primary/15 text-foreground"
                        : "border-ink/10 bg-ink/5 text-muted hover:text-foreground",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <FeedbackBox
        feedback={feedback}
        setFeedback={setFeedback}
        placeholder="Explain your choice — why is one response better than the other?"
      />
    </>
  );
}

/* ───────────────────────────────────────────────────────── coding ── */

/** The AI's prose answer (diagnosis, fix, review comments) — may embed code. */
function AiAnswer({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted">
        {title}
      </div>
      <div className="max-h-[26rem] overflow-auto whitespace-pre-wrap rounded-xl border border-primary/25 bg-primary/[0.04] p-4 font-mono text-[13px] leading-relaxed">
        {text}
      </div>
    </div>
  );
}

function CodingTask({
  task,
  config,
  ratings,
  setRating,
  proofChoice,
  setProofChoice,
  screenshots,
  setScreenshots,
  chips,
  setChips,
  feedback,
  setFeedback,
}: {
  task: WorkspaceTask;
  config: CodingConfig;
  ratings: Record<string, number>;
  setRating: (key: string, n: number) => void;
  proofChoice: string;
  setProofChoice: (v: string) => void;
  screenshots: string[];
  setScreenshots: (v: string[]) => void;
  chips: string[];
  setChips: (v: string[]) => void;
  feedback: string;
  setFeedback: (v: string) => void;
}) {
  const proofRequired =
    !!config.proof?.options.find((o) => o.key === proofChoice)?.requiresProof;

  function toggleChip(key: string) {
    const none = config.chips!.noneKey;
    // "nothing was missed" is mutually exclusive with naming something missed
    if (key === none) {
      setChips(chips.includes(none) ? [] : [none]);
      return;
    }
    const without = chips.filter((c) => c !== none);
    setChips(
      without.includes(key) ? without.filter((c) => c !== key) : [...without, key],
    );
  }

  return (
    <>
      {/* ── what the trainer is judging ──────────────────────────── */}
      {task.kind === "code_gen" && (
        <CodeBlock
          code={task.code}
          language={task.language}
          title={`AI-generated code${task.language ? ` · ${task.language}` : ""}`}
        />
      )}

      {task.kind === "code_refactor" && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <CodeBlock
              code={task.originalCode}
              language={task.language}
              title="Original"
            />
            <CodeBlock
              code={task.refactoredCode}
              language={task.language}
              title="AI's refactor"
            />
          </div>
          {task.aiResponse && (
            <AiAnswer title="AI's explanation of the refactor" text={task.aiResponse} />
          )}
        </div>
      )}

      {task.kind === "code_debug" && (
        <div className="space-y-4">
          <CodeBlock
            code={task.buggyCode}
            language={task.language}
            title={`Broken code${task.language ? ` · ${task.language}` : ""}`}
          />
          {task.errorOutput && (
            <CodeBlock code={task.errorOutput} title="Error output" terminal />
          )}
          <AiAnswer title="AI's diagnosis & fix" text={task.aiResponse} />
        </div>
      )}

      {task.kind === "code_review" && (
        <div className="space-y-4">
          <CodeBlock
            code={task.code}
            language={task.language}
            title={`Code under review${task.language ? ` · ${task.language}` : ""}`}
          />
          <AiAnswer title="AI's review comments" text={task.aiReview} />
        </div>
      )}

      {/* ── did you actually run it? ─────────────────────────────── */}
      {config.proof && (
        <div className="mt-6 rounded-xl border border-ink/10 bg-ink/[0.02] p-4">
          <div className="text-sm font-medium">{config.proof.question}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {config.proof.options.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setProofChoice(opt.key)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  proofChoice === opt.key
                    ? "border-primary/60 bg-primary/15 text-foreground"
                    : "border-ink/10 bg-ink/5 text-muted hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {proofRequired && (
            <ScreenshotUpload
              label={config.proof.proofLabel}
              hint={config.proof.proofHint}
              required
              paths={screenshots}
              onChange={setScreenshots}
            />
          )}
        </div>
      )}

      {/* ── the five questions ───────────────────────────────────── */}
      <ScoreScale
        dimensions={config.dimensions}
        ratings={ratings}
        setRating={setRating}
        heading={`Score this ${config.label.toLowerCase()}`}
      />

      {/* ── what did the review miss? (code review only) ─────────── */}
      {config.chips && (
        <div className="mt-6">
          <div className="text-sm font-medium">{config.chips.question}</div>
          <p className="mt-0.5 text-xs text-muted">{config.chips.hint}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {config.chips.options.map((opt) => (
              <button
                key={opt.key}
                onClick={() => toggleChip(opt.key)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  chips.includes(opt.key)
                    ? "border-primary/60 bg-primary/15 text-foreground"
                    : "border-ink/10 bg-ink/5 text-muted hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── optional proof (refactoring) ─────────────────────────── */}
      {config.optionalProof && (
        <ScreenshotUpload
          label={config.optionalProof.proofLabel}
          hint={config.optionalProof.proofHint}
          paths={screenshots}
          onChange={setScreenshots}
        />
      )}

      <FeedbackBox
        feedback={feedback}
        setFeedback={setFeedback}
        placeholder="Explain your scores — be concrete. Name the line, the bug, or the missed requirement."
      />
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
