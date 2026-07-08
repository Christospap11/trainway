import {
  PenLine,
  Star,
  GitCompare,
  ShieldCheck,
  Code2,
  MessagesSquare,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";

const tasks = [
  {
    icon: PenLine,
    title: "Response writing",
    desc: "Write the ideal answer to a prompt to teach models what great looks like.",
  },
  {
    icon: Star,
    title: "Response rating",
    desc: "Score AI responses on helpfulness, accuracy, safety, and tone.",
  },
  {
    icon: GitCompare,
    title: "Side-by-side comparison",
    desc: "Pick the better of two responses and explain your reasoning.",
  },
  {
    icon: ShieldCheck,
    title: "Fact-checking",
    desc: "Verify claims, flag errors, and cite reliable sources.",
  },
  {
    icon: Code2,
    title: "Coding tasks",
    desc: "Write, review, and evaluate code across many programming languages.",
  },
  {
    icon: MessagesSquare,
    title: "Conversation design",
    desc: "Craft natural multi-turn dialogues that train conversational AI.",
  },
];

export function TaskTypes() {
  return (
    <section id="tasks" className="scroll-mt-24 py-28">
      <Container>
        <Reveal className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            The work
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Varied, interesting tasks — no two alike
          </h2>
          <p className="mt-5 text-lg text-muted">
            From writing and rating to coding and fact-checking. New kinds of work
            are added all the time.
          </p>
        </Reveal>

        {/* hairline grid — separation by lines, not boxes */}
        <div className="mt-16 grid grid-cols-1 border-t border-ink/10 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task, i) => (
            <Reveal key={task.title} delay={(i % 3) * 100}>
              <div className="group relative h-full border-b border-ink/10 px-2 py-10 transition-colors sm:px-8">
                {/* glow on hover */}
                <div className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl" />
                </div>
                <task.icon
                  size={28}
                  className="text-primary transition-transform duration-300 group-hover:-translate-y-1"
                  strokeWidth={1.5}
                />
                <h3 className="mt-6 text-xl font-medium tracking-tight">
                  {task.title}
                </h3>
                <p className="mt-2 text-muted">{task.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
