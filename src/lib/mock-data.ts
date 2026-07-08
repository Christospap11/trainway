/**
 * Mock data for the demo trainer experience. This stands in for the database
 * until Phase 2. All shapes are designed to map cleanly onto real models later.
 */

export type TaskType =
  | "Response rating"
  | "Side-by-side comparison"
  | "Response writing"
  | "Fact-checking"
  | "Coding"
  | "Conversation design";

export type ProjectStatus = "active" | "available" | "qualifying" | "paused";

export interface Project {
  id: string;
  title: string;
  taskType: TaskType;
  description: string;
  payRate: string; // display string, e.g. "$25/hr"
  tasksAvailable: number;
  status: ProjectStatus;
  qualified: boolean;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  accentFrom: string; // tailwind color stop
  accentTo: string;
}

export interface EarningEntry {
  id: string;
  date: string; // ISO
  project: string;
  taskType: TaskType;
  tasks: number;
  amount: number;
  status: "cleared" | "pending";
}

export interface Payout {
  id: string;
  date: string;
  amount: number;
  method: string;
  status: "paid" | "processing";
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  kind: "project" | "payment" | "system";
}

export const demoUser = {
  name: "Alex Rivera",
  firstName: "Alex",
  email: "demo@trainloop.ai",
  initials: "AR",
  tier: "Expert Trainer",
  memberSince: "2025-09-01",
  location: "Lisbon, Portugal",
  languages: ["English", "Portuguese", "Spanish"],
  skills: ["Writing", "Reasoning", "Python", "Fact-checking"],
};

export const earningsSummary = {
  availableBalance: 642.5,
  pending: 188.0,
  lifetime: 8430.75,
  thisWeek: 312.25,
  lastWeek: 274.0,
};

/** Last 8 weeks of earnings for the mini chart. */
export const weeklyEarnings = [
  { week: "W1", amount: 180 },
  { week: "W2", amount: 240 },
  { week: "W3", amount: 205 },
  { week: "W4", amount: 290 },
  { week: "W5", amount: 260 },
  { week: "W6", amount: 330 },
  { week: "W7", amount: 274 },
  { week: "W8", amount: 312 },
];

export const performance = {
  qualityScore: 96, // %
  acceptanceRate: 94, // %
  tasksCompleted: 1287,
  hoursLogged: 214,
};

export const projects: Project[] = [
  {
    id: "atlas",
    title: "Project Atlas — Reasoning Evaluations",
    taskType: "Response rating",
    description:
      "Rate AI answers to complex reasoning prompts on accuracy, helpfulness, and safety.",
    payRate: "$28/hr",
    tasksAvailable: 42,
    status: "active",
    qualified: true,
    difficulty: "Intermediate",
    accentFrom: "from-brand-indigo",
    accentTo: "to-brand-violet",
  },
  {
    id: "lyra",
    title: "Project Lyra — Code Review",
    taskType: "Coding",
    description:
      "Review and evaluate AI-generated code across Python and JavaScript.",
    payRate: "$36/hr",
    tasksAvailable: 18,
    status: "active",
    qualified: true,
    difficulty: "Advanced",
    accentFrom: "from-brand-cyan",
    accentTo: "to-brand-indigo",
  },
  {
    id: "nova",
    title: "Project Nova — Side-by-Side Preferences",
    taskType: "Side-by-side comparison",
    description: "Choose the better of two responses and justify your choice.",
    payRate: "$24/hr",
    tasksAvailable: 67,
    status: "available",
    qualified: true,
    difficulty: "Beginner",
    accentFrom: "from-brand-violet",
    accentTo: "to-brand-fuchsia",
  },
  {
    id: "echo",
    title: "Project Echo — Conversation Design",
    taskType: "Conversation design",
    description: "Author natural multi-turn dialogues to train conversational AI.",
    payRate: "$30/hr",
    tasksAvailable: 25,
    status: "available",
    qualified: false,
    difficulty: "Intermediate",
    accentFrom: "from-brand-fuchsia",
    accentTo: "to-brand-violet",
  },
  {
    id: "vega",
    title: "Project Vega — Fact Verification",
    taskType: "Fact-checking",
    description: "Verify factual claims and cite reliable sources.",
    payRate: "$26/hr",
    tasksAvailable: 0,
    status: "qualifying",
    qualified: false,
    difficulty: "Intermediate",
    accentFrom: "from-brand-cyan",
    accentTo: "to-brand-violet",
  },
];

export const recentEarnings: EarningEntry[] = [
  {
    id: "e1",
    date: "2026-06-13",
    project: "Project Atlas",
    taskType: "Response rating",
    tasks: 24,
    amount: 84.0,
    status: "pending",
  },
  {
    id: "e2",
    date: "2026-06-12",
    project: "Project Lyra",
    taskType: "Coding",
    tasks: 9,
    amount: 104.0,
    status: "pending",
  },
  {
    id: "e3",
    date: "2026-06-11",
    project: "Project Nova",
    taskType: "Side-by-side comparison",
    tasks: 38,
    amount: 76.5,
    status: "cleared",
  },
  {
    id: "e4",
    date: "2026-06-10",
    project: "Project Atlas",
    taskType: "Response rating",
    tasks: 31,
    amount: 108.5,
    status: "cleared",
  },
  {
    id: "e5",
    date: "2026-06-09",
    project: "Project Lyra",
    taskType: "Coding",
    tasks: 7,
    amount: 84.0,
    status: "cleared",
  },
];

export const payouts: Payout[] = [
  {
    id: "p1",
    date: "2026-06-07",
    amount: 274.0,
    method: "PayPal",
    status: "paid",
  },
  {
    id: "p2",
    date: "2026-05-31",
    amount: 318.5,
    method: "PayPal",
    status: "paid",
  },
  {
    id: "p3",
    date: "2026-05-24",
    amount: 256.25,
    method: "PayPal",
    status: "paid",
  },
];

export const notifications: Notification[] = [
  {
    id: "n1",
    title: "New tasks available",
    body: "42 new tasks were added to Project Atlas.",
    time: "20m ago",
    unread: true,
    kind: "project",
  },
  {
    id: "n2",
    title: "Payment cleared",
    body: "$76.50 from Project Nova has cleared and is ready to withdraw.",
    time: "2h ago",
    unread: true,
    kind: "payment",
  },
  {
    id: "n3",
    title: "Qualification in review",
    body: "Your Project Vega qualification is being reviewed.",
    time: "1d ago",
    unread: false,
    kind: "system",
  },
  {
    id: "n4",
    title: "Weekly payout sent",
    body: "$274.00 was sent to your PayPal account.",
    time: "3d ago",
    unread: false,
    kind: "payment",
  },
  {
    id: "n5",
    title: "Quality bonus earned",
    body: "You earned a $15 bonus for maintaining a 95%+ quality score.",
    time: "5d ago",
    unread: false,
    kind: "system",
  },
];

export const announcements = [
  {
    id: "a1",
    title: "New high-paying coding projects launching this week",
    body: "Advanced trainers can now qualify for Project Lyra at $36/hr.",
    tag: "New",
  },
  {
    id: "a2",
    title: "Quality bonus program",
    body: "Maintain a 95%+ quality score to earn weekly performance bonuses.",
    tag: "Bonus",
  },
];
