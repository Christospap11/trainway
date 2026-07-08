"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Light/dark switch. The theme lives on the <html> class (set pre-paint by
 * ThemeScript); we read it via useSyncExternalStore so the icon stays in sync
 * across every toggle on the page without setState-in-effect. Clicking flips
 * the class, persists the choice, and fires `themechange` so canvas-based
 * ambient layers (the neural field) can recolor instantly.
 */
function subscribe(callback: () => void) {
  window.addEventListener("themechange", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("themechange", callback);
    window.removeEventListener("storage", callback);
  };
}

const isLightSnapshot = () =>
  document.documentElement.classList.contains("light");

export function ThemeToggle({ className }: { className?: string }) {
  // Server renders dark (false); client reconciles to the real theme on mount.
  const light = useSyncExternalStore(subscribe, isLightSnapshot, () => false);

  function toggle() {
    const next = !document.documentElement.classList.contains("light");
    document.documentElement.classList.toggle("light", next);
    try {
      localStorage.setItem("theme", next ? "light" : "dark");
    } catch {}
    window.dispatchEvent(new Event("themechange"));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
      title={light ? "Switch to dark mode" : "Switch to light mode"}
      className={cn(
        "relative grid h-9 w-9 place-items-center rounded-full border border-ink/10 bg-ink/[0.04] text-muted transition-colors hover:bg-ink/[0.08] hover:text-foreground",
        className,
      )}
    >
      {/* Sun + moon cross-fade/rotate so the swap feels alive, not a hard cut */}
      <Sun
        size={18}
        className={cn(
          "absolute transition-all duration-300",
          light
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0",
        )}
      />
      <Moon
        size={18}
        className={cn(
          "absolute transition-all duration-300",
          light
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100",
        )}
      />
    </button>
  );
}
