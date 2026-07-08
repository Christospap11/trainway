import { Clock, Globe, Banknote, Check } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

const perks = [
  {
    icon: Banknote,
    title: "Competitive pay",
    desc: "Earn per task or per hour, with rates that rise as your skills grow.",
  },
  {
    icon: Clock,
    title: "Total flexibility",
    desc: "Work as much or as little as you want, whenever you want.",
  },
  {
    icon: Globe,
    title: "Work from anywhere",
    desc: "All you need is a laptop and an internet connection.",
  },
];

const included = [
  "Weekly payouts via PayPal",
  "Transparent earnings dashboard",
  "Bonuses for high-quality work",
  "No fees to join — ever",
];

export function Pay() {
  return (
    <section id="pay" className="scroll-mt-24 py-28">
      <Container>
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <Reveal>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
              Pay
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Flexible work that pays
            </h2>
            <p className="mt-5 text-lg text-muted">
              You&apos;re an independent contractor — in full control of your
              schedule and your income. The more you work and the higher your
              quality, the more you earn.
            </p>

            <div className="mt-10 space-y-8">
              {perks.map((perk) => (
                <div key={perk.title} className="flex gap-5">
                  <perk.icon
                    size={24}
                    strokeWidth={1.5}
                    className="mt-0.5 shrink-0 text-primary"
                  />
                  <div>
                    <h3 className="font-medium">{perk.title}</h3>
                    <p className="mt-1 text-muted">{perk.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* big luminous figure — no box, just light */}
          <Reveal delay={150} className="relative">
            <div className="pointer-events-none absolute -inset-10 -z-10">
              <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-primary/20 blur-[100px]" />
            </div>

            <div className="text-sm uppercase tracking-[0.2em] text-muted">
              Typical earnings
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-gradient text-7xl font-semibold tracking-tight sm:text-8xl">
                $20–40
              </span>
            </div>
            <div className="mt-1 text-xl text-muted">per hour</div>
            <p className="mt-4 max-w-sm text-muted">
              Rates vary by project complexity and your qualifications.
            </p>

            <div className="hairline my-10" />

            <ul className="space-y-4">
              {included.map((item) => (
                <li key={item} className="flex items-center gap-3 text-lg">
                  <Check size={20} className="text-brand-cyan" />
                  {item}
                </li>
              ))}
            </ul>

            <Button href="/apply" size="lg" className="mt-10">
              Start earning
            </Button>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
