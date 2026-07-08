"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Clock3 } from "lucide-react";
import type { Project } from "@/lib/mock-data";

const TABS = ["All", "Active", "Available", "Locked"] as const;
type Tab = (typeof TABS)[number];

function matches(p: Project, tab: Tab) {
  if (tab === "All") return true;
  if (tab === "Active") return p.status === "active";
  if (tab === "Available") return p.qualified && p.status !== "active";
  return !p.qualified; // Locked
}

function statusBadge(p: Project) {
  if (p.status === "active")
    return <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300">Active</span>;
  if (p.status === "qualifying")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-300">
        <Clock3 size={12} /> In review
      </span>
    );
  return <span className="rounded-full bg-ink/10 px-2.5 py-0.5 text-xs font-medium text-muted">Available</span>;
}

function actionFor(p: Project) {
  if (!p.qualified) return { label: "Take qualification", disabled: false };
  if (p.status === "active") return { label: "Continue working", disabled: false };
  return { label: "Start working", disabled: false };
}

export function ProjectsBrowser({ projects }: { projects: Project[] }) {
  const [tab, setTab] = useState<Tab>("All");
  const visible = projects.filter((p) => matches(p, tab));
  const count = (t: Tab) => projects.filter((p) => matches(p, t)).length;

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition-colors ${
              tab === t ? "bg-ink/10 text-foreground" : "text-muted hover:bg-ink/5 hover:text-foreground"
            }`}
          >
            {t}
            <span className="text-xs text-muted">{count(t)}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((p) => {
          const action = actionFor(p);
          return (
            <div key={p.id} className="flex flex-col rounded-2xl border border-ink/10 bg-ink/[0.02] p-6 transition-colors hover:border-ink/20">
              <div className="flex items-center justify-between gap-3">
                <span className={`rounded-full bg-gradient-to-r ${p.accentFrom} ${p.accentTo} px-2.5 py-0.5 text-xs font-medium text-white`}>
                  {p.taskType}
                </span>
                {statusBadge(p)}
              </div>

              <h3 className="mt-4 text-lg font-medium tracking-tight">{p.title}</h3>
              <p className="mt-1.5 flex-1 text-sm text-muted">{p.description}</p>

              <div className="mt-5 flex items-center gap-4 text-sm">
                <span className="font-semibold text-primary">{p.payRate}</span>
                <span className="text-muted">·</span>
                <span className="text-muted">{p.difficulty}</span>
                <span className="text-muted">·</span>
                <span className="text-muted">{p.tasksAvailable > 0 ? "Tasks available" : "No tasks yet"}</span>
              </div>

              <Link
                href={`/dashboard/projects/${p.id}`}
                className={`mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-full text-sm font-medium transition-all ${
                  p.qualified
                    ? "bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia text-white shadow-[0_8px_30px_-8px_rgba(139,92,246,0.6)] hover:-translate-y-0.5"
                    : "border border-ink/15 bg-ink/5 text-foreground hover:bg-ink/10"
                }`}
              >
                {!p.qualified && <Lock size={14} />}
                {action.label}
              </Link>
            </div>
          );
        })}
        {visible.length === 0 && (
          <div className="col-span-full rounded-2xl border border-ink/10 bg-ink/[0.02] p-10 text-center text-muted">
            No projects in this view.
          </div>
        )}
      </div>
    </div>
  );
}
