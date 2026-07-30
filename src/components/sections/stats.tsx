import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { CountUp } from "@/components/ui/count-up";

const stats = [
  { value: 25000, suffix: "+", label: "Active trainers" },
  { value: 12, prefix: "$", suffix: "M+", label: "Paid to freelancers" },
  { value: 120, suffix: "+", label: "Countries" },
  { value: 4.8, decimals: 1, suffix: "/5", label: "Trainer rating" },
];

export function Stats() {
  return (
    <section className="relative py-10">
      <Container>
        <div className="grid grid-cols-2 gap-y-12 md:grid-cols-4 md:divide-x md:divide-ink/10">
          {stats.map((s, i) => (
            <Reveal
              key={s.label}
              delay={i * 100}
              className="px-4 text-center md:px-8"
            >
              <div className="text-4xl font-semibold tracking-tight sm:text-5xl">
                <CountUp
                  value={s.value}
                  decimals={s.decimals}
                  prefix={s.prefix}
                  suffix={s.suffix}
                />
              </div>
              <div className="mt-2 text-sm text-muted">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
