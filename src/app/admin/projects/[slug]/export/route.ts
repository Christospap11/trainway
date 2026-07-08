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
    "trainer_response",
    "rating_harmlessness", "rating_prompt_following", "rating_accuracy",
    "rating_human_like", "rating_overall",
    "choice", "feedback",
    "status", "earned_usd",
  ];

  const lines = [headers.join(",")];
  for (const s of subs) {
    const ans = s.data as {
      rating?: number;
      ratings?: Record<string, number>;
      choice?: string;
      rationale?: string;
      feedback?: string;
      response?: string;
    };
    const td = s.task.data as { response?: string; responseA?: string; responseB?: string };
    const cents = earnMap.get(s.batchId ?? "") ?? 0;
    // per-dimension rating; older single-rating submissions surface as `overall`
    const r = ans.ratings ?? {};
    const overall = r.overall ?? ans.rating ?? "";
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
        ans.response ?? "", // what the trainer wrote (writing tasks)
        r.safety ?? "",
        r.promptFollowing ?? "",
        r.accuracy ?? "",
        r.humanLike ?? "",
        overall,
        ans.choice ?? "",
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
