import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { listProjectsAdmin } from "@/lib/admin-queries";

export const metadata: Metadata = { title: "Projects · Admin" };

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-300",
  AVAILABLE: "bg-primary/15 text-primary",
  QUALIFYING: "bg-amber-500/15 text-amber-300",
  PAUSED: "bg-ink/10 text-muted",
};

export default async function AdminProjectsPage() {
  const projects = await listProjectsAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Projects</h2>
          <p className="mt-1 text-muted">{projects.length} total.</p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia px-5 py-2.5 text-sm font-medium text-white shadow-[0_8px_30px_-8px_rgba(139,92,246,0.6)] transition-all hover:-translate-y-0.5"
        >
          <Plus size={16} /> New project
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.02] text-left text-muted">
              <th className="px-5 py-3 font-medium">Project</th>
              <th className="hidden px-5 py-3 font-medium sm:table-cell">Type</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Tasks</th>
              <th className="px-5 py-3 text-right font-medium">Pay</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-b border-ink/5 last:border-0 hover:bg-ink/[0.02]">
                <td className="px-5 py-3.5">
                  <Link href={`/admin/projects/${p.slug}`} className="font-medium hover:text-primary">
                    {p.title}
                  </Link>
                  <div className="text-xs text-muted">/{p.slug}</div>
                </td>
                <td className="hidden px-5 py-3.5 text-muted sm:table-cell">
                  {p.taskType.replace(/_/g, " ").toLowerCase()}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[p.status] ?? ""}`}>
                    {p.status.toLowerCase()}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-muted">
                  {p.taskCount} <span className="text-xs">({p.tasksAvailable} avail)</span>
                </td>
                <td className="px-5 py-3.5 text-right font-semibold text-primary">{p.payRate}</td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted">
                  No projects yet. Create your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
