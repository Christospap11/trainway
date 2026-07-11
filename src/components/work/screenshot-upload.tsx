"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const MAX_SCREENSHOTS = 3;

type Shot = { path: string; preview: string; name: string };

/**
 * Screenshot attachment for coding tasks — the trainer's proof that they really
 * ran the code. Uploads immediately to a private bucket via /api/uploads and
 * hands the parent the storage paths; the local object URL is only ever used for
 * the thumbnail, so nothing waits on a round-trip to render.
 */
export function ScreenshotUpload({
  label,
  hint,
  required,
  paths,
  onChange,
}: {
  label: string;
  hint: string;
  required?: boolean;
  paths: string[];
  onChange: (paths: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const full = paths.length >= MAX_SCREENSHOTS;

  async function upload(files: FileList) {
    setError(null);
    const room = MAX_SCREENSHOTS - paths.length;
    const batch = Array.from(files).slice(0, room);
    if (batch.length === 0) return;

    setBusy(true);
    const added: Shot[] = [];
    for (const file of batch) {
      const body = new FormData();
      body.append("file", file);
      try {
        const res = await fetch("/api/uploads", { method: "POST", body });
        const json = (await res.json()) as { ok: boolean; path?: string; error?: string };
        if (!json.ok || !json.path) {
          setError(json.error ?? "Could not upload that image.");
          continue;
        }
        added.push({ path: json.path, preview: URL.createObjectURL(file), name: file.name });
      } catch {
        setError("Upload failed — check your connection and try again.");
      }
    }
    setBusy(false);
    if (added.length) {
      setShots((s) => [...s, ...added]);
      onChange([...paths, ...added.map((a) => a.path)]);
    }
  }

  function remove(path: string) {
    setShots((s) => s.filter((x) => x.path !== path));
    onChange(paths.filter((p) => p !== path));
    setError(null);
  }

  return (
    <div className="mt-5">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">
          {label} {required && <span className="text-red-300">*</span>}
        </span>
        <span className="text-xs text-muted">
          {paths.length} / {MAX_SCREENSHOTS}
        </span>
      </div>
      <p className="mb-2 text-xs text-muted">{hint}</p>

      <div className="flex flex-wrap gap-2">
        {shots.map((s) => (
          <div
            key={s.path}
            className="group relative h-24 w-32 overflow-hidden rounded-xl border border-ink/10 bg-ink/5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.preview} alt={s.name} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(s.path)}
              aria-label={`Remove ${s.name}`}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/80 text-muted opacity-0 backdrop-blur transition-opacity hover:text-foreground group-hover:opacity-100"
            >
              <X size={13} />
            </button>
          </div>
        ))}

        {!full && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (e.dataTransfer.files?.length) upload(e.dataTransfer.files);
            }}
            disabled={busy}
            className={cn(
              "grid h-24 w-32 place-items-center gap-1 rounded-xl border-2 border-dashed text-xs transition-colors",
              dragging
                ? "border-primary/60 bg-primary/5 text-primary"
                : "border-ink/15 bg-ink/[0.02] text-muted hover:border-ink/30 hover:text-foreground",
              busy && "pointer-events-none opacity-60",
            )}
          >
            {busy ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <ImagePlus size={18} />
                <span>Add screenshot</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) upload(e.target.files);
          e.target.value = "";
        }}
      />

      {error && (
        <p className="mt-2 inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-300">
          <AlertCircle size={13} /> {error}
        </p>
      )}
    </div>
  );
}
