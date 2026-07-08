"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

/**
 * App-level error boundary. Catches render/data errors from any segment below
 * the root layout — including transient database hiccups (Prisma P1001
 * "can't reach database server") thrown in server components/layouts — and
 * shows a calm retry screen instead of crashing the whole tree.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // surface the real cause in the server/console logs for debugging
    console.error(error);
  }, [error]);

  const isConnectivity = /reach (the )?database|P1001|ECONNREFUSED|ENOTFOUND|fetch failed/i.test(
    error.message,
  );

  return (
    <main className="grid min-h-screen place-items-center px-5 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-indigo via-brand-violet to-brand-fuchsia text-white shadow-[0_0_30px_-6px_rgba(139,92,246,0.8)]">
          <RotateCcw size={26} />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          {isConnectivity ? "Connection hiccup" : "Something went wrong"}
        </h1>
        <p className="mt-2 text-muted">
          {isConnectivity
            ? "We couldn't reach the server for a moment. This is usually temporary — try again."
            : "An unexpected error occurred. Try again, and if it keeps happening let us know."}
        </p>
        <button
          onClick={reset}
          className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia px-6 font-medium text-white shadow-[0_8px_30px_-6px_rgba(139,92,246,0.6)] transition-all hover:-translate-y-0.5"
        >
          <RotateCcw size={16} /> Try again
        </button>
      </div>
    </main>
  );
}
