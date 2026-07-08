"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { approveBatch, rejectBatch, recomputeScores } from "@/lib/qa";

type TaskTypeStr =
  | "RESPONSE_RATING"
  | "SIDE_BY_SIDE"
  | "RESPONSE_WRITING"
  | "FACT_CHECK"
  | "CODING"
  | "CONVERSATION"
  | "RED_TEAM";
type DiffStr = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
type StatusStr = "ACTIVE" | "AVAILABLE" | "QUALIFYING" | "PAUSED";

async function requireAdmin() {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

// Default task kind inferred from a project's task type (used when an uploaded
// row has no explicit `kind`).
const TASK_TYPE_TO_KIND: Record<string, "RATING" | "COMPARISON" | "WRITING" | undefined> = {
  RESPONSE_RATING: "RATING",
  SIDE_BY_SIDE: "COMPARISON",
  RESPONSE_WRITING: "WRITING",
};
const VALID_KINDS = ["RATING", "COMPARISON", "WRITING"] as const;

// Reverse of TASK_TYPE_TO_KIND — used to realign an empty project to the kind
// of data being uploaded.
const KIND_TO_TASK_TYPE: Record<"RATING" | "COMPARISON" | "WRITING", TaskTypeStr> = {
  RATING: "RESPONSE_RATING",
  COMPARISON: "SIDE_BY_SIDE",
  WRITING: "RESPONSE_WRITING",
};

// Infer the task kind from the shape of the uploaded rows (ignoring project
// type). Returns null when the rows are mixed so existing validation can speak.
function inferKindFromRows(
  rows: { response?: string; responseA?: string; responseB?: string }[],
): "RATING" | "COMPARISON" | "WRITING" | null {
  let rating = 0,
    comparison = 0,
    writing = 0;
  for (const r of rows) {
    const resp = (r.response ?? "").trim();
    const a = (r.responseA ?? "").trim();
    const b = (r.responseB ?? "").trim();
    if (a && b) comparison++;
    else if (resp) rating++;
    else writing++;
  }
  if (writing === rows.length) return "WRITING";
  if (rating === rows.length) return "RATING";
  if (comparison === rows.length) return "COMPARISON";
  return null;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/* ───────────────────────────── projects ────────────────────────── */

export type CreateProjectResult = { ok: boolean; slug?: string; error?: string };

export async function createProject(input: {
  title: string;
  description: string;
  taskType: TaskTypeStr;
  difficulty: DiffStr;
  status: StatusStr;
  payRateDollars: number;
  tasksAvailable: number;
}): Promise<CreateProjectResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };

  const title = input.title.trim();
  if (!title) return { ok: false, error: "Title is required." };
  const payRateCents = Math.round((Number(input.payRateDollars) || 0) * 100);
  if (payRateCents <= 0) return { ok: false, error: "Pay rate must be greater than 0." };

  // unique slug
  const base = slugify(title) || "project";
  let slug = base;
  for (let i = 2; await prisma.project.findUnique({ where: { slug } }); i++) {
    slug = `${base}-${i}`;
  }

  try {
    await prisma.project.create({
      data: {
        slug,
        title,
        description: input.description.trim(),
        taskType: input.taskType,
        difficulty: input.difficulty,
        status: input.status,
        payRateCents,
        tasksAvailable: Math.max(0, Math.round(Number(input.tasksAvailable) || 0)),
      },
    });
  } catch {
    return { ok: false, error: "Could not create the project." };
  }

  revalidatePath("/admin/projects");
  revalidatePath("/admin");
  return { ok: true, slug };
}

