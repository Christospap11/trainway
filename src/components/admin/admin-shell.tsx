"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, ArrowLeft, ShieldCheck } from "lucide-react";
import { adminNav } from "@/config/admin";
import { logout } from "@/app/login/actions";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

export function AdminShell({
  admin,
  children,
}: {
  admin: { name: string; initials: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* sidebar */}
      <aside
        className={cn(
          "theme-fade fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-ink/10 bg-surface transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/admin" className="flex items-center gap-2.5 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-brand-indigo via-brand-violet to-brand-fuchsia text-white">
              <ShieldCheck size={16} />
            </span>
            <span className="tracking-tight">Admin</span>
          </Link>
          <button onClick={() => setOpen(false)} className="text-muted lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {adminNav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-ink/[0.06] text-foreground"
                    : "text-muted hover:bg-ink/[0.03] hover:text-foreground",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-brand-indigo to-brand-fuchsia" />
                )}
                <item.icon size={18} className={active ? "text-primary" : ""} strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-ink/10 p-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-ink/[0.03] hover:text-foreground"
          >
            <ArrowLeft size={18} strokeWidth={1.75} />
            Back to trainer view
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-ink/[0.03] hover:text-foreground"
            >
              <LogOut size={18} strokeWidth={1.75} />
              Log out
            </button>
          </form>
        </div>
      </aside>

      {/* main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ink/10 bg-background/70 px-5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="text-muted lg:hidden">
              <Menu size={22} />
            </button>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
              Admin console
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-fuchsia text-sm font-semibold text-white">
                {admin.initials}
              </div>
              <div className="hidden text-sm font-medium sm:block">{admin.name}</div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
