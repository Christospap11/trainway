"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { submitApplication } from "@/app/apply/actions";
import {
  Check,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  PenLine,
  Code2,
  Scale,
  Stethoscope,
  Sigma,
  Sparkles,
} from "lucide-react";
import { Input, Textarea, Select, FieldLabel } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────── data ── */

const STEPS = ["Account", "Profile", "Agreements", "Assessment"] as const;

const LANGUAGES = [
  "Greek",
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Dutch",
  "Arabic",
  "Other",
];

const EXPERTISE = [
  { key: "general", label: "General / Writing", icon: PenLine },
  { key: "coding", label: "Coding", icon: Code2 },
  { key: "legal", label: "Legal", icon: Scale },
  { key: "medical", label: "Medical", icon: Stethoscope },
  { key: "math", label: "Math / Science", icon: Sigma },
  { key: "creative", label: "Creative", icon: Sparkles },
];

// Questions come from the server (answer key stays server-side); this is just
// the client-facing shape.
type AssessmentQuestion = { q: string; options: string[] };

type FormState = {
  fullName: string;
  email: string;
  password: string;
  confirm: string;
  country: string;
  languages: string[];
  expertise: string[];
  availability: string;
  referral: string;
  agreeNda: boolean;
  agreeContractor: boolean;
  answers: Record<number, number>;
  writing: string;
};

const initialState: FormState = {
  fullName: "",
  email: "",
  password: "",
  confirm: "",
  country: "",
  languages: [],
  expertise: [],
  availability: "",
  referral: "",
  agreeNda: false,
  agreeContractor: false,
  answers: {},
  writing: "",
};

/* ─────────────────────────────────────────────────────── component ── */

