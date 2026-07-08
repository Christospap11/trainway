"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { hit, clientIp } from "@/lib/rate-limit";

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  // throttle brute-force: 10 attempts / minute per IP
  if (!hit(`login:${await clientIp()}`, 10, 60_000)) {
    return { error: "Too many attempts. Please wait a minute and try again." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Invalid email or password." };
  }

  const profile = await prisma.user.findUnique({
    where: { email },
    select: { role: true, status: true },
  });

  // gate trainers whose account isn't active (pending review, rejected, etc.)
  if (profile?.role === "TRAINER" && profile.status !== "APPROVED") {
    await supabase.auth.signOut();
    const msg =
      profile.status === "PENDING"
        ? "Your application is under review — we'll email you once it's approved."
        : profile.status === "WAITLISTED"
          ? "You're on the waitlist — we'll be in touch when a spot opens up."
          : profile.status === "SUSPENDED"
            ? "Your account is suspended. Please contact support."
            : profile.status === "REJECTED"
              ? "Your application wasn't approved this time."
              : "Your account isn't active yet.";
    return { error: msg };
  }

  // admins land in the console; trainers in their dashboard
  redirect(profile?.role === "ADMIN" ? "/admin" : "/dashboard");
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
