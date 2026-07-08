"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";
import { applicationSchema } from "@/lib/validation";
import { hit, clientIp } from "@/lib/rate-limit";

export type ApplyInput = {
  fullName: string;
  email: string;
  password: string;
  country: string;
  languages: string[];
  expertise: string[];
  availability: string;
  referral: string | null;
};

export type ApplyResult = {
  ok: boolean;
  error?: string;
  status?: "APPROVED";
};

export async function submitApplication(
  input: ApplyInput,
): Promise<ApplyResult> {
  // throttle spam signups: 5 / minute per IP
  if (!hit(`apply:${await clientIp()}`, 5, 60_000)) {
    return { ok: false, error: "Too many attempts. Please wait a minute and try again." };
  }

  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please complete all fields correctly." };
  }
  input = parsed.data;
  const email = input.email.trim().toLowerCase();

  // 1. Create the auth account (email pre-confirmed so they can sign in now).
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { name: input.fullName },
  });

  if (error || !data.user) {
    const msg = error?.message?.toLowerCase() ?? "";
    if (msg.includes("already") || msg.includes("registered")) {
      return { ok: false, error: "An account with this email already exists." };
    }
    return { ok: false, error: error?.message ?? "Could not create account." };
  }

  const userId = data.user.id;
  const initials =
    input.fullName
      .trim()
      .split(/\s+/)
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "T";

  // 2. Create the profile + application rows. Everyone is approved on signup —
  // skill gating happens per-project via qualification quizzes, not here.
  try {
    await prisma.user.create({
      data: {
        id: userId,
        email,
        name: input.fullName,
        role: "TRAINER",
        status: "APPROVED",
        tier: "Trainer",
        country: input.country,
        languages: input.languages,
        skills: input.expertise,
        availability: input.availability,
        initials,
        agreedNdaAt: new Date(),
        agreedContractorAt: new Date(),
        application: {
          create: {
            country: input.country,
            languages: input.languages,
            expertise: input.expertise,
            availability: input.availability,
            referral: input.referral,
            status: "APPROVED",
          },
        },
      },
    });
  } catch {
    // Roll back the orphaned auth user so they can retry cleanly.
    await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {});
    return { ok: false, error: "Could not save your application. Please retry." };
  }

  // 3. Sign in immediately — approved accounts go straight to the dashboard.
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signInWithPassword({ email, password: input.password });

  return { ok: true, status: "APPROVED" };
}
