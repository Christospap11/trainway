import Link from "next/link";
import {
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  Star,
  Megaphone,
} from "lucide-react";
import { BarChart } from "@/components/dashboard/bar-chart";
import { getSession } from "@/lib/auth";
import { getOverview } from "@/lib/queries";

export default async function DashboardHome() {
  const user = await getSession();
  if (!user) return null;

  const { stats: s, weekly, activeProjects, announcements } =
    await getOverview(user.id);

  const weekDelta =
    s.lastWeek > 0 ? ((s.thisWeek - s.lastWeek) / s.lastWeek) * 100 : 0;

  const stats = [
    {
      label: "This week",
      value: `$${s.thisWeek.toFixed(2)}`,
      icon: TrendingUp,
      sub: `${weekDelta >= 0 ? "+" : ""}${weekDelta.toFixed(0)}% vs last week`,
    },
    {
      label: "Quality score",
      value: `${s.qualityScore}%`,
      icon: Star,
      sub: "Top 10% of trainers",
    },
    {
      label: "Tasks completed",
      value: s.tasksCompleted.toLocaleString(),
      icon: CheckCircle2,
      sub: `${s.acceptanceRate}% acceptance`,
    },
    {
      label: "Hours logged",
      value: `${s.hoursLogged}h`,
      icon: Clock,
      sub: "Lifetime",
    },
  ];

  return (
    <div className="space-y-8">
      {/* greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Welcome back, {user.firstName} 👋
          </h2>
          <p className="mt-1 text-muted">
            You have tasks waiting across your active projects.
          </p>
        </div>
        <Link
          href="/dashboard/projects"
          className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia px-5 py-2.5 text-sm font-medium text-white shadow-[0_8px_30px_-6px_rgba(139,92,246,0.6)] transition-all hover:-translate-y-0.5"
        >
          Start working
          <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">{s.label}</span>
              <s.icon size={18} className="text-primary" strokeWidth={1.75} />
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight">
              {s.value}
            </div>
            <div className="mt-1 text-xs text-muted">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* earnings card */}
        <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-6 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">Earnings</h3>
              <p className="text-sm text-muted">Last 8 weeks</p>
            </div>
            <Link
              href="/dashboard/earnings"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted">
                Available
              </div>
              <div className="mt-1 text-3xl font-semibold text-primary">
                ${s.available.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted">
                Pending
              </div>
              <div className="mt-1 text-3xl font-semibold">
                ${s.pending.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted">
                Lifetime
              </div>
              <div className="mt-1 text-3xl font-semibold">
                ${s.lifetime.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <BarChart data={weekly} />
          </div>
        </div>

        {/* announcements */}
        <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-6">
          <div className="flex items-center gap-2">
            <Megaphone size={18} className="text-primary" />
            <h3 className="font-semibold">Announcements</h3>
          </div>
          <div className="mt-4 space-y-4">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="border-b border-ink/10 pb-4 last:border-0 last:pb-0"
              >
                <span className="inline-block rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                  {a.tag}
                </span>
                <h4 className="mt-2 text-sm font-medium">{a.title}</h4>
                <p className="mt-1 text-sm text-muted">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* active projects */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Your active projects</h3>
          <Link
            href="/dashboard/projects"
            className="text-sm text-primary hover:underline"
          >
            Browse all projects
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {activeProjects.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/projects/${p.id}`}
              className="group block rounded-2xl border border-ink/10 bg-ink/[0.02] p-5 transition-colors hover:border-ink/20"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full bg-gradient-to-r ${p.accentFrom} ${p.accentTo} px-2.5 py-0.5 text-xs font-medium text-white`}
                >
                  {p.taskType}
                </span>
                <span className="text-sm font-semibold text-primary">
                  {p.payRate}
                </span>
              </div>
              <h4 className="mt-3 font-medium">{p.title}</h4>
              <p className="mt-1 text-sm text-muted">{p.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-muted">
                  {p.tasksAvailable > 0 ? "Tasks available" : "No tasks right now"}
                </span>
                <span className="text-sm font-medium text-primary group-hover:underline">
                  Continue →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
