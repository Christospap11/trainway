"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ownsPath, MAX_SCREENSHOTS_PER_TASK } from "@/lib/storage";
import { AUTHORING_ARTIFACT_KEYS, AUTHORING_OBJECTIVE_KEYS } from "@/lib/rubrics";
import { taskResultSchema } from "@/lib/validation";

// DB enum → ledger display label (denormalized onto EarningEntry)
const TASK_TYPE_LABEL: Record<string, string> = {
  RESPONSE_RATING: "Response rating",
  SIDE_BY_SIDE: "Side-by-side comparison",
  RESPONSE_WRITING: "Response writing",
  FACT_CHECK: "Fact-checking",
  CODING: "Coding",
  CODE_GENERATION: "Code generation",
  CODE_REFACTORING: "Code refactoring",
  CODE_DEBUGGING: "Code debugging",
  CODE_REVIEW: "Code review",
  AGENT_AUTHORING: "Agentic task authoring",
  CONVERSATION: "Conversation design",
  RED_TEAM: "Red teaming",
};

/**
 * Screenshot paths arrive from the client, so they can't be trusted. Storage
 * keys every object under its uploader's id — keep only the paths this trainer
 * actually owns, so a crafted submit can't attach someone else's upload.
 */
function sanitizeScreenshots(
  data: Record<string, unknown> | undefined,
  userId: string,
): Record<string, unknown> | undefined {
  if (!data || !("screenshots" in data)) return data;
  const raw = Array.isArray(data.screenshots) ? data.screenshots : [];
  const owned = raw.filter((p) => ownsPath(userId, p)).slice(0, MAX_SCREENSHOTS_PER_TASK);
  if (owned.length) return { ...data, screenshots: owned };

  // nothing survived the ownership check — don't store an empty/forged key
  const rest = { ...data };
  delete rest.screenshots;
  return rest;
}

/**
 * Normalize an authoring submission's fields — the client is untrusted, so keep
 * only known artifact/objective keys, clamp the pass@ score to [0,1], and cap
 * the free-text so a submission can't carry an unbounded payload.
 */
function sanitizeAuthoring(
  data: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!data) return data;
  const arr = (v: unknown, allowed: string[]) =>
    Array.isArray(v) ? [...new Set(v.filter((x): x is string => allowed.includes(x)))] : [];
  const scoreRaw = Number(data.passScore);
  const passScore = Number.isFinite(scoreRaw) ? Math.min(1, Math.max(0, scoreRaw)) : 0;
  return {
    ...data,
    prUrl: typeof data.prUrl === "string" ? data.prUrl.trim().slice(0, 500) : "",
    artifactTypes: arr(data.artifactTypes, AUTHORING_ARTIFACT_KEYS),
    objectives: arr(data.objectives, AUTHORING_OBJECTIVE_KEYS),
    passScore,
    ...(typeof data.notes === "string" ? { notes: data.notes.slice(0, 4000) } : {}),
  };
}

const STATUS: Record<TaskAction, "SUBMITTED" | "SKIPPED" | "FLAGGED"> = {
  completed: "SUBMITTED",
  skipped: "SKIPPED",
  flagged: "FLAGGED",
};

export type TaskAction = "completed" | "skipped" | "flagged";

export type TaskResult = {
  taskId: string;
  action: TaskAction;
  timeSpentSec: number;
  data?: Record<string, unknown>;
};

export type SubmitTaskResult = {
  ok: boolean;
  error?: string;
  amountCents?: number;
};

/**
 * Persists ONE task as the trainer finishes it. Hard-gated server-side:
 *  - the account must be APPROVED,
 *  - the trainer must be qualified for the project,
 *  - the project must not be paused,
 *  - the task must actually belong to that project (no rate-spoofing),
 *  - a task pays at most once per trainer (DB unique on (taskId,userId)).
 * Pay is time-based (payRate × time, time already clamped by the schema).
 */
export async function submitTask(
  projectSlug: string,
  result: TaskResult,
): Promise<SubmitTaskResult> {
  const user = await getSession();
  if (!user) return { ok: false, error: "You're not signed in." };
  if (user.status !== "APPROVED") {
    return { ok: false, error: "Your account isn't active." };
  }

  const parsed = taskResultSchema.safeParse(result);
  if (!parsed.success) return { ok: false, error: "Invalid submission data." };
  const clean = { ...parsed.data, data: sanitizeScreenshots(parsed.data.data, user.id) };

  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true, title: true, taskType: true, payRateCents: true, status: true },
  });
  if (!project) return { ok: false, error: "Project not found." };
  if (project.status === "PAUSED") {
    return { ok: false, error: "This project is paused right now." };
  }

  // authoring work happens off-platform, so its fields get their own scrub
  const isAuthoring = project.taskType === "AGENT_AUTHORING";
  if (isAuthoring) clean.data = sanitizeAuthoring(clean.data);

  // must be qualified for this project
  const qual = await prisma.userQualification.findUnique({
    where: { userId_projectId: { userId: user.id, projectId: project.id } },
    select: { passed: true },
  });
  if (!qual?.passed) {
    return { ok: false, error: "You're not qualified for this project." };
  }

  // the task must belong to this project (prevents pay-rate spoofing)
  const task = await prisma.task.findUnique({
    where: { id: clean.taskId },
    select: { projectId: true },
  });
  if (!task || task.projectId !== project.id) {
    return { ok: false, error: "That task isn't part of this project." };
  }

  const completed = clean.action === "completed";
  // Authoring pays a flat bounty per accepted task (the real work is off-platform,
  // so the on-page timer can't measure it); everything else is time-based.
  const amountCents = !completed
    ? 0
    : isAuthoring
      ? project.payRateCents
      : Math.round((project.payRateCents * clean.timeSpentSec) / 3600);
  const batchId = crypto.randomUUID();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.submission.create({
        data: {
          taskId: clean.taskId,
          userId: user.id,
          batchId,
          data: (clean.data ?? {}) as object,
          timeSpentSec: clean.timeSpentSec,
          status: STATUS[clean.action],
        },
      });

      if (amountCents > 0) {
        await tx.earningEntry.create({
          data: {
            userId: user.id,
            batchId,
            amountCents,
            status: "PENDING",
            projectTitle: project.title,
            taskType: TASK_TYPE_LABEL[project.taskType] ?? project.taskType,
            taskCount: 1,
          },
        });
      }

      await tx.user.update({
        where: { id: user.id },
        data: {
          pendingCents: { increment: amountCents },
          thisWeekCents: { increment: amountCents },
          tasksCompleted: { increment: completed ? 1 : 0 },
        },
      });

      if (completed) {
        await tx.project.updateMany({
          where: { id: project.id, tasksAvailable: { gte: 1 } },
          data: { tasksAvailable: { decrement: 1 } },
        });
      }
    });
  } catch (e) {
    if (e && typeof e === "object" && (e as { code?: string }).code === "P2002") {
      return { ok: false, error: "You've already submitted this task." };
    }
    return { ok: false, error: "Could not save your work. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/earnings");
  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectSlug}`);
  return { ok: true, amountCents };
}
