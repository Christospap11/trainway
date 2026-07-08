"use client";

import { useEffect, useRef } from "react";

/**
 * Living "neural network" background. Particles drift like nodes, links form
 * between nearby nodes, and the cursor attracts + connects to nodes nearby —
 * an alive, tech feel for an AI company. Canvas-based for 60fps; honors
 * prefers-reduced-motion (renders a single static frame instead of animating).
 */
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  tone: number; // index into the active palette (resolved per-frame by theme)
};

// Brand-spectrum node tones (mostly indigo/violet, occasional cyan accent).
// Dark canvas → luminous tones; light canvas → deeper tones so nodes and links
// stay legible on the off-white background.
const TONES_DARK = [
  "129,140,248", // indigo
  "129,140,248",
  "167,139,250", // violet
  "167,139,250",
  "34,211,238", // cyan
];
const TONES_LIGHT = [
  "79,70,229", // deep indigo
  "79,70,229",
  "124,58,237", // deep violet
  "124,58,237",
  "14,116,144", // teal
];

const LINK_DIST = 130; // px — draw a line between two nodes closer than this
const MOUSE_DIST = 190; // px — cursor influence radius

export function NeuralField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Track the active theme so node/link colors stay legible on either canvas.
    let isLight = document.documentElement.classList.contains("light");

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    const mouse = { x: -9999, y: -9999 }; // raw target
    const smooth = { x: -9999, y: -9999 }; // eased position used for rendering
    let raf = 0;

    function resize() {
      if (!canvas || !ctx) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // density scales with screen area, capped for performance
      const count = Math.min(120, Math.floor((width * height) / 13000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.5 + 0.7,
        tone: Math.floor(Math.random() * TONES_DARK.length),
      }));
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // theme-resolved palette + tuning for this frame
      const palette = isLight ? TONES_LIGHT : TONES_DARK;
      const linkRGB = isLight ? "99,102,241" : "140,150,250";
      const linkBoost = isLight ? 1.6 : 1; // light links need a touch more punch
      const nodeAlpha = isLight ? 0.92 : 0.85;

      // ease the rendered cursor toward its real position for buttery motion
      if (smooth.x < -9000) {
        smooth.x = mouse.x;
        smooth.y = mouse.y;
      } else {
        smooth.x += (mouse.x - smooth.x) * 0.08;
        smooth.y += (mouse.y - smooth.y) * 0.08;
      }

      // move
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -50) p.x = width + 50;
        if (p.x > width + 50) p.x = -50;
        if (p.y < -50) p.y = height + 50;
        if (p.y > height + 50) p.y = -50;

        // gentle, eased pull toward the smoothed cursor
        const dx = smooth.x - p.x;
        const dy = smooth.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < MOUSE_DIST && dist > 0.001) {
          const f = (1 - dist / MOUSE_DIST) * 0.35;
          p.x += (dx / dist) * f;
          p.y += (dy / dist) * f;
        }
      }

      // links between nearby nodes
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DIST) {
            const o = (1 - dist / LINK_DIST) * 0.22 * linkBoost;
            ctx.strokeStyle = `rgba(${linkRGB},${o})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // brighter links from the cursor to nearby nodes
      for (const p of particles) {
        const dx = smooth.x - p.x;
        const dy = smooth.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < MOUSE_DIST) {
          const o = (1 - dist / MOUSE_DIST) * 0.5 * linkBoost;
          ctx.strokeStyle = `rgba(${palette[p.tone]},${o})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(smooth.x, smooth.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
      }

      // nodes
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${palette[p.tone]},${nodeAlpha})`;
        ctx.fill();
      }
    }

    function loop() {
      draw();
      raf = requestAnimationFrame(loop);
    }

    function onMove(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }
    function onLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
    }

    function onTheme() {
      isLight = document.documentElement.classList.contains("light");
      if (reduceMotion) draw(); // refresh the static frame for the new theme
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("themechange", onTheme);

    if (reduceMotion) {
      draw(); // single static frame, no animation
    } else {
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("mouseout", onLeave);
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("themechange", onTheme);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
