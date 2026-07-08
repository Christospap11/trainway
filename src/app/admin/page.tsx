import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  ClipboardCheck,
  Banknote,
  FolderKanban,
  UserPlus,
  Clock,
} from "lucide-react";
import { getAdminOverview, getAdminEarningsChart } from "@/lib/admin-queries";
import { EarningsChart } from "@/components/charts/earnings-chart";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  const o = await getAdminOverview();
  const chart = await getAdminEarningsChart();

  const stats = [
    { label: "Trainers", value: o.trainers, icon: Users, href: "/admin/trainers" },
    { label: "Pending applications", value: o.pendingApplications, icon: UserPlus, href: "/admin/trainers" },
    { label: "Submissions to review", value: o.submittedSubs, icon: ClipboardCheck, href: "/admin/submissions", highlight: o.submittedSubs > 0 },
    { label: "Payouts to process", value: o.pendingPayouts, icon: Banknote, href: "/admin/payouts", highlight: o.pendingPayouts > 0 },
    { label: "Projects", value: o.projects, icon: FolderKanban, href: "/admin/projects" },
    { label: "Tasks", value: o.tasks, icon: FolderKanban, href: "/admin/projects" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
        <p className="mt-1 text-muted">Operations at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={`group rounded-2xl border p-5 transition-colors ${
              s.highlight
                ? "border-amber-500/30 bg-amber-500/[0.05] hover:border-amber-500/50"
                : "border-ink/10 bg-ink/[0.02] hover:border-ink/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">{s.label}</span>
              <s.icon size={18} className={s.highlight ? "text-amber-300" : "text-primary"} strokeWidth={1.75} />
            </div>
            <div className="mt-3 text-3xl font-semibold tracking-tight">{s.value}</div>
          </Link>
        ))}
      </div>

      {/* platform earnings over time */}
      <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-6">
        <h3 className="mb-1 font-semibold">Platform earnings over time</h3>
        <p className="mb-5 text-sm text-muted">Total trainer earnings per week, by date.</p>
        <EarningsChart data={chart} />
      </div>

      <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-6">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-primary" />
          <h3 className="font-semibold">Pending earnings awaiting clearance</h3>
        </div>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-primary">
          ${o.pendingEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
        <p className="mt-1 text-sm text-muted">
          Across all trainers — cleared by QA review (auto gold checks or manual approval).
        </p>
      </div>
    </div>
  );
}
