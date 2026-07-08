"use client";

import { useRef, useState } from "react";
import {
  UploadCloud,
  FileJson,
  FileSpreadsheet,
  AlertCircle,
  Star,
  X,
} from "lucide-react";
import { parseTasksFile } from "@/lib/parse-tasks";
import { cn } from "@/lib/utils";

type PreviewRow = { kind?: string; prompt?: string; isGold?: boolean };

/**
 * Drag-and-drop / click-to-browse zone for bulk task upload. Reads the file
 * client-side (FileReader), parses .json or .csv into an array of task objects,
 * shows a PREVIEW so the admin can see exactly what will be added, then on
 * confirm hands it to `onUpload` (the existing addTasksBulk action).
 */
export function TaskDropzone({
  onUpload,
  busy = false,
}: {
  onUpload: (rows: unknown[]) => Promise<boolean> | boolean;
  busy?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<unknown[] | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setRows(null);
    setFileName(file.name);
    const { rows: parsed, error: parseError } = await parseTasksFile(file);
    if (parseError) {
      setError(parseError);
      return;
    }
    if (parsed.length === 0) {
      setError("No tasks found in that file.");
      return;
    }
    setRows(parsed); // show preview, wait for confirm
  }

  function clear() {
    setRows(null);
    setFileName(null);
    setError(null);
  }

  async function confirm() {
    if (!rows) return;
    const ok = await onUpload(rows);
    if (ok) clear();
  }

  // ── preview state ──────────────────────────────────────────────
  if (rows) {
    const preview = rows as PreviewRow[];
    return (
      <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium">
            {preview.length} task{preview.length === 1 ? "" : "s"} ready from{" "}
            <span className="text-muted">{fileName}</span>
          </div>
          <button onClick={clear} disabled={busy} className="text-muted hover:text-foreground disabled:opacity-50" aria-label="Discard">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-60 space-y-1.5 overflow-y-auto rounded-xl border border-ink/10 bg-background/40 p-2">
          {preview.slice(0, 50).map((t, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-ink/[0.03]">
              <span className="mt-0.5 shrink-0 rounded bg-ink/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                {t.kind ? String(t.kind).toLowerCase() : "auto"}
              </span>
              <span className="min-w-0 flex-1 truncate">{t.prompt || <em className="text-red-300">missing prompt</em>}</span>
              {t.isGold && <Star size={13} className="mt-0.5 shrink-0 text-amber-300" />}
            </div>
          ))}
          {preview.length > 50 && (
            <div className="px-2.5 py-1.5 text-xs text-muted">…and {preview.length - 50} more</div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={confirm}
            disabled={busy}
            className="inline-flex h-10 items-center justify-center rounded-full bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia px-5 text-sm font-medium text-white shadow-[0_8px_30px_-8px_rgba(139,92,246,0.6)] transition-all hover:-translate-y-0.5 disabled:opacity-60"
          >
            {busy ? "Adding…" : `Add ${preview.length} task${preview.length === 1 ? "" : "s"}`}
          </button>
          <button onClick={clear} disabled={busy} className="text-sm text-muted transition-colors hover:text-foreground disabled:opacity-50">
            Choose a different file
          </button>
        </div>
      </div>
    );
  }

  // ── drop state ─────────────────────────────────────────────────
  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-disabled={busy}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !busy) inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (busy) return;
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging
            ? "border-primary/60 bg-primary/5"
            : "border-ink/15 bg-ink/[0.02] hover:border-ink/30 hover:bg-ink/[0.04]",
          busy && "pointer-events-none opacity-60",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".json,.csv,application/json,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />

        <div className={cn("grid h-12 w-12 place-items-center rounded-xl transition-colors", dragging ? "bg-primary/15 text-primary" : "bg-ink/5 text-muted")}>
          <UploadCloud size={24} />
        </div>

        <div>
          <div className="text-sm font-medium">
            {dragging ? "Drop to read the file" : "Drag & drop a file here"}
          </div>
          <div className="mt-0.5 text-xs text-muted">
            or <span className="text-primary">click to browse</span> · .json or .csv
          </div>
        </div>

        <div className="mt-1 flex items-center gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5"><FileJson size={14} /> JSON array</span>
          <span className="inline-flex items-center gap-1.5"><FileSpreadsheet size={14} /> CSV (comma or semicolon)</span>
        </div>
      </div>

      {error && (
        <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          <AlertCircle size={15} /> {error}
        </p>
      )}
    </div>
  );
}
