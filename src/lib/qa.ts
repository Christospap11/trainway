import { prisma } from "@/lib/prisma";

/**
 * Shared QA clearing logic — used by both the automated gold-check pass
 * (`runQA`) and manual admin review, so a batch always clears/rejects the
 * exact same way.
 */

export type BatchEarning = {
  id: string;
  userId: string;
  amountCents: number;
  batchId: string | null;
};

// Score a gold submission against its answer key.
export function passesGold(kind: string, data: unknown, gold: unknown): boolean {
  const d = (data ?? {}) as {
    rating?: unknown;
    ratings?: { overall?: unknown };
    choice?: unknown;
    preferences?: { overall?: string };
  };
  const g = (gold ?? {}) as { min?: number; max?: number; choice?: string };
  // Every 1–5 rubric — response rating and all four coding categories — is
  // gold-checked the same way: the trainer's `overall` score has to land inside
  // the acceptable range on the task's answer key.
  if (kind === "RATING" || kind.startsWith("CODE_")) {
    // fall back to the legacy single `rating` for older submissions.
    const r = Number(d.ratings?.overall ?? d.rating);
    const min = typeof g.min === "number" ? g.min : 1;
    const max = typeof g.max === "number" ? g.max : 5;
    return Number.isFinite(r) && r >= min && r <= max;
  }
  if (kind === "COMPARISON") {
    // collapse the 5-point overall preference to A / tie / B, then compare to
    // the gold choice. `choice` is stored on submit; legacy rows had only choice.
    const p = d.preferences?.overall;
    const dir =
      p === "strong_a" || p === "slight_a"
        ? "A"
        : p === "strong_b" || p === "slight_b"
          ? "B"
          : p === "tie"
            ? "tie"
            : d.choice;
    return dir === g.choice;
  }
  return true; // unknown kind → can't auto-fail
}

// Approve a batch: submissions APPROVED, earning CLEARED, pending → available,
// lifetime updated. Idempotent: the PENDING→CLEARED transition is the lock, so a
// concurrent runQA / admin review can't double-credit.
export async function approveBatch(e: BatchEarning): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const { count } = await tx.earningEntry.updateMany({
      where: { id: e.id, status: "PENDING" },
      data: { status: "CLEARED" },
    });
    if (count === 0) return; // already cleared/rejected by another process
    if (e.batchId) {
      await tx.submission.updateMany({
        where: { batchId: e.batchId, status: "SUBMITTED" },
        data: { status: "APPROVED" },
      });
    }
    await tx.user.update({
      where: { id: e.userId },
      data: {
        pendingCents: { decrement: e.amountCents },
        availableCents: { increment: e.amountCents },
        lifetimeCents: { increment: e.amountCents },
      },
    });
  });
}

// Reject a batch: submissions REJECTED, earning dropped, pending + this-week +
// tasks-completed reversed (no pay). Idempotent: deleting the still-PENDING
// earning is the lock.
export async function rejectBatch(
  e: BatchEarning,
  feedback = "Did not meet quality standards.",
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const completedCount = e.batchId
      ? await tx.submission.count({ where: { batchId: e.batchId, status: "SUBMITTED" } })
      : 0;
    const { count } = await tx.earningEntry.deleteMany({
      where: { id: e.id, status: "PENDING" },
    });
    if (count === 0) return; // already handled
    if (e.batchId) {
      await tx.submission.updateMany({
        where: { batchId: e.batchId, status: "SUBMITTED" },
        data: { status: "REJECTED", reviewFeedback: feedback },
      });
    }
    await tx.user.update({
      where: { id: e.userId },
      data: {
        pendingCents: { decrement: e.amountCents },
        thisWeekCents: { decrement: e.amountCents },
        tasksCompleted: { decrement: completedCount },
      },
    });
  });
}

// Recompute a trainer's quality (gold pass-rate) + acceptance (approved share).
export async function recomputeScores(userId: string): Promise<void> {
  const reviewed = await prisma.submission.findMany({
    where: { userId, status: { in: ["APPROVED", "REJECTED"] } },
    include: { task: { select: { isGold: true } } },
  });
  if (reviewed.length === 0) return;
  const approved = reviewed.filter((s) => s.status === "APPROVED").length;
  const gold = reviewed.filter((s) => s.task.isGold);
  const data: { acceptanceRate: number; qualityScore?: number } = {
    acceptanceRate: Math.round((100 * approved) / reviewed.length),
  };
  if (gold.length > 0) {
    data.qualityScore = Math.round((100 * gold.filter((s) => s.status === "APPROVED").length) / gold.length);
  }
  await prisma.user.update({ where: { id: userId }, data });
}