export async function setProjectStatus(
  slug: string,
  status: StatusStr,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  await prisma.project.update({ where: { slug }, data: { status } });
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${slug}`);
  return { ok: true };
}

// task types that have a working trainer workspace
const SUPPORTED_TASK_TYPES = ["RESPONSE_RATING", "SIDE_BY_SIDE", "RESPONSE_WRITING"];

export async function updateProject(
  slug: string,
  patch: {
    title?: string;
    description?: string;
    taskType?: TaskTypeStr;
    difficulty?: DiffStr;
    payRateDollars?: number;
  },
): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };

  const data: Record<string, unknown> = {};
  if (patch.title !== undefined) {
    const t = patch.title.trim();
    if (!t) return { ok: false, error: "Title can't be empty." };
    data.title = t;
  }
  if (patch.description !== undefined) data.description = patch.description.trim();
  if (patch.difficulty !== undefined) data.difficulty = patch.difficulty;
  if (patch.payRateDollars !== undefined) {
    const cents = Math.round((Number(patch.payRateDollars) || 0) * 100);
    if (cents <= 0) return { ok: false, error: "Pay rate must be greater than 0." };
    data.payRateCents = cents;
  }
  if (patch.taskType !== undefined) {
    if (!SUPPORTED_TASK_TYPES.includes(patch.taskType)) {
      return { ok: false, error: "Unsupported task type." };
    }
    // changing type is only safe before any tasks exist (kinds would mismatch)
    const taskCount = await prisma.task.count({ where: { project: { slug } } });
    if (taskCount > 0) {
      return { ok: false, error: "Remove the existing tasks before changing the task type." };
    }
    data.taskType = patch.taskType;
  }

  try {
    await prisma.project.update({ where: { slug }, data });
  } catch {
    return { ok: false, error: "Could not update the project." };
  }
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${slug}`);
  revalidatePath("/admin");
  return { ok: true };
}

/* ───────────────────────────── tasks ───────────────────────────── */

export type AddTaskInput = {
  kind: "RATING" | "COMPARISON" | "WRITING";
  prompt: string;
  response?: string;
  responseA?: string;
  responseB?: string;
  isGold?: boolean;
  goldMin?: number;
  goldMax?: number;
  goldChoice?: "A" | "tie" | "B";
};

function buildTaskData(input: AddTaskInput) {
  if (input.kind === "WRITING") {
    // the trainer writes the response — the task only carries the prompt
    return { data: {}, goldAnswer: undefined, valid: true };
  }
  if (input.kind === "RATING") {
    const data = { response: (input.response ?? "").trim() };
    const goldAnswer = input.isGold
      ? { min: input.goldMin ?? 1, max: input.goldMax ?? 5 }
      : undefined;
    return { data, goldAnswer, valid: !!data.response };
  }
  const data = {
    responseA: (input.responseA ?? "").trim(),
    responseB: (input.responseB ?? "").trim(),
  };
  const goldAnswer = input.isGold && input.goldChoice ? { choice: input.goldChoice } : undefined;
  return { data, goldAnswer, valid: !!data.responseA && !!data.responseB };
}

export async function addTask(
  slug: string,
  input: AddTaskInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  const project = await prisma.project.findUnique({ where: { slug }, select: { id: true } });
  if (!project) return { ok: false, error: "Project not found." };

  const prompt = input.prompt.trim();
  if (!prompt) return { ok: false, error: "Prompt is required." };
  const { data, goldAnswer, valid } = buildTaskData(input);
  if (!valid) return { ok: false, error: "Response text is required." };
  if (input.isGold && input.kind === "COMPARISON" && !input.goldChoice)
    return { ok: false, error: "Gold comparison tasks need a correct choice." };

  await prisma.$transaction([
    prisma.task.create({
      data: {
        projectId: project.id,
        kind: input.kind,
        prompt,
        data,
        isGold: !!input.isGold,
        goldAnswer: goldAnswer ?? undefined,
      },
    }),
    prisma.project.update({ where: { id: project.id }, data: { tasksAvailable: { increment: 1 } } }),
  ]);

  revalidatePath(`/admin/projects/${slug}`);
  revalidatePath("/admin");
  return { ok: true };
}

export type BulkResult = {
  ok: boolean;
  error?: string;
  added?: number;
  switchedTo?: TaskTypeStr;
};

