import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Lock,
  Clock3,
  CheckCircle2,
  XCircle,
  BadgeCheck,
  GraduationCap,
} from "lucide-react";
import { workspaceKindFor } from "@/lib/mock-tasks";
import { getSession } from "@/lib/auth";
import { getProjectBySlug } from "@/lib/queries";

const GUIDELINES: Record<
  string,
  { intro: string; dos: string[]; donts: string[] }
> = {
  "Response rating": {
    intro:
      "Rate each AI response on overall quality. Be consistent — the same mistake should always get the same score.",
    dos: [
      "Reward accurate, helpful, fluent answers",
      "Use the issue tags to explain low scores",
      "Judge against the prompt's intent",
    ],
    donts: [
      "Don't rate randomly to go faster",
      "Don't reward confident but false answers",
      "Don't penalise correct answers for style alone",
    ],
  },
  "Side-by-side comparison": {
    intro:
      "Choose the better of two responses to the same prompt, and explain your reasoning briefly.",
    dos: [
      "Prefer accuracy and helpfulness first",
      "Use 'Tie' only when genuinely equal",
      "Read both responses fully before deciding",
    ],
    donts: [
      "Don't always pick the longer answer",
      "Don't pick A or B by position habit",
      "Don't skip the rationale on close calls",
    ],
  },
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSession();
  if (!user) notFound();
  const project = await getProjectBySlug(id, user.id);
  if (!project) notFound();

  const guide = GUIDELINES[project.taskType];
  const supported = workspaceKindFor(project.taskType) !== "unsupported";
  const canWork =
    project.qualified && project.tasksAvailable > 0 && supported;

  return (
    <div className="space-y-8">
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} /> All projects
      </Link>

      {/* header */}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full bg-gradient-to-r ${project.accentFrom} ${project.accentTo} px-3 py-0.5 text-xs font-medium text-white`}
          >
            {project.taskType}
          </span>
          {project.qualified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
              <BadgeCheck size={13} /> Qualified
            </span>
          ) : project.status === "qualifying" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-300">
              <Clock3 size={13} /> Qualification in review
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-ink/10 px-2.5 py-0.5 text-xs font-medium text-muted">
              <Lock size={13} /> Locked
            </span>
          )}
        </div>

        <h2 className="mt-4 text-2xl font-semibold tracking-tight">
          {project.title}
        </h2>
        <p className="mt-2 max-w-2xl text-muted">{project.description}</p>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span>
            <span className="text-muted">Pay </span>
            <span className="font-semibold text-primary">{project.payRate}</span>
          </span>
          <span>
            <span className="text-muted">Difficulty </span>
            {project.difficulty}
          </span>
          <span>
            <span className="text-muted">Tasks </span>
            {project.tasksAvailable > 0 ? "Available" : "None right now"}
          </span>
        </div>

        <div className="mt-6">
          {canWork ? (
            <Link
              href={`/work/${project.id}`}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia px-7 font-medium text-white shadow-[0_8px_30px_-6px_rgba(139,92,246,0.6)] transition-all hover:-translate-y-0.5"
            >
              <Play size={18} /> Start working
            </Link>
          ) : !project.qualified ? (
            supported ? (
              <Link
                href={`/dashboard/projects/${project.id}/qualify`}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia px-7 font-medium text-white shadow-[0_8px_30px_-6px_rgba(139,92,246,0.6)] transition-all hover:-translate-y-0.5"
              >
                <GraduationCap size={18} /> Take qualification
              </Link>
            ) : (
              <span className="inline-flex h-12 items-center gap-2 text-sm text-muted">
                <Lock size={16} /> This task type isn&apos;t open for work yet.
              </span>
            )
          ) : (
            <span className="text-sm text-muted">
              No tasks available right now — check back soon.
            </span>
          )}
        </div>
      </div>

      {/* guidelines */}
      {guide && (
        <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-6">
          <h3 className="font-semibold">Guidelines</h3>
          <p className="mt-2 text-muted">{guide.intro}</p>

          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-300">
                <CheckCircle2 size={16} /> Do
              </div>
              <ul className="space-y-2">
                {guide.dos.map((d) => (
                  <li key={d} className="flex gap-2 text-sm text-muted">
                    <span className="text-emerald-400">•</span> {d}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-red-300">
                <XCircle size={16} /> Don&apos;t
              </div>
              <ul className="space-y-2">
                {guide.donts.map((d) => (
                  <li key={d} className="flex gap-2 text-sm text-muted">
                    <span className="text-red-400">•</span> {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {!supported && (
        <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-6 text-sm text-muted">
          The workspace for this task type is coming soon. We started with rating
          and side-by-side comparison tasks.
        </div>
      )}
    </div>
  );
}
