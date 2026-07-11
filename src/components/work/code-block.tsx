"use client";

import { useState } from "react";
import { Copy, Check, TerminalSquare } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Read-only code viewer for coding tasks: line numbers, a copy button (trainers
 * need to paste the code into their own editor to actually run it), and a
 * `terminal` variant for error output / stack traces.
 *
 * Deliberately unhighlighted — a syntax highlighter would mean shipping a
 * tokenizer for every language a client might send, and a wrong highlight is
 * worse than none when someone is judging correctness.
 */
export function CodeBlock({
  code,
  language,
  title,
  terminal,
  className,
}: {
  code: string;
  language?: string;
  title?: string;
  terminal?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/\n$/, "").split("\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the code is selectable anyway */
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border",
        terminal ? "border-red-500/25 bg-red-950/20" : "border-ink/10 bg-ink/[0.03]",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-2 border-b px-3 py-1.5",
          terminal ? "border-red-500/20" : "border-ink/10",
        )}
      >
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider",
            terminal ? "text-red-300" : "text-muted",
          )}
        >
          {terminal && <TerminalSquare size={12} />}
          {title ?? language ?? "code"}
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted transition-colors hover:text-foreground"
          aria-label="Copy code"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="max-h-[26rem] overflow-auto">
        <pre className="min-w-full p-0 text-[13px] leading-[1.6]">
          <code className="block font-mono">
            {lines.map((line, i) => (
              <span key={i} className="flex hover:bg-ink/[0.04]">
                <span
                  aria-hidden
                  className="sticky left-0 w-10 shrink-0 select-none border-r border-ink/10 bg-inherit px-2 text-right text-[11px] text-muted/50"
                >
                  {i + 1}
                </span>
                <span className="whitespace-pre px-3">{line || " "}</span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
