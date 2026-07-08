import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Calendar } from "lucide-react";
import { getTrainer } from "@/lib/admin-queries";
import { TrainerStatusControl, QualificationToggle } from "@/components/admin/trainer-controls";

export const metadata: Metadata = { title: "Trainer · Admin" };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function AdminTrainerDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTrainer(id);
  if (!t) notFound();

  const perf = [
    { label: "Quality", value: `${t.performance.qualityScore}%` },
    { label: "Acceptance", value: `${t.performance.acceptanceRate}%` },
    { label: "Tasks", value: t.performance.tasksCompleted.toLocaleString() },
    { label: "Hours", value: `${t.performance.hoursLogged}h` },
  ];
  const bal = [
    { label: "Available", value: t.balances.available },
    { label: "Pending", value: t.balances.pending },
    { label: "Lifetime", value: t.balances.lifetime },
  ];

  return (
    <div className="space-y-8">
      <Link href="/admin/trainers" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground">
        <ArrowLeft size={16} /> All trainers
      </Link>

      {/* identity */}
      <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-6">
        <div className="flex flex-wrap items-center gap-5">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-indigo via-brand-violet to-brand-fuchsia text-xl font-semibold text-white">
            {t.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{t.name}</h2>
              <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">{t.status.toLowerCase()}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5"><Mail size={14} /> {t.email}</span>
              <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> {t.country}</span>
              <span className="inline-flex items-center gap-1.5"><Calendar size={14} /> Joined {fmtDate(t.joined)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* status control */}
      <div>
        <h3 className="mb-3 font-semibold">Account status</h3>
        <TrainerStatusControl userId={t.id} current={t.status as never} />
      </div>

      {/* application */}
      {t.application && (
        <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Application</h3>
            <span className="rounded-full bg-ink/10 px-2.5 py-0.5 text-xs text-muted">{t.application.status.toLowerCase()}</span>
          </div>
          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div><div className="text-muted">Expertise</div><div>{t.application.expertise.join(", ") || "—"}</div></div>
            <div><div className="text-muted">Availability</div><div>{t.application.availability}</div></div>
            <div><div className="text-muted">Assessment score</div><div>{t.application.assessmentScore ?? "—"}</div></div>
            <div><div className="text-muted">Referral</div><div>{t.application.referral ?? "—"}</div></div>
          </div>
          {t.application.writingSample && (
            <div className="mt-4">
              <div className="text-sm text-muted">Writing sample</div>
              <p className="mt-1 rounded-xl border border-ink/10 bg-ink/[0.02] p-3 text-sm">{t.application.writingSample}</p>
            </div>
          )}
        </div>
      )}

      {/* performance + balances */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 font-semibold">Performance</h3>
          <div className="grid grid-cols-2 gap-3">
            {perf.map((p) => (
              <div key={p.label} className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-4">
                <div className="text-xl font-semibold tracking-tight">{p.value}</div>
                <div className="mt-0.5 text-xs text-muted">{p.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-3 font-semibold">Balances</h3>
          <div className="grid grid-cols-3 gap-3">
            {bal.map((b) => (
              <div key={b.label} className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-4">
                <div className="text-lg font-semibold tracking-tight text-primary">${b.value.toFixed(2)}</div>
                <div className="mt-0.5 text-xs text-muted">{b.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* skills */}
      <div>
        <h3 className="mb-3 font-semibold">Skills & languages</h3>
        <div className="flex flex-wrap gap-2">
          {[...t.skills, ...t.languages].map((s, i) => (
            <span key={i} className="rounded-full border border-ink/10 bg-ink/5 px-3 py-1 text-sm">{s}</span>
          ))}
          {t.skills.length === 0 && t.languages.length === 0 && <span className="text-sm text-muted">None listed.</span>}
        </div>
      </div>

      {/* qualifications */}
      <div>
        <h3 className="mb-1 font-semibold">Project qualifications</h3>
        <p className="mb-4 text-sm text-muted">Control which projects this trainer can work on.</p>
        <div className="space-y-2">
          {t.projects.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-ink/10 bg-ink/[0.02] px-5 py-3.5">
              <div>
                <div className="text-sm font-medium">{p.title}</div>
                <div className="text-xs text-muted">{p.taskType.replace(/_/g, " ").toLowerCase()}</div>
              </div>
              <QualificationToggle userId={t.id} projectId={p.id} qualified={p.qualified} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
