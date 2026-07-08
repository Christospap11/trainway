import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

export function Hero() {
  return (
    <section className="relative">
      <Container className="flex min-h-[88vh] flex-col items-center justify-center py-28 text-center">
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
          <h1 className="mt-8 max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
            Get paid to train
            <br />
            the <span className="text-gradient">world&apos;s AI</span>.
          </h1>
        </Reveal>

        <Reveal delay={200}>
          <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-muted">
            A new kind of work for a new kind of intelligence. Join skilled people
            everywhere completing flexible, paid projects that make AI smarter,
            safer, and more human.
          </p>
        </Reveal>

        <Reveal delay={300}>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
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
          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-base text-muted">
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
      </Container>

      {/* scroll cue */}
      <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 sm:block">
        <div className="h-10 w-6 rounded-full border border-ink/15 p-1.5">
          <div className="mx-auto h-2 w-1 animate-bounce rounded-full bg-ink/40" />
        </div>
      </div>
    </section>
  );
}
