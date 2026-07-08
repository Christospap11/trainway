import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Apply",
  description: "Apply to become a trainer.",
};

export default function ApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-background">
        <div className="absolute -top-32 left-1/4 h-[55vh] w-[55vh] rounded-full bg-brand-violet/25 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[45vh] w-[45vh] rounded-full bg-brand-indigo/20 blur-[120px]" />
      </div>

      <header className="flex h-16 items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-brand-indigo via-brand-violet to-brand-fuchsia text-sm text-white shadow-[0_0_20px_-2px_rgba(139,92,246,0.7)]">
            ◆
          </span>
          <span className="tracking-tight">{siteConfig.name}</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/login"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Already a trainer? <span className="text-primary">Log in</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl px-5 pb-24 pt-6 sm:px-8">
        {children}
      </div>
    </main>
  );
}
