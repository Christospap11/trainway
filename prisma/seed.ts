import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";
import { applySecurity } from "./apply-security";
import {
  demoUser,
  projects,
  earningsSummary,
  weeklyEarnings,
  performance,
  recentEarnings,
  payouts,
  notifications,
  announcements,
} from "../src/lib/mock-data";
import { getTasks } from "../src/lib/mock-tasks";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const DEMO_PASSWORD = "REDACTED_DEMO_PASSWORD";
const ADMIN_EMAIL = "admin@trainway.ai";
const ADMIN_PASSWORD = "REDACTED_ADMIN_PASSWORD";

// Create a Supabase auth user (or find it if it already exists) and return its id.
async function getOrCreateAuthUser(
  email: string,
  password: string,
  name: string,
): Promise<string> {
  const { data } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (data?.user) return data.user.id;

  const { data: list, error: listErr } =
    await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) throw listErr;
  const existing = list.users.find((u) => u.email === email);
  if (!existing) throw new Error(`Could not create or find auth user ${email}`);
  return existing.id;
}

let DEMO_USER_ID = "";
let ADMIN_USER_ID = "";

const TASK_TYPE = {
  "Response rating": "RESPONSE_RATING",
  "Side-by-side comparison": "SIDE_BY_SIDE",
  "Response writing": "RESPONSE_WRITING",
  "Fact-checking": "FACT_CHECK",
  Coding: "CODING",
  "Conversation design": "CONVERSATION",
} as const;

const DIFFICULTY = {
  Beginner: "BEGINNER",
  Intermediate: "INTERMEDIATE",
  Advanced: "ADVANCED",
} as const;

const STATUS = {
  active: "ACTIVE",
  available: "AVAILABLE",
  qualifying: "QUALIFYING",
  paused: "PAUSED",
} as const;

const cents = (s: number) => Math.round(s * 100);
const rateCents = (payRate: string) =>
  cents(Number(payRate.match(/(\d+)/)?.[1] ?? 0));

