import { prisma } from "@/lib/prisma";
import { passesGold } from "@/lib/qa";
import { artifactLabel, objectiveLabel } from "@/lib/rubrics";
import { weeklyEarningSeries } from "@/lib/series";
import { signedScreenshotUrls } from "@/lib/storage";

const toDollars = (cents: number) => cents / 100;

// coding self-reports, spelled out for the review queue
const EXECUTION_LABEL: Record<string, string> = {
  ran_pass: "Ran it — works",
  ran_fail: "Ran it — fails",
  not_run: "Didn't run it",
};
const REPRO_LABEL: Record<string, string> = {
  repro_yes: "Reproduced & tested",
  repro_no: "Read-only review",
};

/* ───────────────────────────── overview ────────────────────────── */

export async function getAdminOverview() {
  const [
    trainers,
    pendingApplications,
    projects,
    tasks,
    submittedSubs,
    pendingPayouts,
    pendingEarningAgg,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "TRAINER" } }),
    prisma.user.count({ where: { status: "PENDING" } }),
    prisma.project.count(),
    prisma.task.count(),
    prisma.submission.count({ where: { status: "SUBMITTED" } }),
    prisma.payout.count({ where: { status: "PROCESSING" } }),
    prisma.earningEntry.aggregate({
      where: { status: "PENDING" },
      _sum: { amountCents: true },
    }),
  ]);

  return {
    trainers,
    pendingApplications,
    projects,
    tasks,
    submittedSubs,
    pendingPayouts,
    pendingEarnings: toDollars(pendingEarningAgg._sum.amountCents ?? 0),
  };
}

/** Platform-wide weekly earnings series (last 8 weeks) for the admin chart. */
export async function getAdminEarningsChart() {
  const entries = await prisma.earningEntry.findMany({
    select: { createdAt: true, amountCents: true },
  });
  return weeklyEarningSeries(entries);
}

/* ───────────────────────────── projects ────────────────────────── */

export async function listProjectsAdmin() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { tasks: true } } },
  });
  return projects.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    taskType: p.taskType,
    status: p.status,
    difficulty: p.difficulty,
    payRate: `$${Math.round(p.payRateCents / 100)}/hr`,
    tasksAvailable: p.tasksAvailable,
    taskCount: p._count.tasks,
  }));
}

export async function getProjectAdmin(slug: string) {
  const p = await prisma.project.findUnique({
    where: { slug },
    include: {
      tasks: { orderBy: { createdAt: "asc" } },
      _count: { select: { tasks: true, qualifications: true } },
    },
  });
  if (!p) return null;

  const submissionCount = await prisma.submission.count({
    where: { task: { projectId: p.id } },
  });
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    taskType: p.taskType,
    status: p.status,
    difficulty: p.difficulty,
    payRateCents: p.payRateCents,
    payRate: `$${Math.round(p.payRateCents / 100)}/hr`,
    tasksAvailable: p.tasksAvailable,
    accentFrom: p.accentFrom,
    accentTo: p.accentTo,
    qualifiedCount: p._count.qualifications,
    submissionCount,
    tasks: p.tasks.map((t) => {
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
        repoUrl?: string;
        category?: string;
        subCategory?: string;
      };
      const gold = t.goldAnswer as { min?: number; max?: number; choice?: string } | null;
      return {
        id: t.id,
        kind: t.kind,
        prompt: t.prompt,
        response: data.response ?? null,
        responseA: data.responseA ?? null,
        responseB: data.responseB ?? null,
        language: data.language ?? null,
        code: data.code ?? null,
        originalCode: data.originalCode ?? null,
        refactoredCode: data.refactoredCode ?? null,
        buggyCode: data.buggyCode ?? null,
        errorOutput: data.errorOutput ?? null,
        aiResponse: data.aiResponse ?? null,
        aiReview: data.aiReview ?? null,
        repoUrl: data.repoUrl ?? null,
        category: data.category ?? null,
        subCategory: data.subCategory ?? null,
        isGold: t.isGold,
        // human-readable answer key for the admin (e.g. "rating 1–3" / "B")
        goldAnswer:
          t.isGold && gold
            ? gold.choice
              ? `Correct: ${gold.choice}`
              : `Acceptable rating: ${gold.min ?? 1}–${gold.max ?? 5}`
            : null,
      };
    }),
  };
}

/* ─────────────────────── submission review queue ───────────────── */

