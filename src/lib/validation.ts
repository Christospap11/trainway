import { z } from "zod";

// Hard cap on time a single task can bill — anti-fraud (a malicious client
// could otherwise claim an enormous timeSpentSec and earn unlimited pay).
export const MAX_TASK_SECONDS = 1800; // 30 minutes

/* ───────────────────────────── work / batch ────────────────────── */

export const taskResultSchema = z.object({
  taskId: z.string().uuid(),
  action: z.enum(["completed", "skipped", "flagged"]),
  // clamp rather than reject so one odd value can't fail a whole batch
  timeSpentSec: z
    .coerce.number()
    .catch(0)
    .transform((n) => Math.min(MAX_TASK_SECONDS, Math.max(0, Math.round(n || 0)))),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const batchSchema = z.array(taskResultSchema).max(500);

/* ───────────────────────────── withdrawal ──────────────────────── */

export const withdrawalSchema = z.object({
  amountCents: z.coerce.number().int().positive().max(100_000_00), // ≤ $100k sanity cap
  method: z.enum(["wise", "paypal"]),
});

/* ───────────────────────────── settings ────────────────────────── */

export const settingsSchema = z.object({
  name: z.string().trim().min(1).max(100),
  payoutMethod: z.enum(["wise", "paypal"]),
  iban: z.string().trim().max(40).optional(),
  paypalEmail: z.string().trim().email().max(200).optional().or(z.literal("")),
  notifyPrefs: z
    .object({
      tasks: z.boolean(),
      payments: z.boolean(),
      announcements: z.boolean(),
    })
    .optional(),
});

/* ───────────────────────────── application ─────────────────────── */

export const applicationSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(200),
  country: z.string().trim().min(1).max(80),
  languages: z.array(z.string().max(60)).max(30),
  expertise: z.array(z.string().max(60)).max(30),
  availability: z.string().trim().max(60),
  referral: z.string().trim().max(200).nullable(),
});
