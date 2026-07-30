"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check, MousePointer2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The hero's centrepiece: a self-playing replica of the real Trainway task
 * workspace. A clinical prompt streams in, two AI responses appear side by
 * side, a ghost cursor walks the 5-question rubric and scores it, the trainer's
 * feedback types itself out, and submitting pays out — then it loops with a new
 * case.
 *
 * Everything is derived from one elapsed-time clock, so the animation is
 * deterministic and self-healing (a dropped tick never desynchronises it). It
 * ticks at 25fps and only re-renders when the derived snapshot actually
 * changes; it pauses entirely when off-screen or when the tab is hidden.
 */

// The real rubric the platform asks for side-by-side comparison work.
const DIMENSIONS = ["Clinical accuracy", "Safety", "Completeness", "Clarity & tone", "Overall"];

/** 0 = strongly A · 2 = tie · 4 = strongly B */
type Scene = {
  project: string;
  prompt: string;
  a: string;
  b: string;
  picks: [number, number, number, number, number];
  feedback: string;
  pay: string;
  time: string;
};

const SCENES: Scene[] = [
  {
    project: "Asclepius · Clinical comparison",
    prompt:
      "A 54-year-old with type 2 diabetes reports numbness and burning in both feet, worse at night. What should I tell them?",
    a: "This pattern suggests diabetic peripheral neuropathy. Review glycaemic control, test sensation with a 10g monofilament, check pedal pulses and inspect for ulcers. Duloxetine or pregabalin are first-line for symptom relief.",
    b: "Burning feet at night is usually just poor circulation. Warm socks, a magnesium supplement and elevating the legs should help. If it is still there in a few months, consider a referral.",
    picks: [1, 0, 1, 2, 1],
    feedback:
      "A identifies diabetic neuropathy and gives guideline-based management. B is unsafe — it dismisses a red-flag symptom with no exam and no follow-up.",
    pay: "$3.40",
    time: "2m 14s",
  },
  {
    project: "Asclepius · Clinical comparison",
    prompt:
      "A patient on warfarin asks whether they can take ibuprofen for their back pain. How should I answer?",
    a: "Occasional ibuprofen is fine — take it with food and stay under 1200mg a day.",
    b: "Avoid NSAIDs here. Ibuprofen raises bleeding risk on warfarin both by inhibiting platelets and by irritating the gastric mucosa, and it can push the INR up. Offer paracetamol first-line and check with their anticoagulation clinic.",
    picks: [4, 4, 3, 3, 4],
    feedback:
      "B correctly refuses the NSAID — this interaction is clinically significant. A is dangerous: no mention of bleeding risk or INR monitoring at all.",
    pay: "$3.85",
    time: "2m 41s",
  },
];

// ── timeline (ms) ───────────────────────────────────────────────────────────
const T_PROMPT = 150;
const PROMPT_MS = 900;
const T_A = 1150;
const T_B = 1900;
const RESP_MS = 1100;
const T_PICK0 = 3300;
const PICK_GAP = 750;
const T_FEEDBACK = 6700;
const FEEDBACK_MS = 1800;
const T_SUBMIT = 8800;
const T_DONE = 9200;
const T_RESET = 12000;
const CYCLE = 13000;

const LABEL_W = 100; // px — fixed so the ghost cursor can be placed with calc()
const GAP = 10;
const ROW_H = 26;
const ROW_GAP = 7;

/** How far a timed reveal has progressed, 0..1 */
function progress(t: number, start: number, dur: number) {
  return Math.max(0, Math.min(1, (t - start) / dur));
}

type Snapshot = {
  scene: number;
  prompt: number;
  a: number;
  b: number;
  picked: number; // how many rubric rows are scored
  cursorRow: number; // -1 = parked
  feedback: number;
  pressed: boolean;
  done: boolean;
  fading: boolean;
};

