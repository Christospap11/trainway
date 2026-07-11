import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star, ShieldCheck, ChevronDown, Download } from "lucide-react";
import { getProjectAdmin } from "@/lib/admin-queries";
import { AddTaskForm, type Kind } from "@/components/admin/add-task-form";
import { ProjectStatusControl } from "@/components/admin/project-status-control";
import { ProjectTypeControl } from "@/components/admin/project-type-control";
import { DeleteProjectButton, DeleteTaskButton } from "@/components/admin/delete-controls";

export const metadata: Metadata = { title: "Project · Admin" };

export default async function AdminProjectDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getProjectAdmin(slug);
  if (!p) notFound();

  return (
    <div className="space-y-8">
      <Link href="/admin/projects" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground">
        <ArrowLeft size={16} /> All projects
      </Link>

      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">{p.title}</h2>
            <span className="rounded-full bg-ink/10 px-2.5 py-0.5 text-xs font-medium text-muted">{p.status.toLowerCase()}</span>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <a
              href={`/admin/projects/${p.slug}/export`}
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-ink/5 px-4 py-2 text-sm font-medium transition-colors hover:bg-ink/10 aria-disabled:pointer-events-none aria-disabled:opacity-50"
              aria-disabled={p.submissionCount === 0}
            >
              <Download size={15} /> Download results ({p.submissionCount})
            </a>
            <DeleteProjectButton slug={p.slug} title={p.title} />
          </div>
        </div>
        <p className="mt-2 max-w-2xl text-muted">{p.description}</p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
          <span>Type: <span className="text-foreground">{p.taskType.replace(/_/g, " ").toLowerCase()}</span></span>
          <span>Pay: <span className="font-medium text-primary">{p.payRate}</span></span>
          <span>Difficulty: <span className="text-foreground">{p.difficulty.toLowerCase()}</span></span>
          <span>Tasks available: <span className="text-foreground">{p.tasksAvailable}</span></span>
          <span>Qualified trainers: <span className="text-foreground">{p.qualifiedCount}</span></span>
          <span>Submissions: <span className="text-foreground">{p.submissionCount}</span></span>
        </div>
        <div className="mt-4 space-y-4">
          <ProjectStatusControl slug={p.slug} current={p.status} />
          <ProjectTypeControl slug={p.slug} current={p.taskType} taskCount={p.tasks.length} />
        </div>
      </div>

      {/* tasks */}
      <div>
        <h3 className="mb-1 font-semibold">Tasks ({p.tasks.length})</h3>
        <p className="mb-4 text-sm text-muted">Click any task to view its full content.</p>
        <div className="space-y-2">
          {p.tasks.map((t, i) => (
            <details key={t.id} className="group overflow-hidden rounded-xl border border-ink/10 bg-ink/[0.02]">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
                <span className="shrink-0 text-xs text-muted">{i + 1}</span>
                <span className="shrink-0 rounded bg-ink/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                  {t.kind.toLowerCase()}
                </span>
                {t.isGold && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300">
                    <Star size={11} /> gold{t.goldAnswer ? "" : " (no key!)"}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.prompt}</span>
                <ChevronDown size={16} className="shrink-0 text-muted transition-transform group-open:rotate-180" />
              </summary>

              <div className="space-y-3 border-t border-ink/10 px-4 py-4 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted">Prompt</div>
                  <p className="mt-1 whitespace-pre-wrap">{t.prompt}</p>
                </div>
                {t.kind === "RATING" && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted">AI response</div>
                    <p className="mt-1 whitespace-pre-wrap rounded-lg border border-ink/10 bg-background/40 p-3">{t.response}</p>
                  </div>
                )}
                {t.kind === "COMPARISON" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted">Response A</div>
                      <p className="mt-1 whitespace-pre-wrap rounded-lg border border-ink/10 bg-background/40 p-3">{t.responseA}</p>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted">Response B</div>
                      <p className="mt-1 whitespace-pre-wrap rounded-lg border border-ink/10 bg-background/40 p-3">{t.responseB}</p>
                    </div>
                  </div>
                )}
                {t.kind === "WRITING" && (
                  <p className="text-xs text-muted">✍️ The trainer writes the response — no answer stored on the task.</p>
                )}
                {t.kind === "CODE_GEN" && (
                  <>
                    <CodePanel label={`AI-generated code${t.language ? ` · ${t.language}` : ""}`} code={t.code} />
                    <CodePanel label="AI's explanation" code={t.aiResponse} />
                  </>
                )}
                {t.kind === "CODE_REFACTOR" && (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <CodePanel label="Original" code={t.originalCode} />
                      <CodePanel label="AI's refactor" code={t.refactoredCode} />
                    </div>
                    <CodePanel label="AI's explanation" code={t.aiResponse} />
                  </>
                )}
                {t.kind === "CODE_DEBUG" && (
                  <>
                    <CodePanel label={`Broken code${t.language ? ` · ${t.language}` : ""}`} code={t.buggyCode} />
                    {t.errorOutput && <CodePanel label="Error output" code={t.errorOutput} />}
                    <CodePanel label="AI's diagnosis & fix" code={t.aiResponse} />
                  </>
                )}
                {t.kind === "CODE_REVIEW" && (
                  <>
                    <CodePanel label={`Code under review${t.language ? ` · ${t.language}` : ""}`} code={t.code} />
                    <CodePanel label="AI's review comments" code={t.aiReview} />
                  </>
                )}
                {t.goldAnswer && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                    <Star size={11} /> Gold answer key — {t.goldAnswer}
                  </div>
                )}
                <div className="flex justify-end border-t border-ink/10 pt-3">
                  <DeleteTaskButton taskId={t.id} />
                </div>
              </div>
            </details>
          ))}
          {p.tasks.length === 0 && (
            <div className="rounded-xl border border-ink/10 bg-ink/[0.02] p-6 text-center text-sm text-muted">
              No tasks yet — add some below.
            </div>
          )}
        </div>
      </div>

      {/* add tasks */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck size={18} className="text-primary" />
          <h3 className="font-semibold">Add tasks</h3>
        </div>
        <AddTaskForm slug={p.slug} defaultKind={DEFAULT_KIND[p.taskType] ?? "RATING"} />
      </div>
    </div>
  );
}

const DEFAULT_KIND: Record<string, Kind> = {
  RESPONSE_RATING: "RATING",
  SIDE_BY_SIDE: "COMPARISON",
  RESPONSE_WRITING: "WRITING",
  CODE_GENERATION: "CODE_GEN",
  CODE_REFACTORING: "CODE_REFACTOR",
  CODE_DEBUGGING: "CODE_DEBUG",
  CODE_REVIEW: "CODE_REVIEW",
};

/** Monospace panel for the code fields on a coding task. */
function CodePanel({ label, code }: { label: string; code: string | null }) {
  if (!code) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <pre className="mt-1 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-ink/10 bg-background/40 p-3 font-mono text-xs leading-relaxed">
        {code}
      </pre>
    </div>
  );
}
