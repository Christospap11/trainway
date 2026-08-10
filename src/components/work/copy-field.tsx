"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A read-only value (a repo URL) with copy-to-clipboard and, when it's a URL,
 * an open-in-new-tab affordance. Used by authoring tasks for the clone link.
 */
export function CopyField({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const isUrl = /^https?:\/\//.test(value);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the value is still selectable */
    }
  }

  return (
    <div
      className={cn(
        "flex items-stretch overflow-hidden rounded-xl border border-ink/10 bg-ink/[0.03]",
        className,
      )}
    >
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap px-3.5 py-2.5 font-mono text-sm">
        {value}
      </code>
      {isUrl && (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="grid w-11 shrink-0 place-items-center border-l border-ink/10 text-muted transition-colors hover:bg-ink/5 hover:text-foreground"
          aria-label="Open in a new tab"
        >
          <ExternalLink size={15} />
        </a>
      )}
      <button
        type="button"
        onClick={copy}
        className="grid w-11 shrink-0 place-items-center border-l border-ink/10 text-muted transition-colors hover:bg-ink/5 hover:text-foreground"
        aria-label="Copy"
      >
        {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
      </button>
    </div>
  );
}
