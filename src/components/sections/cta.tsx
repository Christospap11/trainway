import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

export function Cta() {
  return (
    <section className="py-28">
      <Container>
        <Reveal className="relative overflow-hidden py-20 text-center">
          {/* glow, no box border */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-1/2 h-[120%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-brand-indigo/25 via-brand-violet/25 to-brand-fuchsia/25 blur-[100px]" />
          </div>

          <h2 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Ready to start <span className="text-gradient">earning</span>?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
            Join thousands of trainers shaping the future of AI. Applying is free
            and takes just a few minutes.
          </p>
          <div className="mt-10 flex justify-center">
            <Button href="/apply" size="lg">
              Apply now
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