export async function addTasksBulk(slug: string, json: string): Promise<BulkResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  const project = await prisma.project.findUnique({
    where: { slug },
    select: { id: true, taskType: true },
  });
  if (!project) return { ok: false, error: "Project not found." };
  const projectKind = TASK_TYPE_TO_KIND[project.taskType];

  let items: AddTaskInput[];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return { ok: false, error: "JSON must be an array of tasks." };
    items = parsed;
  } catch {
    return { ok: false, error: "Invalid JSON." };
  }
  if (items.length === 0) return { ok: false, error: "No tasks in the array." };
  if (items.length > 500) return { ok: false, error: "Max 500 tasks per upload." };

  // Auto-align: if no row declares an explicit kind, infer the kind from the
  // data itself. When it disagrees with the project's current type and the
  // project has no tasks yet, switch the project to match — so uploading
  // prompt-only data to a fresh "rating" project just works (becomes writing).
  let effectiveKind = projectKind;
  let switchedTo: TaskTypeStr | null = null;
  const hasExplicitKind = items.some((it) => it.kind && VALID_KINDS.includes(it.kind));
  if (!hasExplicitKind) {
    const inferred = inferKindFromRows(items);
    if (inferred && inferred !== projectKind) {
      const existing = await prisma.task.count({ where: { projectId: project.id } });
      if (existing === 0) {
        effectiveKind = inferred;
        switchedTo = KIND_TO_TASK_TYPE[inferred];
      }
    }
  }

  const rows = [];
  for (const [i, item] of items.entries()) {
    // use the row's kind if valid, otherwise fall back to the (aligned) project kind
    const kind =
      item.kind && VALID_KINDS.includes(item.kind) ? item.kind : effectiveKind;
    if (!kind) {
      return {
        ok: false,
        error: `Task ${i + 1}: couldn't tell the task type. Add a "kind" column (RATING / COMPARISON / WRITING) or set this project's type.`,
      };
    }
    if (!item.prompt?.trim()) return { ok: false, error: `Task ${i + 1}: missing prompt.` };
    const resolved = { ...item, kind };
    const { data, goldAnswer, valid } = buildTaskData(resolved);
    if (!valid) {
      return {
        ok: false,
        error:
          kind === "RATING"
            ? `Task ${i + 1}: this project is "Response rating", which needs a "response" column to rate. Your file has prompts only — change this project's type to "Response writing" (at the top of the page) to upload write-the-answer tasks.`
            : `Task ${i + 1}: a comparison task needs "responseA" and "responseB" columns.`,
      };
    }
    rows.push({
      projectId: project.id,
      kind,
      prompt: item.prompt.trim(),
      data,
      isGold: !!item.isGold,
      goldAnswer: goldAnswer ?? undefined,
    });
  }

  await prisma.$transaction([
    prisma.task.createMany({ data: rows }),
    prisma.project.update({
      where: { id: project.id },
      data: {
        tasksAvailable: { increment: rows.length },
        ...(switchedTo ? { taskType: switchedTo } : {}),
      },
    }),
  ]);

  revalidatePath(`/admin/projects/${slug}`);
  revalidatePath("/admin");
  return {
    ok: true,
    added: rows.length,
    switchedTo: switchedTo ?? undefined,
  };
}

/* ─────────────────────── submission review ─────────────────────── */

export async function reviewBatch(
  earningId: string,
  decision: "approve" | "reject",
): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };

  const e = await prisma.earningEntry.findUnique({
    where: { id: earningId },
    select: { id: true, userId: true, amountCents: true, batchId: true, status: true },
  });
  if (!e || e.status !== "PENDING") {
    return { ok: false, error: "Batch not found or already reviewed." };
  }

  try {
    if (decision === "approve") await approveBatch(e);
    else await rejectBatch(e, "Rejected in manual review.");
    await recomputeScores(e.userId);
    await prisma.notification.create({
      data: {
        userId: e.userId,
        kind: "PAYMENT",
        title: decision === "approve" ? "Work approved" : "Work needs revision",
        body:
          decision === "approve"
            ? `A batch passed review — $${(e.amountCents / 100).toFixed(2)} cleared to your available balance.`
            : "A batch didn't pass quality review and wasn't paid this time.",
      },
    });
  } catch {
    return { ok: false, error: "Could not record the decision. Please retry." };
  }

  revalidatePath("/admin/submissions");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/earnings");
  revalidatePath("/dashboard/notifications");
  return { ok: true };
}

/* ───────────────────────────── trainers ────────────────────────── */

type UserStatusStr = "PENDING" | "APPROVED" | "WAITLISTED" | "REJECTED" | "SUSPENDED";

