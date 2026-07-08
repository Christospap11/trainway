"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteProject, deleteTask } from "@/app/admin/actions";

export function DeleteProjectButton({ slug, title }: { slug: string; title: string }) {
  const router = useRouter();
  const [busy, start] = useTransition();

  const del = () => {
    if (!window.confirm(`Delete "${title}" and all of its tasks? This can't be undone.`)) return;
    start(async () => {
      const res = await deleteProject(slug);
      if (res.ok) router.push("/admin/projects");
      else window.alert(res.error ?? "Could not delete the project.");
    });
  };

  return (
    <button
      onClick={del}
      disabled={busy}
      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-60"
    >
      <Trash2 size={15} /> {busy ? "Deleting…" : "Delete project"}
    </button>
  );
}

export function DeleteTaskButton({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [busy, start] = useTransition();

  const del = () => {
    if (!window.confirm("Delete this task? This can't be undone.")) return;
    start(async () => {
      const res = await deleteTask(taskId);
      if (res.ok) router.refresh();
      else window.alert(res.error ?? "Could not delete the task.");
    });
  };

  return (
    <button
      onClick={del}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/5 px-3 py-1 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/15 disabled:opacity-60"
    >
      <Trash2 size={12} /> {busy ? "…" : "Delete"}
    </button>
  );
}
