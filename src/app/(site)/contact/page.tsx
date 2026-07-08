import type { Metadata } from "next";
import { Mail, Briefcase, HelpCircle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ContactForm } from "@/components/site/contact-form";

export const metadata: Metadata = { title: "Contact" };

const channels = [
  { icon: HelpCircle, label: "Support", value: "support@trainway.ai" },
  { icon: Briefcase, label: "Partnerships", value: "hello@trainway.ai" },
  { icon: Mail, label: "General", value: "info@trainway.ai" },
];

export default function ContactPage() {
  return (
    <Container className="max-w-4xl py-20 sm:py-28">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Get in touch
        </h1>
        <p className="mt-5 text-lg text-muted">
          Questions about becoming a trainer, partnerships, or anything else?
          We&apos;d love to hear from you.
        </p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <ContactForm />

        <div className="space-y-6">
          {channels.map((c) => (
            <div key={c.label} className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <c.icon size={20} />
              </div>
              <div>
                <div className="text-sm text-muted">{c.label}</div>
                <a
                  href={`mailto:${c.value}`}
                  className="font-medium transition-colors hover:text-primary"
                >
                  {c.value}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
