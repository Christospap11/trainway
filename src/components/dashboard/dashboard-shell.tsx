"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function DashboardShell({
  user,
  availableBalance,
  unread,
  isAdmin = false,
  children,
}: {
  user: { initials: string; firstName: string; tier: string };
  availableBalance: number;
  unread: number;
  isAdmin?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={open} onClose={() => setOpen(false)} isAdmin={isAdmin} />

      <div className="lg:pl-64">
        <Topbar
          onMenu={() => setOpen(true)}
          user={user}
          availableBalance={availableBalance}
          unread={unread}
        />

        {/* subtle ambient glow at the top of the content */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-brand-violet/10 to-transparent" />
          <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
