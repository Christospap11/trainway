"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Info, ShieldCheck } from "lucide-react";
import { Input, FieldLabel } from "@/components/ui/input";
import { updateSettings } from "@/app/dashboard/actions";
import { cn } from "@/lib/utils";

type Prefs = { tasks: boolean; payments: boolean; announcements: boolean };

const METHODS = [
  {
    key: "wise" as const,
    name: "Wise",
    recommended: true,
    fee: "~0.5% fee",
    blurb: "Best exchange rate, paid to your bank account.",
  },
  {
    key: "paypal" as const,
    name: "PayPal",
    recommended: false,
    fee: "~3–5% fee",
    blurb: "Available almost everywhere. Fees deducted by PayPal.",
  },
];

const PREFS: { key: keyof Prefs; label: string; desc: string }[] = [
  { key: "tasks", label: "New tasks available", desc: "When projects you're on add work" },
  { key: "payments", label: "Payments", desc: "Cleared earnings and payouts" },
  { key: "announcements", label: "Announcements", desc: "Product news and bonuses" },
];

export function SettingsForm({
  user,
}: {
  user: {
    name: string;
    email: string;
    method: "wise" | "paypal";
    iban: string;
    paypalEmail: string;
    prefs: Prefs;
  };
}) {
  const [name, setName] = useState(user.name);
  const [email] = useState(user.email);
  const [method, setMethod] = useState<"wise" | "paypal">(user.method);
  const [iban, setIban] = useState(user.iban);
  const [paypalEmail, setPaypalEmail] = useState(user.paypalEmail);
  const [prefs, setPrefs] = useState<Prefs>(user.prefs);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    const res = await updateSettings({
      name,
      payoutMethod: method,
      iban: method === "wise" ? iban : undefined,
      paypalEmail: method === "paypal" ? paypalEmail : undefined,
      notifyPrefs: prefs,
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError(res.error ?? "Could not save your settings.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Account */}
      <Section title="Account">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="name">Full name</FieldLabel>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              value={email}
              readOnly
              disabled
              className="cursor-not-allowed opacity-60"
              title="Your login email can't be changed here."
            />
            <p className="mt-1 text-xs text-muted">
              Tied to your login — contact support to change it.
            </p>
          </div>
        </div>
        <Link
          href="/forgot-password"
          className="mt-4 inline-block rounded-full border border-ink/15 bg-ink/5 px-4 py-2 text-sm transition-colors hover:bg-ink/10"
        >
          Change password
        </Link>
      </Section>

      {/* Payment method */}
      <Section title="Payment method">
        <div className="grid gap-3 sm:grid-cols-2">
          {METHODS.map((m) => {
            const on = method === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setMethod(m.key)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-colors",
                  on
                    ? "border-primary/50 bg-primary/10"
                    : "border-ink/10 bg-ink/5 hover:border-ink/20",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{m.name}</span>
                    {m.recommended && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                        Recommended
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "grid h-5 w-5 place-items-center rounded-full border",
                      on ? "border-primary bg-primary text-white" : "border-ink/25",
                    )}
                  >
                    {on && <Check size={13} />}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-muted">{m.blurb}</p>
                <p className="mt-2 text-sm font-medium text-primary">{m.fee}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          {method === "wise" ? (
            <div>
              <FieldLabel htmlFor="iban">Bank IBAN</FieldLabel>
              <Input
                id="iban"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                placeholder="GR00 0000 0000 0000 0000 0000 000"
              />
            </div>
          ) : (
            <div>
              <FieldLabel htmlFor="ppemail">PayPal email</FieldLabel>
              <Input
                id="ppemail"
                type="email"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-3 rounded-xl border border-ink/10 bg-ink/[0.02] p-4 text-sm text-muted">
          <Info size={18} className="mt-0.5 shrink-0 text-primary" />
          <p>
            We cover the cost of sending your payment. Any{" "}
            <span className="text-foreground">receiving or currency-conversion fees</span>{" "}
            charged by the provider are deducted from the final amount.
          </p>
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Email notifications">
        <div className="space-y-1">
          {PREFS.map((p) => (
            <div
              key={p.key}
              className="flex items-center justify-between py-2.5"
            >
              <div>
                <div className="text-sm font-medium">{p.label}</div>
                <div className="text-sm text-muted">{p.desc}</div>
              </div>
              <Toggle
                on={prefs[p.key]}
                onClick={() =>
                  setPrefs((s) => ({ ...s, [p.key]: !s[p.key] }))
                }
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Tax info */}
      <Section title="Tax information">
        <div className="flex gap-3 text-sm text-muted">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-primary" />
          <p>
            You work as an independent contractor and are responsible for your own
            taxes. For some payout methods we may collect a tax form (e.g. W-8BEN /
            W-9) before your first withdrawal.
          </p>
        </div>
      </Section>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia px-6 text-sm font-medium text-white shadow-[0_8px_30px_-8px_rgba(139,92,246,0.6)] transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-300">
            <Check size={16} /> Saved
          </span>
        )}
        {error && <span className="text-sm text-red-300">{error}</span>}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-6">
      <h3 className="mb-4 font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        on ? "bg-primary" : "bg-ink/15",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
          on ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
