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
  | "CODE_GENERATION"
  | "CODE_REFACTORING"
  | "CODE_DEBUGGING"
  | "CODE_REVIEW"
  | "CONVERSATION"
  | "RED_TEAM";
type DiffStr = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
type StatusStr = "ACTIVE" | "AVAILABLE" | "QUALIFYING" | "PAUSED";

type KindStr =
  | "RATING"
  | "COMPARISON"
  | "WRITING"
  | "CODE_GEN"
  | "CODE_REFACTOR"
  | "CODE_DEBUG"
  | "CODE_REVIEW";

async function requireAdmin() {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

// Default task kind inferred from a project's task type (used when an uploaded
// row has no explicit `kind`).
const TASK_TYPE_TO_KIND: Record<string, KindStr | undefined> = {
  RESPONSE_RATING: "RATING",
  SIDE_BY_SIDE: "COMPARISON",
  RESPONSE_WRITING: "WRITING",
  CODE_GENERATION: "CODE_GEN",
  CODE_REFACTORING: "CODE_REFACTOR",
  CODE_DEBUGGING: "CODE_DEBUG",
  CODE_REVIEW: "CODE_REVIEW",
};
const VALID_KINDS = [
  "RATING",
  "COMPARISON",
  "WRITING",
  "CODE_GEN",
  "CODE_REFACTOR",
  "CODE_DEBUG",
  "CODE_REVIEW",
] as const;

// Reverse of TASK_TYPE_TO_KIND — used to realign an empty project to the kind
// of data being uploaded.
const KIND_TO_TASK_TYPE: Record<KindStr, TaskTypeStr> = {
  RATING: "RESPONSE_RATING",
  COMPARISON: "SIDE_BY_SIDE",
  WRITING: "RESPONSE_WRITING",
  CODE_GEN: "CODE_GENERATION",
  CODE_REFACTOR: "CODE_REFACTORING",
  CODE_DEBUG: "CODE_DEBUGGING",
  CODE_REVIEW: "CODE_REVIEW",
};

/** What a single uploaded row looks like, before we decide what kind it is. */
type RowShape = {
  response?: string;
  responseA?: string;
  responseB?: string;
  code?: string;
  originalCode?: string;
  refactoredCode?: string;
  buggyCode?: string;
  aiResponse?: string;
  aiReview?: string;
};

/** Which kind does this single row's columns describe? */
function kindOfRow(r: RowShape): KindStr {
  const has = (v?: string) => !!(v ?? "").trim();

  // coding shapes are unambiguous — each has a column combination nothing else uses
  if (has(r.originalCode) && has(r.refactoredCode)) return "CODE_REFACTOR";
  if (has(r.buggyCode) && has(r.aiResponse)) return "CODE_DEBUG";
  if (has(r.code) && has(r.aiReview)) return "CODE_REVIEW";
  if (has(r.code)) return "CODE_GEN";

  if (has(r.responseA) && has(r.responseB)) return "COMPARISON";
  if (has(r.response)) return "RATING";
  return "WRITING"; // prompt only → the trainer writes the answer
}

// Infer the task kind from the shape of the uploaded rows (ignoring project
// type). Returns null when the rows are mixed so existing validation can speak.
function inferKindFromRows(rows: RowShape[]): KindStr | null {
  const kinds = new Set(rows.map(kindOfRow));
  return kinds.size === 1 ? [...kinds][0] : null;
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
const SUPPORTED_TASK_TYPES = [
  "RESPONSE_RATING",
  "SIDE_BY_SIDE",
  "RESPONSE_WRITING",
  "CODE_GENERATION",
  "CODE_REFACTORING",
  "CODE_DEBUGGING",
  "CODE_REVIEW",
];

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
  kind: KindStr;
  prompt: string;
  response?: string;
  responseA?: string;
  responseB?: string;
  // coding
  language?: string;
  code?: string;
  originalCode?: string;
  refactoredCode?: string;
  buggyCode?: string;
  errorOutput?: string;
  aiResponse?: string;
  aiReview?: string;
  isGold?: boolean;
  goldMin?: number;
  goldMax?: number;
  goldChoice?: "A" | "tie" | "B";
};

/** Which columns a kind needs — drives both validation and the error message. */
const REQUIRED_COLUMNS: Record<KindStr, string[]> = {
  RATING: ["response"],
  COMPARISON: ["responseA", "responseB"],
  WRITING: [],
  CODE_GEN: ["code"],
  CODE_REFACTOR: ["originalCode", "refactoredCode"],
  CODE_DEBUG: ["buggyCode", "aiResponse"],
  CODE_REVIEW: ["code", "aiReview"],
};

function buildTaskData(input: AddTaskInput) {
  const t = (v?: string) => (v ?? "").trim();
  // every coding kind is scored 1–5, so its answer key is a range on `overall`
  const ratingGold = input.isGold
    ? { min: input.goldMin ?? 1, max: input.goldMax ?? 5 }
    : undefined;
  const lang = t(input.language) || undefined;

  // string-valued so it satisfies Prisma's InputJsonObject without a cast
  let data: Record<string, string | undefined>;
  let goldAnswer: { min?: number; max?: number; choice?: string } | undefined;

  switch (input.kind) {
    case "WRITING":
      // the trainer writes the response — the task only carries the prompt
      return { data: {}, goldAnswer: undefined, missing: [] as string[] };
    case "RATING":
      data = { response: t(input.response) };
      goldAnswer = ratingGold;
      break;
    case "COMPARISON":
      data = { responseA: t(input.responseA), responseB: t(input.responseB) };
      goldAnswer = input.isGold && input.goldChoice ? { choice: input.goldChoice } : undefined;
      break;
    case "CODE_GEN":
      data = { language: lang, code: t(input.code) };
      goldAnswer = ratingGold;
      break;
    case "CODE_REFACTOR":
      data = {
        language: lang,
        originalCode: t(input.originalCode),
        refactoredCode: t(input.refactoredCode),
        // optional: the model's own explanation of what it changed
        aiResponse: t(input.aiResponse) || undefined,
      };
      goldAnswer = ratingGold;
      break;
    case "CODE_DEBUG":
      data = {
        language: lang,
        buggyCode: t(input.buggyCode),
        errorOutput: t(input.errorOutput) || undefined,
        aiResponse: t(input.aiResponse),
      };
      goldAnswer = ratingGold;
      break;
    case "CODE_REVIEW":
      data = { language: lang, code: t(input.code), aiReview: t(input.aiReview) };
      goldAnswer = ratingGold;
      break;
  }

  const missing = REQUIRED_COLUMNS[input.kind].filter((c) => !data[c]);
  return { data, goldAnswer, missing };
}

/** Human-readable "your file is missing X" message for a rejected row. */
function missingColumnsError(kind: KindStr, missing: string[], row: number): string {
  const cols = missing.map((c) => `"${c}"`).join(" and ");
  const label: Record<KindStr, string> = {
    RATING: "Response rating",
    COMPARISON: "Side-by-side comparison",
    WRITING: "Response writing",
    CODE_GEN: "Code generation",
    CODE_REFACTOR: "Code refactoring",
    CODE_DEBUG: "Code debugging",
    CODE_REVIEW: "Code review",
  };
  return `Task ${row}: this project is "${label[kind]}", which needs ${cols} — your file doesn't have ${missing.length === 1 ? "that column" : "those columns"}. Either add ${missing.length === 1 ? "it" : "them"}, or change the project's task type at the top of the page.`;
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
  const { data, goldAnswer, missing } = buildTaskData(input);
  if (missing.length) {
    return { ok: false, error: `Missing: ${missing.join(", ")}.` };
  }
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
    const { data, goldAnswer, missing } = buildTaskData(resolved);
    if (missing.length) {
      return { ok: false, error: missingColumnsError(kind, missing, i + 1) };
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
