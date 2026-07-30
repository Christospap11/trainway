import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { RotatingWord } from "@/components/ui/rotating-word";
import { LiveTask } from "@/components/site/live-task";

const VERBS = ["rate", "compare", "correct", "red-team", "teach"] as const;

export function Hero() {
  return (
    <section className="relative">
      {/* wider than the rest of the site: the split hero needs the room, and the
          headline must never wrap mid-phrase as the verb swaps */}
      <div className="mx-auto grid w-full max-w-7xl items-center gap-14 px-5 py-16 sm:px-6 lg:px-8 xl:grid-cols-[1fr_minmax(0,500px)] xl:gap-16">
        {/* ── the pitch */}
        <div className="relative text-center xl:text-left">
          {/* Local scrim so the copy always reads over the lattice. It has to
              be much larger than the text block: the gradient needs room to
              reach full transparency before the element ends, or the box edge
              shows up as a seam against the backdrop. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-[40%] -inset-y-[60%] -z-10 hidden bg-[radial-gradient(closest-side,var(--background)_0%,color-mix(in_oklab,var(--background)_70%,transparent)_45%,transparent_75%)] opacity-65 xl:block"
          />

          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-ink/5 px-4 py-1.5 text-sm text-muted backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-cyan opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-cyan" />
              </span>
              Now accepting new trainers worldwide
            </div>
          </Reveal>

          <Reveal delay={100}>
            {/* The rotating verb always ends its line, so a width change can
                never collide with the words after it. On narrow screens the
                longest verb ("red-team") would not fit beside "Get paid to",
                and the headline would gain and lose a line as it cycles — so
                below `sm` the verb gets a line of its own. */}
            <h1 className="mt-7 text-[2.5rem] font-semibold leading-[1.05] tracking-tight sm:text-5xl xl:text-6xl">
              Get paid to
              <br className="sm:hidden" />{" "}
              <RotatingWord words={VERBS} className="text-gradient" />
              <br />
              the world&apos;s AI.
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-muted xl:mx-0">
              Every model you have ever used was taught by people like you.
              Judge what AI says, fix what it gets wrong, and get paid for the
              expertise you already have.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:justify-center xl:justify-start">
              <Button href="/apply" size="lg">
                Become a trainer
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Button>
              <Button href="/#how-it-works" variant="ghost" size="lg">
                See how it works
              </Button>
            </div>
          </Reveal>

          <Reveal delay={400}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[15px] text-muted xl:justify-start">
              <span>
                Earn{" "}
                <span className="text-gradient font-semibold">$20–40/hour</span>
              </span>
              <span className="text-ink/20">·</span>
              <span>Paid weekly</span>
              <span className="text-ink/20">·</span>
              <span>Free to join</span>
              <span className="text-ink/20">·</span>
              <span>Work from anywhere</span>
            </div>
          </Reveal>
        </div>

        {/* ── the product, playing live */}
        <Reveal delay={200} className="relative mx-auto w-full max-w-[500px]">
          <LiveTask />
          <p className="mt-4 text-center text-xs text-muted">
            A real task from a live project — playing in real time.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
