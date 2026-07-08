"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, LifeBuoy, Settings, X, ShieldCheck } from "lucide-react";
import { dashboardNav } from "@/config/dashboard";
import { siteConfig } from "@/config/site";
import { logout } from "@/app/login/actions";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function Sidebar({
  open,
  onClose,
  isAdmin = false,
}: {
  open: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "theme-fade fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-ink/10 bg-surface transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* brand */}
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-brand-indigo via-brand-violet to-brand-fuchsia text-sm text-white shadow-[0_0_20px_-2px_rgba(139,92,246,0.7)]">
              ◆
            </span>
            <span className="tracking-tight">{siteConfig.name}</span>
          </Link>
          <button onClick={onClose} className="text-muted lg:hidden">
            <X size={20} />
          </button>
        </div>

        {/* nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {dashboardNav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
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
                <item.icon
                  size={18}
                  className={active ? "text-primary" : ""}
                  strokeWidth={1.75}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* bottom */}
        <div className="space-y-1 border-t border-ink/10 p-3">
          {isAdmin && (
            <Link
              href="/admin"
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm font-medium text-amber-300 transition-colors hover:bg-amber-500/20"
            >
              <ShieldCheck size={18} strokeWidth={1.75} />
              Admin console
            </Link>
          )}
          <Link
            href="/dashboard/settings"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-ink/[0.03] hover:text-foreground"
          >
            <Settings size={18} strokeWidth={1.75} />
            Settings
          </Link>
          <Link
            href="/dashboard/help"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-ink/[0.03] hover:text-foreground"
          >
            <LifeBuoy size={18} strokeWidth={1.75} />
            Help & support
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
    </>
  );
}