export function ApplicationWizard({
  assessment,
}: {
  assessment: AssessmentQuestion[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<null | "approved" | "review">(null);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const toggleArray = (key: "languages" | "expertise", value: string) =>
    setData((d) => {
      const arr = d[key];
      return {
        ...d,
        [key]: arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value],
      };
    });

  function validate(): string | null {
    if (step === 0) {
      if (!data.fullName.trim()) return "Please enter your full name.";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email))
        return "Please enter a valid email address.";
      if (data.password.length < 8)
        return "Password must be at least 8 characters.";
      if (data.password !== data.confirm) return "Passwords do not match.";
    }
    if (step === 1) {
      if (!data.country.trim()) return "Please enter your country.";
      if (data.languages.length === 0)
        return "Select at least one language you're fluent in.";
      if (data.expertise.length === 0)
        return "Select at least one area of expertise.";
      if (!data.availability) return "Please select your weekly availability.";
    }
    if (step === 2) {
      if (!data.agreeNda || !data.agreeContractor)
        return "You must accept both agreements to continue.";
    }
    if (step === 3) {
      if (Object.keys(data.answers).length < assessment.length)
        return "Please answer every question.";
      if (data.writing.trim().length < 80)
        return "Your writing sample should be at least 80 characters.";
    }
    return null;
  }

  async function next() {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    // final step → send the RAW answers; the server grades + decides approval
    const answers = assessment.map((_, i) => data.answers[i] ?? -1);

    setSubmitting(true);
    let res;
    try {
      res = await submitApplication({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        country: data.country,
        languages: data.languages,
        expertise: data.expertise,
        availability: data.availability,
        referral: data.referral || null,
        writing: data.writing,
        answers,
      });
    } catch {
      setSubmitting(false);
      setError("Something went wrong. Please try again.");
      return;
    }
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error ?? "Something went wrong. Please try again.");
      return;
    }

    // auto-approved → straight into the dashboard; otherwise → under review
    if (res.status === "APPROVED") router.push("/dashboard");
    else setResult("review");
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  if (result) return <ResultScreen result={result} firstName={data.fullName} />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Become a trainer
        </h1>
        <p className="mt-1.5 text-muted">
          Takes about 10 minutes. Free to apply.
        </p>
      </div>

      <Stepper step={step} />

      <div className="mt-8 rounded-2xl border border-ink/10 bg-ink/[0.03] p-6 backdrop-blur-xl sm:p-8">
        {step === 0 && <AccountStep data={data} set={set} />}
        {step === 1 && (
          <ProfileStep data={data} set={set} toggleArray={toggleArray} />
        )}
        {step === 2 && <AgreementsStep data={data} set={set} />}
        {step === 3 && <AssessmentStep data={data} set={set} assessment={assessment} />}

        {error && (
          <p className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={back}
            disabled={step === 0}
            className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground disabled:invisible"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <button
            onClick={next}
            disabled={submitting}
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia px-6 text-sm font-medium text-white shadow-[0_8px_30px_-6px_rgba(139,92,246,0.6)] transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {submitting
              ? "Creating your account…"
              : step === STEPS.length - 1
                ? "Submit application"
                : "Continue"}
            {!submitting && (
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────── stepper ── */

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center">
      {STEPS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm font-medium transition-colors",
                  done && "border-transparent bg-primary text-white",
                  active && "border-primary text-primary",
                  !done && !active && "border-ink/15 text-muted",
                )}
              >
                {done ? <Check size={16} /> : i + 1}
              </div>
              <span
                className={cn(
                  "hidden text-sm sm:block",
                  active ? "text-foreground" : "text-muted",
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-3 h-px flex-1 transition-colors",
                  done ? "bg-primary/60" : "bg-ink/10",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── steps ── */

type StepProps = {
  data: FormState;
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
};

function AccountStep({ data, set }: StepProps) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-medium">Create your account</h2>
      <div>
        <FieldLabel htmlFor="fullName">Full name</FieldLabel>
        <Input
          id="fullName"
          value={data.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          placeholder="Alex Rivera"
        />
      </div>
      <div>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input
          id="email"
          type="email"
          value={data.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            value={data.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder="At least 8 characters"
          />
        </div>
        <div>
          <FieldLabel htmlFor="confirm">Confirm password</FieldLabel>
          <Input
            id="confirm"
            type="password"
            value={data.confirm}
            onChange={(e) => set("confirm", e.target.value)}
            placeholder="Re-enter password"
          />
        </div>
      </div>
    </div>
  );
}

function ProfileStep({
  data,
  set,
  toggleArray,
}: StepProps & {
  toggleArray: (key: "languages" | "expertise", value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Tell us about you</h2>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="country">Country</FieldLabel>
          <Input
            id="country"
            value={data.country}
            onChange={(e) => set("country", e.target.value)}
            placeholder="Greece"
          />
        </div>
        <div>
          <FieldLabel htmlFor="availability">Weekly availability</FieldLabel>
          <Select
            id="availability"
            value={data.availability}
            onChange={(e) => set("availability", e.target.value)}
          >
            <option value="">Select…</option>
            <option value="<10">Under 10 hours</option>
            <option value="10-20">10–20 hours</option>
            <option value="20-30">20–30 hours</option>
            <option value="30+">30+ hours</option>
          </Select>
        </div>
      </div>

      <div>
        <FieldLabel>Languages you&apos;re fluent in</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => {
            const on = data.languages.includes(lang);
            return (
              <button
                key={lang}
                type="button"
                onClick={() => toggleArray("languages", lang)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                  on
                    ? "border-primary/50 bg-primary/15 text-foreground"
                    : "border-ink/10 bg-ink/5 text-muted hover:text-foreground",
                )}
              >
                {lang}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel>Areas of expertise</FieldLabel>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {EXPERTISE.map((ex) => {
            const on = data.expertise.includes(ex.key);
            return (
              <button
                key={ex.key}
                type="button"
                onClick={() => toggleArray("expertise", ex.key)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left text-sm transition-colors",
                  on
                    ? "border-primary/50 bg-primary/10 text-foreground"
                    : "border-ink/10 bg-ink/5 text-muted hover:text-foreground",
                )}
              >
                <ex.icon size={18} className={on ? "text-primary" : ""} />
                {ex.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="referral">How did you hear about us? (optional)</FieldLabel>
        <Select
          id="referral"
          value={data.referral}
          onChange={(e) => set("referral", e.target.value)}
        >
          <option value="">Select…</option>
          <option value="friend">A friend</option>
          <option value="social">Social media</option>
          <option value="search">Search engine</option>
          <option value="university">University / professor</option>
          <option value="other">Other</option>
        </Select>
      </div>
    </div>
  );
}

function AgreementsStep({ data, set }: StepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Agreements</h2>

      <AgreementBox title="Non-Disclosure Agreement (NDA)">
        You will handle confidential client data. You agree to keep all project
        data, prompts, and materials strictly confidential, never to share or
        reproduce them outside the platform, and to delete any local copies on
        request. Breach may result in removal and legal action.
      </AgreementBox>

      <label className="flex cursor-pointer items-start gap-3">
        <CheckboxControl
          checked={data.agreeNda}
          onChange={(v) => set("agreeNda", v)}
        />
        <span className="text-sm text-muted">
          I have read and agree to the{" "}
          <span className="text-foreground">Non-Disclosure Agreement</span>.
        </span>
      </label>

      <AgreementBox title="Independent Contractor Agreement">
        You provide services as an independent contractor — not an employee.
        There is no employment relationship. You are solely responsible for
        declaring your income and paying any tax or contributions due in your
        country of residence; the company withholds no tax (except where legally
        required). All work product (tasks, code, data) you create is assigned to
        and owned entirely by the company.
      </AgreementBox>

      <label className="flex cursor-pointer items-start gap-3">
        <CheckboxControl
          checked={data.agreeContractor}
          onChange={(v) => set("agreeContractor", v)}
        />
        <span className="text-sm text-muted">
          I agree to the{" "}
          <span className="text-foreground">
            Independent Contractor Agreement
          </span>{" "}
          and understand I am responsible for my own taxes.
        </span>
      </label>
    </div>
  );
}

function AssessmentStep({
  data,
  set,
  assessment,
}: StepProps & { assessment: AssessmentQuestion[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Skills assessment</h2>
        <p className="mt-1 text-sm text-muted">
          A short check of reading, reasoning, and writing. You need a high score
          to be approved.
        </p>
      </div>

      {assessment.map((q, qi) => (
        <div key={qi}>
          <p className="mb-2.5 text-sm font-medium">
            {qi + 1}. {q.q}
          </p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => {
              const selected = data.answers[qi] === oi;
              return (
                <button
                  key={oi}
                  type="button"
                  onClick={() => set("answers", { ...data.answers, [qi]: oi })}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition-colors",
                    selected
                      ? "border-primary/50 bg-primary/10 text-foreground"
                      : "border-ink/10 bg-ink/5 text-muted hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px]",
                      selected
                        ? "border-primary bg-primary text-white"
                        : "border-ink/20",
                    )}
                  >
                    {String.fromCharCode(65 + oi)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div>
        <FieldLabel htmlFor="writing">
          Writing sample — why does a clear, well-written answer matter when
          training an AI model?
        </FieldLabel>
        <Textarea
          id="writing"
          rows={4}
          value={data.writing}
          onChange={(e) => set("writing", e.target.value)}
          placeholder="Write 2–3 sentences…"
        />
        <p className="mt-1.5 text-right text-xs text-muted">
          {data.writing.trim().length} / 80 characters minimum
        </p>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────── helpers ── */

function AgreementBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-ink/10 bg-ink/[0.02] p-4">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="mt-2 max-h-32 overflow-y-auto text-sm leading-relaxed text-muted">
        {children}
      </p>
    </div>
  );
}

function CheckboxControl({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
        checked ? "border-primary bg-primary text-white" : "border-ink/25",
      )}
    >
      {checked && <Check size={14} />}
    </button>
  );
}

function ResultScreen({
  result,
  firstName,
}: {
  result: "approved" | "review";
  firstName: string;
}) {
  const name = firstName.trim().split(" ")[0] || "there";
  const approved = result === "approved";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div
        className={cn(
          "grid h-16 w-16 place-items-center rounded-2xl text-white",
          approved
            ? "bg-gradient-to-br from-brand-indigo via-brand-violet to-brand-fuchsia shadow-[0_0_40px_-6px_rgba(139,92,246,0.8)]"
            : "bg-ink/10",
        )}
      >
        {approved ? <Check size={32} /> : <ShieldCheck size={32} />}
      </div>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        {approved
          ? `Welcome aboard, ${name}! 🎉`
          : "Application received"}
      </h1>
      <p className="mt-3 max-w-md text-muted">
        {approved
          ? "You passed the assessment and your account is approved. You can log in and start qualifying for projects right away."
          : "Thanks for applying! Our team is reviewing your assessment. We'll email you within 2–3 business days with the result."}
      </p>

      {approved ? (
        <Link
          href="/login"
          className="group mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia px-7 font-medium text-white shadow-[0_8px_30px_-6px_rgba(139,92,246,0.6)] transition-all hover:-translate-y-0.5"
        >
          Log in to your dashboard
          <ArrowRight
            size={18}
            className="transition-transform group-hover:translate-x-1"
          />
        </Link>
      ) : (
        <Link
          href="/"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full border border-ink/15 bg-ink/5 px-7 font-medium transition-colors hover:bg-ink/10"
        >
          Back to home
        </Link>
      )}
    </div>
  );
}
