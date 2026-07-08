"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { login, type LoginState } from "./actions";
import { DEMO_CREDENTIALS } from "@/lib/auth-shared";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { siteConfig } from "@/config/site";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    {},
  );

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-5 py-12">
      {/* theme switch — fixed top-right (this page has no nav bar) */}
      <div className="absolute right-5 top-5 z-10">
        <ThemeToggle />
      </div>

      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-background">
        <div className="absolute -top-32 left-1/2 h-[60vh] w-[60vh] -translate-x-1/2 rounded-full bg-brand-violet/30 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[40vh] w-[40vh] rounded-full bg-brand-indigo/20 blur-[120px]" />
      </div>

      <div className="w-full max-w-sm">
        {/* brand */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-indigo via-brand-violet to-brand-fuchsia text-sm text-white shadow-[0_0_22px_-2px_rgba(139,92,246,0.7)]">
            ◆
          </span>
          <span className="text-xl font-semibold tracking-tight">
            {siteConfig.name}
          </span>
        </Link>

        <div className="rounded-2xl border border-ink/10 bg-ink/[0.03] p-7 backdrop-blur-xl">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">
            Log in to your trainer dashboard.
          </p>

          <form action={formAction} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-muted" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={DEMO_CREDENTIALS.email}
                className="w-full rounded-xl border border-ink/10 bg-ink/5 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/60 focus:bg-ink/[0.07]"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-sm text-muted" htmlFor="password">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                defaultValue={DEMO_CREDENTIALS.password}
                className="w-full rounded-xl border border-ink/10 bg-ink/5 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/60 focus:bg-ink/[0.07]"
              />
            </div>

            {state.error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="group flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia font-medium text-white shadow-[0_8px_30px_-6px_rgba(139,92,246,0.6)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_44px_-6px_rgba(139,92,246,0.85)] disabled:opacity-60"
            >
              {pending ? "Logging in…" : "Log in"}
              {!pending && (
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              )}
            </button>
          </form>
        </div>

        {/* demo hint */}
        <div className="mt-4 rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-3 text-center text-xs text-muted">
          <span className="font-medium text-foreground">Demo account</span> —
          credentials are pre-filled. Just click{" "}
          <span className="text-primary">Log in</span>.
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          New here?{" "}
          <Link href="/apply" className="text-primary hover:underline">
            Apply to become a trainer
          </Link>
        </p>
      </div>
    </main>
  );
}