function derive(elapsed: number): Snapshot {
  const scene = Math.floor(elapsed / CYCLE) % SCENES.length;
  const t = elapsed % CYCLE;
  const s = SCENES[scene];

  // the cursor arrives at a row ~450ms before it commits the score
  let cursorRow = -1;
  for (let i = 0; i < 5; i++) {
    if (t >= T_PICK0 + i * PICK_GAP - 450) cursorRow = i;
  }
  let picked = 0;
  for (let i = 0; i < 5; i++) {
    if (t >= T_PICK0 + i * PICK_GAP) picked = i + 1;
  }
  if (t >= T_FEEDBACK) cursorRow = -1;

  return {
    scene,
    prompt: Math.round(progress(t, T_PROMPT, PROMPT_MS) * s.prompt.length),
    a: Math.round(progress(t, T_A, RESP_MS) * s.a.length),
    b: Math.round(progress(t, T_B, RESP_MS) * s.b.length),
    picked,
    cursorRow,
    feedback: Math.round(progress(t, T_FEEDBACK, FEEDBACK_MS) * s.feedback.length),
    pressed: t >= T_SUBMIT && t < T_DONE,
    done: t >= T_DONE && t < T_RESET,
    fading: t >= T_RESET,
  };
}

const EMPTY: Snapshot = {
  scene: 0,
  prompt: 0,
  a: 0,
  b: 0,
  picked: 0,
  cursorRow: -1,
  feedback: 0,
  pressed: false,
  done: false,
  fading: false,
};

/** A fully scored, fully typed-out card — what we show instead of animating. */
const STATIC: Snapshot = derive(T_FEEDBACK + FEEDBACK_MS);

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(MOTION_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(MOTION_QUERY).matches,
    () => false, // server: assume motion is fine, then correct on hydration
  );
}

