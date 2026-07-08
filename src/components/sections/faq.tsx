"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Do I need experience to join?",
    a: "Many projects require no prior experience — just strong reading, writing, and reasoning skills. Specialized projects (like coding) may require relevant expertise, and you'll qualify for those over time.",
  },
  {
    q: "How much can I earn?",
    a: "Pay varies by project and your qualifications, typically ranging from $20–40 per hour. You're paid per task or per hour depending on the project.",
  },
  {
    q: "When and how do I get paid?",
    a: "We pay out weekly via PayPal. Your earnings dashboard shows pending and cleared balances in real time.",
  },
  {
    q: "Is this a full-time job?",
    a: "No — you're an independent contractor with complete flexibility. Work as much or as little as you like, whenever suits you.",
  },
  {
    q: "What do I need to get started?",
    a: "A laptop or computer, a reliable internet connection, and fluency in at least one supported language. That's it.",
  },
  {
    q: "How does the application work?",
    a: "You'll fill out a short profile and complete a starter assessment. Once approved, you can begin qualifying for and working on projects.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-ink/10">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-6 py-6 text-left text-lg font-medium transition-colors hover:text-primary"
      >
        {q}
        <Plus
          size={22}
          className={cn(
            "shrink-0 text-muted transition-transform duration-300",
            open && "rotate-45 text-primary",
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-300",
          open ? "grid-rows-[1fr] pb-6 opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <p className="max-w-2xl text-muted">{a}</p>
        </div>
      </div>
    </div>
  );
}

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
              FAQ
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Questions, answered
            </h2>
          </div>
          <div className="border-t border-ink/10">
            {faqs.map((f) => (
              <FaqItem key={f.q} {...f} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