export async function listSubmissionBatches() {
  const earnings = await prisma.earningEntry.findMany({
    where: { status: "PENDING", batchId: { not: null } },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, initials: true } } },
  });

  const batches = [];
  for (const e of earnings) {
    const subs = await prisma.submission.findMany({
      where: { batchId: e.batchId!, status: "SUBMITTED" },
      include: { task: { select: { prompt: true, kind: true, isGold: true, goldAnswer: true } } },
      orderBy: { createdAt: "asc" },
    });
    const items = await Promise.all(
      subs.map(async (s) => {
        const ans = s.data as {
          rating?: number;
          ratings?: Record<string, number>;
          choice?: string;
          rationale?: string;
          feedback?: string;
          execution?: string;
          repro?: string;
          missed?: string[];
          screenshots?: string[];
          // authoring
          prUrl?: string;
          artifactTypes?: string[];
          objectives?: string[];
          passScore?: number;
          notes?: string;
        };
        const overall = ans.ratings?.overall ?? ans.rating;
        // authoring reports a pass@ score; comparison a side; everything else /5
        const answer =
          s.task.kind === "AUTHORING"
            ? `pass@ ${ans.passScore ?? "—"}`
            : s.task.kind === "COMPARISON"
              ? `Chose ${ans.choice ?? "—"}`
              : `Overall ${overall ?? "—"}/5`;

        // extras worth seeing at a glance in the review queue
        const notes: string[] = [];
        if (ans.execution) notes.push(EXECUTION_LABEL[ans.execution] ?? ans.execution);
        if (ans.repro) notes.push(REPRO_LABEL[ans.repro] ?? ans.repro);
        if (ans.missed?.length) notes.push(`Missed: ${ans.missed.join(", ")}`);
        if (ans.artifactTypes?.length)
          notes.push(`Artifacts: ${ans.artifactTypes.map(artifactLabel).join(", ")}`);
        if (ans.objectives?.length)
          notes.push(`Objectives: ${ans.objectives.map(objectiveLabel).join(", ")}`);

        const goldPass =
          s.task.isGold && s.task.goldAnswer != null
            ? passesGold(s.task.kind, s.data, s.task.goldAnswer)
            : null;

        return {
          prompt: s.task.prompt,
          kind: s.task.kind,
          isGold: s.task.isGold,
          answer,
          notes,
          // the PR link is the thing an admin actually opens to review the work
          link: ans.prUrl ?? null,
          // signed URLs so the admin can actually open the private uploads
          screenshots: await signedScreenshotUrls(ans.screenshots ?? []),
          rationale: ans.feedback ?? ans.rationale ?? ans.notes ?? "",
          goldPass,
        };
      }),
    );
    const goldItems = items.filter((i) => i.goldPass !== null);
    batches.push({
      earningId: e.id,
      trainer: e.user.name,
      trainerInitials: e.user.initials ?? e.user.name.slice(0, 2).toUpperCase(),
      projectTitle: e.projectTitle ?? "—",
      taskType: e.taskType ?? "—",
      amount: toDollars(e.amountCents),
      taskCount: e.taskCount,
      createdAt: e.createdAt.toISOString(),
      items,
      goldTotal: goldItems.length,
      goldFail: goldItems.filter((i) => i.goldPass === false).length,
    });
  }
  return batches;
}

/* ───────────────────────────── payouts ─────────────────────────── */

const METHOD_LABEL: Record<string, string> = { PAYPAL: "PayPal", WISE: "Wise", STRIPE: "Stripe" };

export async function listPayouts() {
  const payouts = await prisma.payout.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, initials: true } } },
  });
  const map = (p: (typeof payouts)[number]) => ({
    id: p.id,
    trainer: p.user.name,
    initials: p.user.initials ?? p.user.name.slice(0, 2).toUpperCase(),
    amount: toDollars(p.amountCents),
    fee: toDollars(p.feeCents),
    net: toDollars(p.amountCents - p.feeCents),
    method: METHOD_LABEL[p.method] ?? p.method,
    status: p.status,
    date: p.createdAt.toISOString(),
  });
  return {
    processing: payouts.filter((p) => p.status === "PROCESSING").map(map),
    history: payouts.filter((p) => p.status !== "PROCESSING").map(map),
  };
}

/* ───────────────────────────── trainers ────────────────────────── */

export async function listTrainers() {
  const users = await prisma.user.findMany({
    where: { role: "TRAINER" },
    orderBy: { createdAt: "desc" },
    include: {
      qualifications: { select: { passed: true } },
      application: { select: { status: true } },
    },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    status: u.status,
    qualityScore: u.qualityScore,
    acceptanceRate: u.acceptanceRate,
    tasksCompleted: u.tasksCompleted,
    qualifications: u.qualifications.filter((q) => q.passed).length,
    applicationStatus: u.application?.status ?? null,
    joined: u.createdAt.toISOString(),
  }));
}

export async function getTrainer(id: string) {
  const u = await prisma.user.findUnique({
    where: { id },
    include: {
      application: true,
      qualifications: { select: { projectId: true, passed: true } },
    },
  });
  if (!u || u.role !== "TRAINER") return null;

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, taskType: true },
  });
  const qualified = new Set(u.qualifications.filter((q) => q.passed).map((q) => q.projectId));

  return {
    id: u.id,
    name: u.name,
    email: u.email,
    status: u.status,
    tier: u.tier ?? "Trainer",
    country: u.country ?? "—",
    languages: u.languages,
    skills: u.skills,
    availability: u.availability ?? "—",
    joined: u.createdAt.toISOString(),
    performance: {
      qualityScore: u.qualityScore,
      acceptanceRate: u.acceptanceRate,
      tasksCompleted: u.tasksCompleted,
      hoursLogged: u.hoursLogged,
    },
    balances: {
      available: toDollars(u.availableCents),
      pending: toDollars(u.pendingCents),
      lifetime: toDollars(u.lifetimeCents),
    },
    application: u.application
      ? {
          status: u.application.status,
          expertise: u.application.expertise,
          availability: u.application.availability,
          assessmentScore: u.application.assessmentScore,
          referral: u.application.referral,
          writingSample: u.application.writingSample,
          submitted: u.application.createdAt.toISOString(),
        }
      : null,
    projects: projects.map((p) => ({
      id: p.id,
      title: p.title,
      taskType: p.taskType,
      qualified: qualified.has(p.id),
    })),
  };
}
