import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";

const steps = [
  {
    n: "01",
    title: "Apply & create your profile",
    desc: "Sign up in minutes and tell us about your skills, languages, and interests.",
  },
  {
    n: "02",
    title: "Pass a quick assessment",
    desc: "Complete a short starter assessment so we can match you to the right projects.",
  },
  {
    n: "03",
    title: "Work on AI training tasks",
    desc: "Choose from available projects and complete tasks whenever it suits your schedule.",
  },
  {
    n: "04",
    title: "Get paid",
    desc: "Earn per task or per hour, and withdraw your balance every week.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 py-28">
      <Container>
        <Reveal className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            How it works
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            From sign-up to your first payout
          </h2>
        </Reveal>

        <div className="mt-16">
          {steps.map((step, i) => (
            <Reveal key={step.n} delay={i * 80}>
              <div className="group grid grid-cols-1 items-baseline gap-4 border-t border-ink/10 py-8 transition-colors hover:border-ink/25 sm:grid-cols-[auto_1fr] sm:gap-12 md:grid-cols-[120px_1fr_2fr]">
                <span className="text-5xl font-semibold text-ink/15 transition-colors group-hover:text-primary sm:text-6xl">
                  {step.n}
                </span>
                <h3 className="text-2xl font-medium tracking-tight">
                  {step.title}
                </h3>
                <p className="max-w-md text-muted">{step.desc}</p>
              </div>
            </Reveal>
          ))}
          <div className="border-t border-ink/10" />
        </div>
      </Container>
    </section>
  );
}