async function main() {
  console.log("Ensuring demo + admin auth users…");
  DEMO_USER_ID = await getOrCreateAuthUser(demoUser.email, DEMO_PASSWORD, demoUser.name);
  ADMIN_USER_ID = await getOrCreateAuthUser(ADMIN_EMAIL, ADMIN_PASSWORD, "Platform Admin");
  console.log("Demo:", DEMO_USER_ID, "Admin:", ADMIN_USER_ID);

  // SAFETY: never wipe real data. This destructive seed only runs on an empty
  // database. If projects already exist (admin created them), skip entirely so
  // nothing an admin built ever disappears. Use SEED_FORCE=1 to wipe + reseed.
  const force = process.env.SEED_FORCE === "1";
  const existingProjects = await prisma.project.count();
  if (existingProjects > 0 && !force) {
    console.log(
      `DB already has ${existingProjects} project(s) — skipping seed to protect existing data. (Set SEED_FORCE=1 to wipe + reseed the demo.)`,
    );
    await applySecurity(prisma); // ensure RLS is on regardless
    return;
  }

  console.log("Clearing existing data…");
  await prisma.earningEntry.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.userQualification.deleteMany();
  await prisma.task.deleteMany();
  await prisma.application.deleteMany();
  await prisma.project.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seeding admin user…");
  await prisma.user.create({
    data: {
      id: ADMIN_USER_ID,
      email: ADMIN_EMAIL,
      name: "Platform Admin",
      role: "ADMIN",
      status: "APPROVED",
      tier: "Admin",
      initials: "PA",
    },
  });

  console.log("Seeding demo user…");
  await prisma.user.create({
    data: {
      id: DEMO_USER_ID,
      email: demoUser.email,
      name: demoUser.name,
      role: "TRAINER",
      status: "APPROVED",
      tier: demoUser.tier,
      country: "Portugal",
      languages: [...demoUser.languages],
      skills: [...demoUser.skills],
      availability: "20-30",
      initials: demoUser.initials,
      payoutMethod: "PAYPAL",
      paypalEmail: demoUser.email,
      agreedNdaAt: new Date(),
      agreedContractorAt: new Date(),
      availableCents: cents(earningsSummary.availableBalance),
      pendingCents: cents(earningsSummary.pending),
      lifetimeCents: cents(earningsSummary.lifetime),
      thisWeekCents: cents(earningsSummary.thisWeek),
      lastWeekCents: cents(earningsSummary.lastWeek),
      qualityScore: performance.qualityScore,
      acceptanceRate: performance.acceptanceRate,
      tasksCompleted: performance.tasksCompleted,
      hoursLogged: performance.hoursLogged,
      weeklyEarnings: {
        create: weeklyEarnings.map((w, i) => ({
          idx: i,
          label: w.week,
          amountCents: cents(w.amount),
        })),
      },
    },
  });

  console.log("Seeding projects + tasks…");
  for (const p of projects) {
    const tasks = getTasks(p.id).map((t) => ({
      kind:
        t.kind === "rating"
          ? ("RATING" as const)
          : t.kind === "comparison"
            ? ("COMPARISON" as const)
            : ("WRITING" as const),
      prompt: t.prompt,
      data:
        t.kind === "rating"
          ? { response: t.response }
          : t.kind === "comparison"
            ? { responseA: t.responseA, responseB: t.responseB }
            : {},
      isGold: "isGold" in t ? (t.isGold ?? false) : false,
      goldAnswer: "goldAnswer" in t ? (t.goldAnswer ?? undefined) : undefined,
    }));

    const project = await prisma.project.create({
      data: {
        slug: p.id,
        title: p.title,
        description: p.description,
        taskType: TASK_TYPE[p.taskType],
        payRateCents: rateCents(p.payRate),
        payModel: "PER_TASK",
        difficulty: DIFFICULTY[p.difficulty],
        status: STATUS[p.status],
        tasksAvailable: p.tasksAvailable,
        accentFrom: p.accentFrom,
        accentTo: p.accentTo,
        tasks: { create: tasks },
      },
    });

    if (p.qualified) {
      await prisma.userQualification.create({
        data: { userId: DEMO_USER_ID, projectId: project.id, passed: true },
      });
    }
  }

  console.log("Seeding earnings, payouts, notifications, announcements…");
  await prisma.earningEntry.createMany({
    data: recentEarnings.map((e) => ({
      userId: DEMO_USER_ID,
      amountCents: cents(e.amount),
      status: e.status === "cleared" ? ("CLEARED" as const) : ("PENDING" as const),
      projectTitle: e.project,
      taskType: e.taskType,
      taskCount: e.tasks,
      createdAt: new Date(e.date),
    })),
  });

  await prisma.payout.createMany({
    data: payouts.map((p) => ({
      userId: DEMO_USER_ID,
      amountCents: cents(p.amount),
      method: "PAYPAL",
      status: p.status === "paid" ? "PAID" : "PROCESSING",
      createdAt: new Date(p.date),
    })),
  });

  const now = Date.now();
  const MIN = 60_000;
  const offsets = [20 * MIN, 120 * MIN, 24 * 60 * MIN, 72 * 60 * MIN, 120 * 60 * MIN];
  await prisma.notification.createMany({
    data: notifications.map((n, i) => ({
      userId: DEMO_USER_ID,
      title: n.title,
      body: n.body,
      kind: n.kind.toUpperCase() as "PROJECT" | "PAYMENT" | "SYSTEM",
      read: !n.unread,
      createdAt: new Date(now - (offsets[i] ?? 0)),
    })),
  });

  await prisma.announcement.createMany({
    data: announcements.map((a) => ({
      title: a.title,
      body: a.body,
      tag: a.tag,
    })),
  });

  const counts = {
    users: await prisma.user.count(),
    projects: await prisma.project.count(),
    tasks: await prisma.task.count(),
    earnings: await prisma.earningEntry.count(),
    payouts: await prisma.payout.count(),
    notifications: await prisma.notification.count(),
    announcements: await prisma.announcement.count(),
  };
  console.log("Applying RLS lockdown…");
  await applySecurity(prisma);

  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
