"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Cycles a single word in place with a soft blur-and-lift cross-fade.
 *
 * All the words are stacked in one grid cell so they can dissolve into one
 * another, and the cell's width is animated to whichever word is showing —
 * without that, the element would always be as wide as the longest word and
 * leave a ragged gap before the rest of the headline.
 */
export function RotatingWord({
  words,
  interval = 2400,
  className,
}: {
  words: readonly string[];
  interval?: number;
  className?: string;
}) {
  const [active, setActive] = useState(0);
  const [width, setWidth] = useState<number | null>(null);
  const refs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(
      () => setActive((v) => (v + 1) % words.length),
      interval,
    );
    return () => clearInterval(id);
  }, [words.length, interval]);

  // Track the active word's width. Re-measure on resize and once webfonts land,
  // since both change the metrics out from under us.
  useEffect(() => {
    const measure = () => {
      const el = refs.current[active];
      if (el) setWidth(el.getBoundingClientRect().width);
    };
    measure();
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => window.removeEventListener("resize", measure);
  }, [active]);

  return (
    <span
      className="relative inline-grid text-left align-bottom transition-[width] duration-500 ease-out"
      style={width ? { width } : undefined}
    >
      {words.map((word, i) => (
        <span
          key={word}
          ref={(el) => {
            refs.current[i] = el;
          }}
          aria-hidden={i !== active}
          className={cn(
            "col-start-1 row-start-1 w-fit whitespace-nowrap transition-all duration-500 ease-out",
            i === active
              ? "translate-y-0 opacity-100 blur-0"
              : "pointer-events-none translate-y-[0.3em] opacity-0 blur-[8px]",
            className,
          )}
        >
          {word}
        </span>
      ))}
    </span>
  );
}
