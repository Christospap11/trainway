import type { Metadata } from "next";
import Link from "next/link";
import { listTrainers } from "@/lib/admin-queries";

export const metadata: Metadata = { title: "Trainers · Admin" };

const STATUS_STYLE: Record<string, string> = {
  APPROVED: "bg-emerald-500/15 text-emerald-300",
  PENDING: "bg-amber-500/15 text-amber-300",
  WAITLISTED: "bg-amber-500/15 text-amber-300",
  SUSPENDED: "bg-orange-500/15 text-orange-300",
  REJECTED: "bg-red-500/15 text-red-300",
};

export default async function AdminTrainersPage() {
  const trainers = await listTrainers();
  const pending = trainers.filter((t) => t.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Trainers</h2>
        <p className="mt-1 text-muted">
          {trainers.length} total{pending > 0 ? ` · ${pending} awaiting review` : ""}.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.02] text-left text-muted">
              <th className="px-5 py-3 font-medium">Trainer</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="hidden px-5 py-3 font-medium sm:table-cell">Quality</th>
              <th className="hidden px-5 py-3 font-medium sm:table-cell">Tasks</th>
              <th className="px-5 py-3 font-medium">Qualified</th>
            </tr>
          </thead>
          <tbody>
            {trainers.map((t) => (
              <tr key={t.id} className="border-b border-ink/5 last:border-0 hover:bg-ink/[0.02]">
                <td className="px-5 py-3.5">
                  <Link href={`/admin/trainers/${t.id}`} className="font-medium hover:text-primary">
                    {t.name}
                  </Link>
                  <div className="text-xs text-muted">{t.email}</div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[t.status] ?? "bg-ink/10 text-muted"}`}>
                    {t.status.toLowerCase()}
                  </span>
                </td>
                <td className="hidden px-5 py-3.5 text-muted sm:table-cell">{t.qualityScore}%</td>
                <td className="hidden px-5 py-3.5 text-muted sm:table-cell">{t.tasksCompleted.toLocaleString()}</td>
                <td className="px-5 py-3.5 text-muted">{t.qualifications}</td>
              </tr>
            ))}
            {trainers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted">No trainers yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
