"use client";

import { useState, useTransition } from "react";
import { FolderKanban, Wallet, Bell, CheckCheck } from "lucide-react";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/dashboard/actions";
import { cn } from "@/lib/utils";

const ICONS = {
  project: FolderKanban,
  payment: Wallet,
  system: Bell,
} as const;

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  kind: "project" | "payment" | "system";
  unread: boolean;
  time: string;
};

export function NotificationsList({ initial }: { initial: NotificationItem[] }) {
  const [items, setItems] = useState(initial);
  const [, startTransition] = useTransition();
  const unread = items.filter((n) => n.unread).length;

  // optimistic UI, then persist; the revalidated server data confirms it
  const markAllRead = () => {
    setItems((arr) => arr.map((n) => ({ ...n, unread: false })));
    startTransition(() => {
      markAllNotificationsRead();
    });
  };

  const markOneRead = (id: string) => {
    setItems((arr) =>
      arr.map((x) => (x.id === id ? { ...x, unread: false } : x)),
    );
    startTransition(() => {
      markNotificationRead(id);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Notifications</h2>
          <p className="mt-1 text-muted">
            {unread > 0 ? `You have ${unread} unread` : "You're all caught up"}.
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-ink/5 px-4 py-2 text-sm transition-colors hover:bg-ink/10"
          >
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/10">
        {items.map((n, i) => {
          const Icon = ICONS[n.kind];
          return (
            <button
              key={n.id}
              onClick={() => markOneRead(n.id)}
              className={cn(
                "flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-ink/[0.02]",
                i !== items.length - 1 && "border-b border-ink/10",
                n.unread && "bg-ink/[0.02]",
              )}
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{n.title}</span>
                  {n.unread && (
                    <span className="h-2 w-2 rounded-full bg-brand-fuchsia" />
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted">{n.body}</p>
              </div>
              <span className="shrink-0 text-xs text-muted">{n.time}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
