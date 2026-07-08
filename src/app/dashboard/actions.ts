"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { passesGold, approveBatch, rejectBatch, recomputeScores } from "@/lib/qa";
import { withdrawalSchema, settingsSchema } from "@/lib/validation";

const MIN_WITHDRAWAL_CENTS = 1000; // $10.00 minimum payout

/* ───────────────────────────── withdraw ────────────────────────── */

export type WithdrawResult = {
  ok: boolean;
  error?: string;
  netCents?: number;
};

/**
 * Creates a Payout (status PROCESSING), debits the trainer's available
 * balance, and drops a payment notification — all atomically. Amount and
 * method are validated server-side against the real balance.
 */
export async function requestWithdrawal(input: {
  amountCents: number;
  method: "wise" | "paypal";
}): Promise<WithdrawResult> {
  const user = await getSession();
  if (!user) return { ok: false, error: "You're not signed in." };

  const parsed = withdrawalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a valid amount." };
  const { amountCents: amount, method: methodKey } = parsed.data;

  if (amount < MIN_WITHDRAWAL_CENTS) {
    return { ok: false, error: `Minimum withdrawal is $${(MIN_WITHDRAWAL_CENTS / 100).toFixed(2)}.` };
  }

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { availableCents: true, iban: true, paypalEmail: true },
  });
  if (!profile) return { ok: false, error: "No profile found." };

  // must have a payout destination on file for the chosen method
  if (methodKey === "wise" && !profile.iban?.trim()) {
    return { ok: false, error: "Add your bank IBAN in Settings before withdrawing via Wise." };
  }
  if (methodKey === "paypal" && !profile.paypalEmail?.trim()) {
    return { ok: false, error: "Add your PayPal email in Settings before withdrawing." };
  }

  const method = methodKey === "wise" ? "WISE" : "PAYPAL";
  const rate = methodKey === "wise" ? 0.005 : 0.04;
  const feeCents = Math.round(amount * rate);
  const label = method === "WISE" ? "Wise" : "PayPal";

  try {
    await prisma.$transaction(async (tx) => {
      // atomic, conditional debit — fails (count 0) if balance changed under us
      const debit = await tx.user.updateMany({
        where: { id: user.id, availableCents: { gte: amount } },
        data: { availableCents: { decrement: amount } },
      });
      if (debit.count === 0) throw new Error("INSUFFICIENT");
      await tx.payout.create({
        data: { userId: user.id, amountCents: amount, feeCents, method, status: "PROCESSING" },
      });
      await tx.notification.create({
        data: {
          userId: user.id,
          kind: "PAYMENT",
          title: "Withdrawal requested",
          body: `$${((amount - feeCents) / 100).toFixed(2)} via ${label} is processing. Payouts clear weekly.`,
        },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT") {
      return { ok: false, error: "Amount exceeds your available balance." };
    }
    return { ok: false, error: "Could not process the withdrawal. Please retry." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/earnings");
  revalidatePath("/dashboard/notifications");
  return { ok: true, netCents: amount - feeCents };
}

/* ─────────────────────────── notifications ─────────────────────── */

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  const user = await getSession();
  if (!user) return { ok: false };
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/notifications");
  return { ok: true };
}

export async function markNotificationRead(id: string): Promise<{ ok: boolean }> {
  const user = await getSession();
  if (!user) return { ok: false };
  // scoped to the owner so a user can't flip someone else's notification
  await prisma.notification.updateMany({
    where: { id, userId: user.id },
    data: { read: true },
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/notifications");
  return { ok: true };
}

/* ───────────────────────────── settings ────────────────────────── */

export type SettingsResult = { ok: boolean; error?: string };

/**
 * Persists profile name + payout settings. Email is intentionally not changed
 * here (it's tied to the Supabase Auth account).
 */
export async function updateSettings(input: {
  name: string;
  payoutMethod: "wise" | "paypal";
  iban?: string;
  paypalEmail?: string;
  notifyPrefs?: { tasks: boolean; payments: boolean; announcements: boolean };
}): Promise<SettingsResult> {
  const user = await getSession();
  if (!user) return { ok: false, error: "You're not signed in." };

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form fields." };
  const { name, payoutMethod, iban, paypalEmail, notifyPrefs } = parsed.data;

  const initials =
    name
      .split(/\s+/)
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "T";

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        initials,
        payoutMethod: payoutMethod === "wise" ? "WISE" : "PAYPAL",
        iban: iban?.trim() || null,
        paypalEmail: paypalEmail?.trim() || null,
        ...(notifyPrefs ? { notifyPrefs } : {}),
      },
    });
  } catch {
    return { ok: false, error: "Could not save your settings. Please retry." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/profile");
  return { ok: true };
}

/* ─────────────────────────── QA / clearing ─────────────────────── */

export type QAResult = {
  ok: boolean;
  error?: string;
  cleared?: number;
  rejected?: number;
  clearedCents?: number;
};

/**
 * ADMIN-ONLY auto-QA over ALL trainers' PENDING batches (trainers must never be
 * able to clear their own earnings). A batch passes if every hidden gold task in
 * it was answered correctly: pass → APPROVED + cleared (pending → available);
 * fail → REJECTED + dropped. Then recomputes each affected trainer's scores.
 */
export async function runQA(): Promise<QAResult> {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") return { ok: false, error: "Not authorized." };

  const pending = await prisma.earningEntry.findMany({
    where: { status: "PENDING", batchId: { not: null } },
  });

  let cleared = 0,
    rejected = 0,
    clearedCents = 0;
  const affected = new Set<string>();

  for (const e of pending) {
    const subs = await prisma.submission.findMany({
      where: { batchId: e.batchId!, status: "SUBMITTED" },
      include: { task: { select: { isGold: true, goldAnswer: true, kind: true } } },
    });
    let goldTotal = 0,
      goldFail = 0;
    for (const s of subs) {
      if (s.task.isGold && s.task.goldAnswer != null) {
        goldTotal++;
        if (!passesGold(s.task.kind, s.data, s.task.goldAnswer)) goldFail++;
      }
    }
    const passed = goldTotal === 0 ? true : goldFail === 0;

    try {
      if (passed) {
        await approveBatch(e);
        cleared++;
        clearedCents += e.amountCents;
        await prisma.notification.create({
          data: { userId: e.userId, kind: "PAYMENT", title: "Work approved", body: `A batch passed QA — $${(e.amountCents / 100).toFixed(2)} cleared to your available balance.` },
        });
      } else {
        await rejectBatch(e, "Failed a gold-standard quality check.");
        rejected++;
        await prisma.notification.create({
          data: { userId: e.userId, kind: "PAYMENT", title: "Work needs revision", body: "A batch didn't pass a quality check and wasn't paid this time." },
        });
      }
      affected.add(e.userId);
    } catch {
      // leave this batch pending; a later run can retry it
    }
  }

  for (const uid of affected) await recomputeScores(uid);

  revalidatePath("/admin");
  revalidatePath("/admin/submissions");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/earnings");
  revalidatePath("/dashboard/notifications");
  return { ok: true, cleared, rejected, clearedCents };
}
