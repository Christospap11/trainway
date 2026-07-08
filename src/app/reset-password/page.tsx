"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { updatePassword, type ResetState } from "./actions";
import { siteConfig } from "@/config/site";

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState<ResetState, FormData>(
    updatePassword,
    {},
  );

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-5 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-background">
        <div className="absolute -top-32 left-1/2 h-[60vh] w-[60vh] -translate-x-1/2 rounded-full bg-brand-violet/30 blur-[120px]" />
      </div>

      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-indigo via-brand-violet to-brand-fuchsia text-sm text-white shadow-[0_0_22px_-2px_rgba(139,92,246,0.7)]">
            ◆
          </span>
          <span className="text-xl font-semibold tracking-tight">{siteConfig.name}</span>
        </Link>

        <div className="rounded-2xl border border-ink/10 bg-ink/[0.03] p-7 backdrop-blur-xl">
          <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
          <p className="mt-1 text-sm text-muted">Choose a strong password you don&apos;t use elsewhere.</p>

          <form action={formAction} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-muted" htmlFor="password">New password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="w-full rounded-xl border border-ink/10 bg-ink/5 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/60 focus:bg-ink/[0.07]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted" htmlFor="confirm">Confirm password</label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                required
                minLength={8}
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
              className="group flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia font-medium text-white shadow-[0_8px_30px_-6px_rgba(139,92,246,0.6)] transition-all hover:-translate-y-0.5 disabled:opacity-60"
            >
              {pending ? "Updating…" : "Update password"}
              {!pending && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/login" className="text-primary hover:underline">Back to log in</Link>
        </p>
      </div>
    </main>
  );
}
