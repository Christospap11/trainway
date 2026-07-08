"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Bell } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { dashboardNav } from "@/config/dashboard";

function currentTitle(pathname: string) {
  const match = [...dashboardNav]
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) =>
      i.href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname.startsWith(i.href),
    );
  return match?.label ?? "Dashboard";
}

export function Topbar({
  onMenu,
  user,
  availableBalance,
  unread,
}: {
  onMenu: () => void;
  user: { initials: string; firstName: string; tier: string };
  availableBalance: number;
  unread: number;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ink/10 bg-background/70 px-5 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <button onClick={onMenu} className="text-muted lg:hidden">
          <Menu size={22} />
        </button>
        <h1 className="text-lg font-semibold tracking-tight">
          {currentTitle(pathname)}
        </h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* theme switch */}
        <ThemeToggle />

        {/* balance pill */}
        <div className="hidden items-center gap-2 rounded-full border border-ink/10 bg-ink/[0.03] px-3.5 py-1.5 text-sm sm:flex">
          <span className="text-muted">Available</span>
          <span className="font-semibold text-primary">
            ${availableBalance.toFixed(2)}
          </span>
        </div>

        {/* notifications */}
        <Link
          href="/dashboard/notifications"
          aria-label="Notifications"
          className="relative grid h-9 w-9 place-items-center rounded-full border border-ink/10 bg-ink/[0.03] text-muted transition-colors hover:text-foreground"
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-fuchsia ring-2 ring-background" />
          )}
        </Link>

        {/* user */}
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-fuchsia text-sm font-semibold text-white">
            {user.initials}
          </div>
          <div className="hidden leading-tight sm:block">
            <div className="text-sm font-medium">{user.firstName}</div>
            <div className="text-xs text-muted">{user.tier}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
