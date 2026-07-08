"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, ArrowRight, GraduationCap, RotateCcw } from "lucide-react";
import {
  submitQualification,
  type QualifyResult,
} from "@/app/dashboard/projects/[id]/qualify/actions";
import { cn } from "@/lib/utils";

type ClientQuestion = { q: string; options: string[] };

export function QualificationQuiz({
  slug,
  projectTitle,
  questions,
}: {
  slug: string;
  projectTitle: string;
  questions: ClientQuestion[];
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<QualifyResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const allAnswered = answers.every((a) => a >= 0);

  const submit = async () => {
    if (!allAnswered) {
      setNotice("Please answer every question first.");
      return;
    }
    setBusy(true);
    setNotice(null);
    const res = await submitQualification(slug, answers);
    setBusy(false);
    if (!res.ok) {
      setNotice(res.error ?? "Something went wrong. Please try again.");
      return;
    }
    setResult(res);
    if (res.passed) router.refresh();
  };

  const retry = () => {
    setAnswers(Array(questions.length).fill(-1));
    setResult(null);
    setNotice(null);
  };

  /* ── passed ── */
  if (result?.passed) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-[0_0_40px_-6px_rgba(16,185,129,0.7)]">
          <CheckCircle2 size={30} />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">You&apos;re qualified! 🎉</h1>
        <p className="mt-2 text-muted">
          You scored {result.score}/{result.total} on {projectTitle}. You can start working now.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={`/work/${slug}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia font-medium text-white shadow-[0_8px_30px_-6px_rgba(139,92,246,0.6)] transition-all hover:-translate-y-0.5"
          >
            Start working <ArrowRight size={18} />
          </Link>
          <Link
            href={`/dashboard/projects/${slug}`}
            className="inline-flex h-11 items-center justify-center rounded-full border border-ink/15 bg-ink/5 font-medium transition-colors hover:bg-ink/10"
          >
            Back to project
          </Link>
        </div>
      </div>
    );
  }

  /* ── failed ── */
  if (result && !result.passed) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-ink/10 text-muted">
          <XCircle size={30} />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Not quite yet</h1>
        <p className="mt-2 text-muted">
          You scored {result.score}/{result.total} — you need {Math.ceil(result.total! * 0.75)} to pass.
          Review the guidelines and try again.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={retry}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia font-medium text-white shadow-[0_8px_30px_-6px_rgba(139,92,246,0.6)] transition-all hover:-translate-y-0.5"
          >
            <RotateCcw size={16} /> Try again
          </button>
          <Link
            href={`/dashboard/projects/${slug}`}
            className="inline-flex h-11 items-center justify-center rounded-full border border-ink/15 bg-ink/5 font-medium transition-colors hover:bg-ink/10"
          >
            Back to project
          </Link>
        </div>
      </div>
    );
  }

  /* ── quiz ── */
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href={`/dashboard/projects/${slug}`} className="text-sm text-muted transition-colors hover:text-foreground">
          ← {projectTitle}
        </Link>
        <div className="mt-3 flex items-center gap-2">
          <GraduationCap size={22} className="text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Qualification</h1>
        </div>
        <p className="mt-1 text-muted">
          Answer these {questions.length} questions about the guidelines. Pass to unlock the project.
        </p>
      </div>

      <div className="space-y-4">
        {questions.map((question, qi) => (
          <div key={qi} className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-5">
            <div className="font-medium">
              {qi + 1}. {question.q}
            </div>
            <div className="mt-3 space-y-2">
              {question.options.map((opt, oi) => {
                const selected = answers[qi] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => {
                      setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)));
                      setNotice(null);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition-colors",
                      selected
                        ? "border-primary/60 bg-primary/10 text-foreground"
                        : "border-ink/10 bg-ink/[0.02] text-muted hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                        selected ? "border-primary bg-primary" : "border-ink/30",
                      )}
                    >
                      {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {notice && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
          {notice}
        </p>
      )}

      <button
        onClick={submit}
        disabled={busy}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia px-6 font-medium text-white shadow-[0_8px_30px_-6px_rgba(139,92,246,0.6)] transition-all hover:-translate-y-0.5 disabled:opacity-60"
      >
        {busy ? "Submitting…" : "Submit answers"}
      </button>
    </div>
  );
}
