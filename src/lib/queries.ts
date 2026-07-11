import { prisma } from "@/lib/prisma";
import type { Project as UiProject } from "@/lib/mock-data";
import type { WorkspaceKind, WorkspaceTask } from "@/lib/mock-tasks";
import { codingKindFromTaskType } from "@/lib/rubrics";
import { weeklyEarningSeries } from "@/lib/series";

/* ───────────────────────── display maps (DB enum → UI string) ───── */

const TASK_TYPE: Record<string, UiProject["taskType"]> = {
  RESPONSE_RATING: "Response rating",
  SIDE_BY_SIDE: "Side-by-side comparison",
  RESPONSE_WRITING: "Response writing",
  FACT_CHECK: "Fact-checking",
  CODING: "Coding",
  CODE_GENERATION: "Code generation",
  CODE_REFACTORING: "Code refactoring",
  CODE_DEBUGGING: "Code debugging",
  CODE_REVIEW: "Code review",
  CONVERSATION: "Conversation design",
};

const DIFFICULTY: Record<string, UiProject["difficulty"]> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

const STATUS: Record<string, UiProject["status"]> = {
  ACTIVE: "active",
  AVAILABLE: "available",
  QUALIFYING: "qualifying",
  PAUSED: "paused",
};

const payRate = (cents: number) => `$${Math.round(cents / 100)}/hr`;
const toDollars = (cents: number) => cents / 100;

function relativeTime(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

type DbProject = {
  slug: string;
  title: string;
  taskType: string;
  description: string;
  payRateCents: number;
  tasksAvailable: number;
  status: string;
  difficulty: string;
  accentFrom: string;
  accentTo: string;
};

function mapProject(p: DbProject, qualified: boolean): UiProject {
  return {
    id: p.slug,
    title: p.title,
    taskType: TASK_TYPE[p.taskType],
    description: p.description,
    payRate: payRate(p.payRateCents),
    tasksAvailable: p.tasksAvailable,
    status: STATUS[p.status],
    qualified,
    difficulty: DIFFICULTY[p.difficulty],
    accentFrom: p.accentFrom,
    accentTo: p.accentTo,
  };
}

/* ───────────────────────────── projects ────────────────────────── */

export async function getProjectsForUser(userId: string): Promise<UiProject[]> {
  const [projects, quals] = await Promise.all([
    prisma.project.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.userQualification.findMany({
      where: { userId, passed: true },
      select: { projectId: true },
    }),
  ]);
  const qset = new Set(quals.map((q) => q.projectId));
  return projects.map((p) => mapProject(p, qset.has(p.id)));
}

export async function getProjectBySlug(
  slug: string,
  userId: string,
): Promise<UiProject | null> {
  const p = await prisma.project.findUnique({ where: { slug } });
  if (!p) return null;
  const q = await prisma.userQualification.findUnique({
    where: { userId_projectId: { userId, projectId: p.id } },
  });
  return mapProject(p, !!q?.passed);
}

/* ───────────────────────────── overview ────────────────────────── */

export async function getOverview(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { weeklyEarnings: { orderBy: { idx: "asc" } } },
  });
  const [allProjects, announcements] = await Promise.all([
    getProjectsForUser(userId),
    prisma.announcement.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return {
    stats: {
      thisWeek: toDollars(user.thisWeekCents),
      lastWeek: toDollars(user.lastWeekCents),
      available: toDollars(user.availableCents),
      pending: toDollars(user.pendingCents),
      lifetime: toDollars(user.lifetimeCents),
      qualityScore: user.qualityScore,
      acceptanceRate: user.acceptanceRate,
      tasksCompleted: user.tasksCompleted,
      hoursLogged: user.hoursLogged,
    },
    weekly: user.weeklyEarnings.map((w) => ({
      week: w.label,
      amount: toDollars(w.amountCents),
    })),
    activeProjects: allProjects.filter((p) => p.status === "active"),
    announcements,
  };
}

/* ───────────────────────────── earnings ────────────────────────── */

export async function getEarnings(userId: string) {
  const [user, recent, payouts] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.earningEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payout.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    available: toDollars(user.availableCents),
    pending: toDollars(user.pendingCents),
    lifetime: toDollars(user.lifetimeCents),
    payoutMethod: (user.payoutMethod === "WISE" ? "wise" : "paypal") as "wise" | "paypal",
    recent: recent.map((e) => ({
      id: e.id,
      date: e.createdAt.toISOString(),
      project: e.projectTitle ?? "",
      taskType: e.taskType ?? "",
      tasks: e.taskCount,
      amount: toDollars(e.amountCents),
      status: e.status === "CLEARED" ? "cleared" : "pending",
    })),
    payouts: payouts.map((p) => ({
      id: p.id,
      date: p.createdAt.toISOString(),
      amount: toDollars(p.amountCents),
      method: p.method === "PAYPAL" ? "PayPal" : p.method === "WISE" ? "Wise" : "Stripe",
      status:
        p.status === "PAID" ? "paid" : p.status === "FAILED" ? "failed" : "processing",
    })),
  };
}