export function LiveTask() {
  const [snap, setSnap] = useState<Snapshot>(EMPTY);
  const hostRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<string>("");
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    // Reduced motion: no clock at all — the render below shows STATIC instead.
    if (reduced) return;

    let timer: ReturnType<typeof setInterval> | null = null;
    let started = 0;
    let banked = 0; // elapsed time accumulated across pauses

    const tick = () => {
      const elapsed = banked + (performance.now() - started);
      const next = derive(elapsed);
      const key = JSON.stringify(next);
      if (key !== lastRef.current) {
        lastRef.current = key;
        setSnap(next);
      }
    };

    const play = () => {
      if (timer) return;
      started = performance.now();
      timer = setInterval(tick, 40); // 25fps is plenty for typing
    };
    const pause = () => {
      if (!timer) return;
      banked += performance.now() - started;
      clearInterval(timer);
      timer = null;
    };

    // Only animate while actually on screen AND the tab is in the foreground.
    // Both signals feed one `sync()` so returning to the tab resumes playback —
    // the IntersectionObserver won't re-fire on its own, since nothing moved.
    let inView = false;
    const sync = () => (inView && !document.hidden ? play() : pause());

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0.15 },
    );
    io.observe(host);

    document.addEventListener("visibilitychange", sync);

    return () => {
      pause();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [reduced]);

  const view = reduced ? STATIC : snap;
  const scene = SCENES[view.scene];
  const showCursor = view.cursorRow >= 0 && !view.done;
  const cursorCol = showCursor ? scene.picks[view.cursorRow] : 0;
  const frac = (cursorCol + 0.5) / 5;

  return (
    <div
      ref={hostRef}
      className={cn(
        "relative transition-opacity duration-500",
        view.fading ? "opacity-0" : "opacity-100",
      )}
    >
      {/* luminous rim + glow so the card floats off the lattice */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-indigo/20 via-brand-violet/10 to-brand-cyan/20 blur-2xl"
      />

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-surface/70 shadow-2xl backdrop-blur-xl">
        {/* ── window chrome */}
        <div className="flex items-center justify-between gap-3 border-b border-ink/10 bg-ink/[0.03] px-4 py-2.5">
          <div className="flex items-center gap-2 text-[11px] font-medium text-muted">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-cyan opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-cyan" />
            </span>
            <span className="truncate">{scene.project}</span>
          </div>
          <div className="shrink-0 font-mono text-[11px] text-muted">{scene.time}</div>
        </div>

        <div className="relative p-4">
          {/* ── the prompt */}
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
            Prompt
          </div>
          <p className="mt-1.5 min-h-[2.9rem] text-[12.5px] leading-relaxed text-foreground/90">
            {scene.prompt.slice(0, view.prompt)}
            <Caret on={view.prompt > 0 && view.prompt < scene.prompt.length} />
          </p>

          {/* ── the two candidate responses */}
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {(["a", "b"] as const).map((k) => (
              <div
                key={k}
                className="rounded-lg border border-ink/10 bg-ink/[0.02] p-2.5 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "grid h-4 w-4 place-items-center rounded text-[9px] font-bold text-white",
                      k === "a"
                        ? "bg-gradient-to-br from-brand-indigo to-brand-violet"
                        : "bg-gradient-to-br from-brand-fuchsia to-brand-cyan",
                    )}
                  >
                    {k.toUpperCase()}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted">
                    Response {k.toUpperCase()}
                  </span>
                </div>
                <p className="mt-1.5 min-h-[4.5rem] text-[11px] leading-relaxed text-muted">
                  {scene[k].slice(0, view[k])}
                  <Caret on={view[k] > 0 && view[k] < scene[k].length} />
                </p>
              </div>
            ))}
          </div>

          {/* ── the rubric */}
          <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-muted">
            <span>Your judgement</span>
            <span className="flex items-center gap-1.5 font-mono normal-case tracking-normal">
              A <span className="text-ink/25">←</span>
              <span className="text-ink/25">→</span> B
            </span>
          </div>

          <div
            className="relative mt-2"
            style={{ height: DIMENSIONS.length * ROW_H + (DIMENSIONS.length - 1) * ROW_GAP }}
          >
            {DIMENSIONS.map((dim, row) => {
              const scored = row < view.picked;
              return (
                <div
                  key={dim}
                  className="absolute inset-x-0 flex items-center"
                  style={{ top: row * (ROW_H + ROW_GAP), height: ROW_H }}
                >
                  <div
                    className="shrink-0 truncate text-[11px] text-muted"
                    style={{ width: LABEL_W, marginRight: GAP }}
                  >
                    {dim}
                  </div>
                  <div className="flex h-full flex-1 gap-1">
                    {[0, 1, 2, 3, 4].map((col) => {
                      const on = scored && scene.picks[row] === col;
                      return (
                        <div
                          key={col}
                          className={cn(
                            "flex-1 rounded-md border transition-all duration-300",
                            on
                              ? "scale-y-110 border-transparent bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia shadow-[0_0_16px_-2px_var(--brand-violet)]"
                              : "border-ink/10 bg-ink/[0.03]",
                          )}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* the ghost cursor that does the scoring */}
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute hidden transition-all duration-500 ease-out sm:block",
                showCursor ? "opacity-100" : "opacity-0",
              )}
              style={{
                top: (showCursor ? view.cursorRow : 0) * (ROW_H + ROW_GAP) + ROW_H / 2,
                left: `calc(${LABEL_W + GAP}px + ${frac * 100}% - ${frac * (LABEL_W + GAP)}px)`,
              }}
            >
              <MousePointer2
                size={16}
                className="fill-foreground text-background drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
              />
            </div>
          </div>

          {/* ── the trainer's written feedback */}
          <div className="mt-3.5 rounded-lg border border-ink/10 bg-ink/[0.02] p-2.5">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted">
              Why — min. 20 characters
            </div>
            <p className="mt-1 min-h-[2.4rem] text-[11px] leading-relaxed text-foreground/85">
              {scene.feedback.slice(0, view.feedback)}
              <Caret on={view.feedback > 0 && view.feedback < scene.feedback.length} />
            </p>
          </div>

          <div
            className={cn(
              "mt-3.5 grid w-full place-items-center rounded-lg bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia py-2 text-[12.5px] font-medium text-white transition-transform duration-150",
              view.pressed ? "scale-[0.97]" : "scale-100",
            )}
          >
            Submit &amp; continue
          </div>

          {/* ── payout confirmation */}
          <div
            className={cn(
              "absolute inset-0 grid place-items-center rounded-b-2xl bg-surface/85 backdrop-blur-md transition-all duration-500",
              view.done ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            <div
              className={cn(
                "flex flex-col items-center transition-transform duration-500",
                view.done ? "scale-100" : "scale-90",
              )}
            >
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-brand-indigo via-brand-violet to-brand-fuchsia shadow-[0_0_30px_-4px_var(--brand-violet)]">
                <Check size={24} className="text-white" strokeWidth={3} />
              </div>
              <div className="mt-4 text-4xl font-semibold tracking-tight">
                +{scene.pay}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                <Sparkles size={13} className="text-brand-cyan" />
                Task submitted in {scene.time}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Caret({ on }: { on: boolean }) {
  if (!on) return null;
  return (
    <span className="ml-0.5 inline-block h-3 w-px translate-y-0.5 animate-pulse bg-brand-cyan" />
  );
}
