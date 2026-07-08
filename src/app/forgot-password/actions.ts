"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hit, clientIp } from "@/lib/rate-limit";

export type ForgotState = { sent?: boolean; error?: string };

export async function requestPasswordReset(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!z.string().email().safeParse(email).success) {
    return { error: "Please enter a valid email address." };
  }
  if (!hit(`reset:${await clientIp()}`, 5, 60_000)) {
    return { error: "Too many requests. Please wait a minute and try again." };
  }

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${h.get("host")}`;

  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });

  // Always report success — never reveal whether an account exists for this email.
  return { sent: true };
}