/** Weekly earnings series (last 8 weeks) for the trainer's earnings chart. */
export async function getEarningsChart(userId: string) {
  const entries = await prisma.earningEntry.findMany({
    where: { userId },
    select: { createdAt: true, amountCents: true },
  });
  return weeklyEarningSeries(entries);
}

/* ───────────────────────────── profile ─────────────────────────── */

export async function getProfile(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const qualified = (await getProjectsForUser(userId)).filter(
    (p) => p.qualified,
  );

  return {
    name: user.name,
    initials: user.initials ?? user.name.slice(0, 2).toUpperCase(),
    tier: user.tier ?? "Trainer",
    email: user.email,
    country: user.country ?? "—",
    memberSince: user.createdAt.toISOString(),
    languages: user.languages,
    skills: user.skills,
    performance: {
      qualityScore: user.qualityScore,
      acceptanceRate: user.acceptanceRate,
      tasksCompleted: user.tasksCompleted,
      hoursLogged: user.hoursLogged,
    },
    qualified,
  };
}

/* ─────────────────────────── notifications ─────────────────────── */

export async function getNotifications(userId: string) {
  const items = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return items.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    kind: n.kind.toLowerCase() as "project" | "payment" | "system",
    unread: !n.read,
    time: relativeTime(n.createdAt),
  }));
}

/* ─────────────────────────── dashboard chrome ──────────────────── */

export async function getDashboardChrome(userId: string) {
  const [user, unread] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { availableCents: true },
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);
  return { availableBalance: toDollars(user?.availableCents ?? 0), unread };
}

/* ───────────────────────────── workspace ───────────────────────── */

export async function getWorkspace(slug: string, userId: string) {
  const p = await prisma.project.findUnique({
    where: { slug },
    select: { id: true, slug: true, title: true, taskType: true, payRateCents: true, status: true },
  });
  if (!p) return null;

  const [qual, done, allTasks] = await Promise.all([
    prisma.userQualification.findUnique({
      where: { userId_projectId: { userId, projectId: p.id } },
      select: { passed: true },
    }),
    prisma.submission.findMany({
      where: { userId, task: { projectId: p.id } },
      select: { taskId: true },
    }),
    prisma.task.findMany({ where: { projectId: p.id }, orderBy: { createdAt: "asc" } }),
  ]);

  // never re-serve a task this trainer already submitted
  const doneSet = new Set(done.map((s) => s.taskId));
  const openTasks = allTasks.filter((t) => !doneSet.has(t.id));

  const kind: WorkspaceKind =
    p.taskType === "RESPONSE_RATING"
      ? "rating"
      : p.taskType === "SIDE_BY_SIDE"
        ? "comparison"
        : p.taskType === "RESPONSE_WRITING"
          ? "writing"
          : (codingKindFromTaskType(p.taskType) ?? "unsupported");

  const tasks: WorkspaceTask[] = openTasks.map((t) => {
    const data = t.data as {
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
    // NOTE: isGold / goldAnswer are deliberately NOT sent to the client —
    // they're the hidden QA answer key, used server-side by runQA only.
    if (t.kind === "WRITING") {
      return { id: t.id, kind: "writing", prompt: t.prompt };
    }
    if (t.kind === "RATING") {
      return {
        id: t.id,
        kind: "rating",
        prompt: t.prompt,
        response: data.response ?? "",
      };
    }
    if (t.kind === "CODE_GEN") {
      return {
        id: t.id,
        kind: "code_gen",
        prompt: t.prompt,
        language: data.language,
        code: data.code ?? "",
      };
    }
    if (t.kind === "CODE_REFACTOR") {
      return {
        id: t.id,
        kind: "code_refactor",
        prompt: t.prompt,
        language: data.language,
        originalCode: data.originalCode ?? "",
        refactoredCode: data.refactoredCode ?? "",
        aiResponse: data.aiResponse,
      };
    }
    if (t.kind === "CODE_DEBUG") {
      return {
        id: t.id,
        kind: "code_debug",
        prompt: t.prompt,
        language: data.language,
        buggyCode: data.buggyCode ?? "",
        errorOutput: data.errorOutput,
        aiResponse: data.aiResponse ?? "",
      };
    }
    if (t.kind === "CODE_REVIEW") {
      return {
        id: t.id,
        kind: "code_review",
        prompt: t.prompt,
        language: data.language,
        code: data.code ?? "",
        aiReview: data.aiReview ?? "",
      };
    }
    return {
      id: t.id,
      kind: "comparison",
      prompt: t.prompt,
      responseA: data.responseA ?? "",
      responseB: data.responseB ?? "",
    };
  });

  return {
    project: {
      id: p.slug,
      title: p.title,
      taskType: TASK_TYPE[p.taskType] ?? p.taskType,
      payRate: payRate(p.payRateCents),
    },
    kind,
    tasks,
    qualified: !!qual?.passed,
    paused: p.status === "PAUSED",
  };
}
