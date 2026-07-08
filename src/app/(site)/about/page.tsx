import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "About" };

const values = [
  {
    title: "Experts, not gig workers",
    desc: "We build a vetted network of skilled people — linguists, developers, and domain specialists — so the data is genuinely high quality.",
  },
  {
    title: "Technology is the craft",
    desc: "We're builders. Our custom tools make trainers faster and our quality checks stricter than generic crowdsourcing platforms.",
  },
  {
    title: "Quality over volume",
    desc: "Every submission goes through review. We'd rather deliver fewer, flawless results than cut corners at scale.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative">
        <Container className="py-24 text-center sm:py-32">
          <Reveal>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
              About us
            </p>
            <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
              Teaching AI to understand{" "}
              <span className="text-gradient">people</span>.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
              {siteConfig.name} is building the human layer behind better AI. We
              connect skilled people with meaningful, flexible work that makes AI
              models smarter, safer, and more natural — one expert judgment at a
              time.
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="py-12">
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 100}>
                <div className="border-t border-ink/10 pt-6">
                  <h3 className="text-lg font-medium tracking-tight">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-muted">{v.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-24">
        <Container className="max-w-2xl text-center">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Want to be part of it?
            </h2>
            <p className="mt-4 text-muted">
              Join our network of trainers and get paid to shape the future of AI.
            </p>
            <div className="mt-8 flex justify-center">
              <Button href="/apply" size="lg">
                Become a trainer
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
