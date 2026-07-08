import type { Metadata } from "next";
import Link from "next/link";
import {
  Rocket,
  Wallet,
  ListChecks,
  UserRound,
  Mail,
  MessageSquare,
} from "lucide-react";

export const metadata: Metadata = { title: "Help & Support" };

const categories = [
  { icon: Rocket, title: "Getting started", desc: "Onboarding, qualifications, and your first tasks." },
  { icon: ListChecks, title: "Tasks & quality", desc: "Guidelines, gold tasks, and how QA works." },
  { icon: Wallet, title: "Payments", desc: "Earnings, fees, and withdrawals." },
  { icon: UserRound, title: "Account", desc: "Profile, security, and settings." },
];

const faqs = [
  {
    q: "When do my earnings become available?",
    a: "Submitted work goes through QA review. Once approved, it moves from Pending to Available, ready to withdraw.",
  },
  {
    q: "Why was a task flagged or rejected?",
    a: "Tasks can be rejected if they don't follow the project guidelines or fail a hidden quality check. You'll see feedback on the project page.",
  },
  {
    q: "How do I qualify for more projects?",
    a: "Some projects require a short qualification test. Open the project and select 'Take qualification'.",
  },
  {
    q: "Which payout method should I choose?",
    a: "Wise is recommended for the lowest fees (~0.5%). PayPal works almost everywhere but charges more. Set this in Settings.",
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Help & support</h2>
        <p className="mt-1 text-muted">
          Find answers fast, or get in touch with our team.
        </p>
      </div>

      {/* categories */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((c) => (
          <div
            key={c.title}
            className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-5"
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <c.icon size={22} strokeWidth={1.75} />
            </div>
            <h3 className="mt-4 font-medium">{c.title}</h3>
            <p className="mt-1 text-sm text-muted">{c.desc}</p>
          </div>
        ))}
      </div>

      {/* popular questions */}
      <div>
        <h3 className="mb-4 font-semibold">Popular questions</h3>
        <div className="divide-y divide-ink/10 overflow-hidden rounded-2xl border border-ink/10">
          {faqs.map((f) => (
            <div key={f.q} className="p-5">
              <div className="font-medium">{f.q}</div>
              <p className="mt-1.5 text-sm text-muted">{f.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* contact */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-6">
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-primary" />
            <h3 className="font-semibold">Email support</h3>
          </div>
          <p className="mt-2 text-sm text-muted">
            Get help from a real person, usually within one business day.
          </p>
          <Link
            href="mailto:support@trainway.ai"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-ink/15 bg-ink/5 px-5 text-sm font-medium transition-colors hover:bg-ink/10"
          >
            support@trainway.ai
          </Link>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-6">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-primary" />
            <h3 className="font-semibold">Community</h3>
          </div>
          <p className="mt-2 text-sm text-muted">
            Join other trainers to share tips and ask questions.
          </p>
          <a
            href="https://discord.gg/trainway"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-ink/15 bg-ink/5 px-5 text-sm font-medium transition-colors hover:bg-ink/10"
          >
            Open community
          </a>
        </div>
      </div>
    </div>
  );
}
