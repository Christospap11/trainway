import type { Metadata } from "next";
import { Star, Check, X } from "lucide-react";
import { listSubmissionBatches } from "@/lib/admin-queries";
import { ReviewBatch } from "@/components/admin/review-batch";
import { RunQAButton } from "@/components/dashboard/run-qa-button";

export const metadata: Metadata = { title: "Submissions · Admin" };

function relTime(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default async function AdminSubmissionsPage() {
  const batches = await listSubmissionBatches();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Submission review</h2>
          <p className="mt-1 text-muted">
            {batches.length === 0
              ? "Nothing waiting — all caught up."
              : `${batches.length} batch${batches.length === 1 ? "" : "es"} awaiting review.`}
          </p>
        </div>
        {batches.length > 0 && <RunQAButton />}
      </div>

      {batches.length === 0 && (
        <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-10 text-center text-muted">
          No pending submissions. When trainers complete work, their batches show up here.
        </div>
      )}

      <div className="space-y-5">
        {batches.map((b) => {
          const goldBad = b.goldFail > 0;
          return (
            <div key={b.earningId} className="overflow-hidden rounded-2xl border border-ink/10 bg-ink/[0.02]">
              {/* header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-fuchsia text-sm font-semibold text-white">
                    {b.trainerInitials}
                  </div>
                  <div>
                    <div className="font-medium">{b.trainer}</div>
                    <div className="text-xs text-muted">
                      {b.projectTitle} · {b.taskType} · {relTime(b.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-primary">${b.amount.toFixed(2)}</div>
                    <div className="text-xs text-muted">{b.taskCount} tasks</div>
                  </div>
                  <ReviewBatch earningId={b.earningId} />
                </div>
              </div>

              {/* gold summary */}
              {b.goldTotal > 0 && (
                <div className={`flex items-center gap-2 px-5 py-2.5 text-xs ${goldBad ? "bg-red-500/[0.06] text-red-300" : "bg-emerald-500/[0.05] text-emerald-300"}`}>
                  <Star size={12} />
                  {goldBad
                    ? `Failed ${b.goldFail}/${b.goldTotal} gold checks — recommend reject`
                    : `Passed all ${b.goldTotal} gold check${b.goldTotal === 1 ? "" : "s"}`}
                </div>
              )}

              {/* items */}
              <div className="divide-y divide-ink/5">
                {b.items.map((it, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-ink/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                          {it.kind.toLowerCase().replace(/_/g, " ")}
                        </span>
                        {it.isGold && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-300">
                            <Star size={10} /> gold
                          </span>
                        )}
                        {/* coding self-reports: did they run it, what did they say was missed */}
                        {it.notes.map((n) => (
                          <span
                            key={n}
                            className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary"
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                      <div className="mt-1 truncate text-sm">{it.prompt}</div>
                      {it.rationale && <div className="mt-0.5 truncate text-xs text-muted">“{it.rationale}”</div>}

                      {/* proof-of-run screenshots (private bucket, signed for 1h) */}
                      {it.screenshots.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {it.screenshots.map((url, j) => (
                            <a
                              key={j}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="block h-16 w-24 overflow-hidden rounded-lg border border-ink/10 transition-opacity hover:opacity-80"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt={`Screenshot ${j + 1}`}
                                className="h-full w-full object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 whitespace-nowrap text-sm">
                      <span className="text-muted">{it.answer}</span>
                      {it.goldPass === true && <Check size={15} className="text-emerald-400" />}
                      {it.goldPass === false && <X size={15} className="text-red-400" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
