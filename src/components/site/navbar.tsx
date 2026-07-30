"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/** px of scroll before the bar fades in its glass background + hairline */
const SOLID_AFTER = 8;
/** stay put until we're clear of the hero, so it can't flicker on small scrolls */
const HIDE_AFTER = 140;
/** ignore scroll jitter below this many px */
const DELTA = 5;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    lastY.current = window.scrollY;
    let raf = 0;

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        setAtTop(y <= SOLID_AFTER);

        const delta = y - lastY.current;
        if (Math.abs(delta) < DELTA) return;
        lastY.current = y;
        // Auto-hide is an enhancement — skip it entirely for readers who have
        // asked for reduced motion, and never near the top of the page.
        if (!reduce) setHidden(delta > 0 && y > HIDE_AFTER);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Prime from the real scroll position: the browser can restore a scroll
    // offset, or the page can load at an #anchor, and the bar would otherwise
    // stay transparent over content until the reader happened to scroll.
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // An open menu must never slide itself out of view.
  const isHidden = hidden && !open;
  const isBare = atTop && !open;

  return (
    <header
      // Keyboard users tabbing into the nav while it is hidden would otherwise
      // be focusing something they cannot see.
      onFocusCapture={() => setHidden(false)}
      className={cn(
        "sticky top-0 z-50 transition-transform duration-300 ease-out",
        isHidden ? "-translate-y-full" : "translate-y-0",
      )}
    >
      {/*
        The glass sits on its own layer so it can cross-fade. Toggling
        `backdrop-blur` directly would pop, and leaving the blur on at the top
        of the page would smear the lattice into a visible band under the bar.
      */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 -z-10 border-b border-ink/10 bg-background/70 backdrop-blur-xl transition-opacity duration-300 ease-out",
          isBare ? "opacity-0" : "opacity-100",
        )}
      />

      <Container className="flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-brand-indigo via-brand-violet to-brand-fuchsia text-sm text-white shadow-[0_0_20px_-2px_rgba(139,92,246,0.7)]">
            ◆
          </span>
          <span className="text-lg tracking-tight">{siteConfig.name}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-9 md:flex">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Button href="/login" variant="ghost" size="sm">
            Log in
          </Button>
          <Button href="/apply" size="sm">
            Apply now
          </Button>
        </div>

        {/* Mobile: theme switch + menu toggle */}
        <div className="flex items-center gap-1.5 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="grid h-9 w-9 place-items-center"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </Container>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-ink/5 bg-background/90 backdrop-blur-xl md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {siteConfig.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-ink/5 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Button href="/login" variant="outline" size="sm">
                Log in
              </Button>
              <Button href="/apply" size="sm">
                Apply now
              </Button>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
