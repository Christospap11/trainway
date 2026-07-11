import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** CSV-escape a cell (quote if it contains a comma, quote, or newline). */
function esc(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Admin export of a project's completed work as CSV — the labelled dataset the
 * platform produces: prompt + responses + the trainer's answer/rating +
 * rationale + status + pay. UTF-8 BOM so Excel opens Greek text correctly.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const user = await getSession();
  if (!user || user.role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const project = await prisma.project.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!project) return new NextResponse("Not found", { status: 404 });

  const subs = await prisma.submission.findMany({
    where: { task: { projectId: project.id } },
    include: {
      task: { select: { prompt: true, kind: true, data: true, isGold: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // map earnings (pay) per submission via its batchId
  const batchIds = subs.map((s) => s.batchId).filter((b): b is string => !!b);
  const earnings = batchIds.length
    ? await prisma.earningEntry.findMany({
        where: { batchId: { in: batchIds } },
        select: { batchId: true, amountCents: true },
      })
    : [];
  const earnMap = new Map(earnings.map((e) => [e.batchId, e.amountCents]));

  const headers = [
    "submitted_at", "trainer", "email", "kind", "is_gold", "prompt",
    "response", "response_a", "response_b",
    // coding task content
    "language", "code", "original_code", "refactored_code",
    "buggy_code", "error_output", "ai_response", "ai_review",
    "trainer_response",
    // response rating (1–5)
    "rating_harmlessness", "rating_prompt_following", "rating_accuracy",
    "rating_human_like", "rating_overall",
    // side-by-side (A↔B)
    "choice",
    "cmp_accuracy", "cmp_safety", "cmp_completeness", "cmp_clarity", "cmp_overall",
    // coding rubrics (1–5) — the dimension keys differ per category, so every
    // key any coding category can emit gets its own column
    "code_correctness", "code_coverage", "code_quality", "code_efficiency",
    "code_behavior", "code_readability", "code_structure", "code_regressions",
    "code_root_cause", "code_fix_correct", "code_side_effects", "code_explanation",
    "code_detection", "code_comment_correctness", "code_severity", "code_actionability",
    "code_overall",
    // coding self-reports
    "execution", "reproduced", "missed_issues", "screenshots",
    "feedback",
    "status", "earned_usd",
  ];

  const lines = [headers.join(",")];
  for (const s of subs) {
    const ans = s.data as {
      rating?: number;
      ratings?: Record<string, number>;
      choice?: string;
      preferences?: Record<string, string>;
      rationale?: string;
      feedback?: string;
      response?: string;
      execution?: string;
      repro?: string;
      missed?: string[];
      screenshots?: string[];
    };
    const td = s.task.data as {
      response?: string;
      responseA?: string;
      responseB?: string;
      language?: string;
      code?: string;
      originalCode?: string;
      refactoredCode?: string;
      buggyCode?: string;
      errorOutput?: string;
      aiResponse?: string;
      aiReview?: string;
    };
    const cents = earnMap.get(s.batchId ?? "") ?? 0;
    // per-dimension rating; older single-rating submissions surface as `overall`
    const r = ans.ratings ?? {};
    const overall = r.overall ?? ans.rating ?? "";
    const p = ans.preferences ?? {}; // per-dimension A/B preference (comparison)
    lines.push(
      [
        s.createdAt.toISOString(),
        s.user.name,
        s.user.email,
        s.task.kind,
        s.task.isGold ? "yes" : "no",
        s.task.prompt,
        td.response ?? "",
        td.responseA ?? "",
        td.responseB ?? "",
        td.language ?? "",
        td.code ?? "",
        td.originalCode ?? "",
        td.refactoredCode ?? "",
        td.buggyCode ?? "",
        td.errorOutput ?? "",
        td.aiResponse ?? "",
        td.aiReview ?? "",
        ans.response ?? "", // what the trainer wrote (writing tasks)
        r.safety ?? "",
        r.promptFollowing ?? "",
        r.accuracy ?? "",
        r.humanLike ?? "",
        // `overall` is shared by rating and every coding category — it's the
        // dimension gold-QA grades, so it gets its own column below too
        s.task.kind === "RATING" ? overall : "",
        ans.choice ?? "",
        p.accuracy ?? "",
        p.safety ?? "",
        p.completeness ?? "",
        p.clarity ?? "",
        p.overall ?? "",
        // code generation
        r.correctness ?? "",
        r.coverage ?? "",
        r.quality ?? "",
        r.efficiency ?? "",
        // code refactoring
        r.behavior ?? "",
        r.readability ?? "",
        r.structure ?? "",
        r.regressions ?? "",
        // code debugging
        r.rootCause ?? "",
        r.fixCorrect ?? "",
        r.sideEffects ?? "",
        r.explanation ?? "",
        // code review
        r.detection ?? "",
        r.commentCorrectness ?? "",
        r.severity ?? "",
        r.actionability ?? "",
        s.task.kind.startsWith("CODE_") ? overall : "",
        ans.execution ?? "",
        ans.repro ?? "",
        (ans.missed ?? []).join("; "),
        (ans.screenshots ?? []).join("; "),
        ans.feedback ?? ans.rationale ?? "",
        s.status,
        (cents / 100).toFixed(2),
      ].map(esc).join(","),
    );
  }

  const csv = "﻿" + lines.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-results.csv"`,
    },
  });
}
