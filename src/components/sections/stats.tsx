import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";

const stats = [
  { value: "25,000+", label: "Active trainers" },
  { value: "$12M+", label: "Paid to freelancers" },
  { value: "120+", label: "Countries" },
  { value: "4.8/5", label: "Trainer rating" },
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
                {s.value}
              </div>
              <div className="mt-2 text-sm text-muted">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