export async function setTrainerStatus(
  userId: string,
  status: UserStatusStr,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || user.role !== "TRAINER") return { ok: false, error: "Trainer not found." };

  await prisma.user.update({ where: { id: userId }, data: { status } });

  // keep the application record in sync + notify the trainer
  const appStatus =
    status === "APPROVED" ? "APPROVED" : status === "REJECTED" ? "REJECTED" : status === "WAITLISTED" ? "IN_REVIEW" : null;
  if (appStatus) {
    await prisma.application.updateMany({ where: { userId }, data: { status: appStatus } });
  }

  const note: Record<UserStatusStr, { title: string; body: string } | null> = {
    APPROVED: { title: "You're approved!", body: "Your account is active — you can start working on projects." },
    REJECTED: { title: "Application update", body: "Your application wasn't approved this time." },
    WAITLISTED: { title: "You're on the waitlist", body: "We'll reach out when a spot opens up." },
    SUSPENDED: { title: "Account suspended", body: "Your account has been suspended. Contact support." },
    PENDING: null,
  };
  if (note[status]) {
    await prisma.notification.create({ data: { userId, kind: "SYSTEM", title: note[status]!.title, body: note[status]!.body } });
  }

  revalidatePath("/admin/trainers");
  revalidatePath(`/admin/trainers/${userId}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function toggleQualification(
  userId: string,
  projectId: string,
  qualify: boolean,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };

  await prisma.userQualification.upsert({
    where: { userId_projectId: { userId, projectId } },
    create: { userId, projectId, passed: qualify },
    update: { passed: qualify },
  });

  revalidatePath(`/admin/trainers/${userId}`);
  revalidatePath("/dashboard/projects");
  return { ok: true };
}

/* ───────────────────────────── payouts ─────────────────────────── */

const PAYOUT_METHOD_LABEL: Record<string, string> = { PAYPAL: "PayPal", WISE: "Wise", STRIPE: "Stripe" };

export async function markPayout(
  payoutId: string,
  result: "paid" | "failed",
): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };

  const p = await prisma.payout.findUnique({
    where: { id: payoutId },
    select: { id: true, userId: true, amountCents: true, status: true, method: true },
  });
  if (!p || p.status !== "PROCESSING") {
    return { ok: false, error: "Payout not found or already settled." };
  }
  const dollars = (p.amountCents / 100).toFixed(2);
  const label = PAYOUT_METHOD_LABEL[p.method] ?? p.method;

  try {
    if (result === "paid") {
      await prisma.$transaction([
        prisma.payout.update({ where: { id: p.id }, data: { status: "PAID" } }),
        prisma.notification.create({
          data: { userId: p.userId, kind: "PAYMENT", title: "Payout sent", body: `Your $${dollars} withdrawal via ${label} has been paid.` },
        }),
      ]);
    } else {
      // failed → refund the held amount back to the trainer's available balance
      await prisma.$transaction([
        prisma.payout.update({ where: { id: p.id }, data: { status: "FAILED" } }),
        prisma.user.update({ where: { id: p.userId }, data: { availableCents: { increment: p.amountCents } } }),
        prisma.notification.create({
          data: { userId: p.userId, kind: "PAYMENT", title: "Payout failed", body: `Your $${dollars} withdrawal via ${label} failed — the amount was returned to your available balance.` },
        }),
      ]);
    }
  } catch {
    return { ok: false, error: "Could not update the payout. Please retry." };
  }

  revalidatePath("/admin/payouts");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/earnings");
  revalidatePath("/dashboard/notifications");
  return { ok: true };
}

/* ─────────────────────────── delete project/task ───────────────── */

export async function deleteProject(slug: string): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  try {
    // cascades to tasks, qualifications, and their submissions (earnings keep, SetNull)
    await prisma.project.delete({ where: { slug } });
  } catch {
    return { ok: false, error: "Could not delete the project." };
  }
  revalidatePath("/admin/projects");
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteTask(taskId: string): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } });
  if (!task) return { ok: false, error: "Task not found." };
  try {
    await prisma.$transaction([
      prisma.task.delete({ where: { id: taskId } }),
      prisma.project.updateMany({
        where: { id: task.projectId, tasksAvailable: { gte: 1 } },
        data: { tasksAvailable: { decrement: 1 } },
      }),
    ]);
  } catch {
    return { ok: false, error: "Could not delete the task." };
  }
  revalidatePath("/admin/projects");
  revalidatePath("/admin");
  return { ok: true };
}
