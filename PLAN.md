# Master Plan — Greek AI Data Pipeline & RLHF Platform

> **What we are:** A B2B "expert-in-the-loop" AI data company. We sell high-quality
> training & evaluation data (Annotation, RLHF, Data Generation, Red Teaming, Coding)
> to companies building AI. Founded by two developers — **the custom platform is our moat.**
> **Wedge:** the Greek language + a premium global Coding division.
> **Differentiator:** vetted domain experts, not random gig-workers; in-house QA.

Source of truth for the business vision: `Information Docs/` (10 founder PDFs, in Greek).
Last updated: 2026-06-14

---

## 1. The Three Sides

1. **Clients (demand / revenue)** — buy datasets & evaluations.
   - **Tier 1 — Global AI labs:** OpenAI, Anthropic, Mistral, Cohere. Buyer titles:
     Head of Data Sourcing, RLHF Lead, Multilingual Evaluation Manager, Red Teaming Lead.
   - **Vendors / middlemen (subcontracting):** Scale AI, Toloka, Snorkel, Labelbox.
     Titles: Vendor Manager, Partner Ops, Supply Ops Lead.
   - **Tier 2 — Greek enterprise:** banks, telecoms, insurers. Sell **Brand Safety**.
     Titles: CDO, Head of Digital Transformation, Head of CX.
2. **Trainers (supply)** — vetted global independent contractors (philologists, lawyers,
   developers, domain experts, students/grads). Do the tasks, get paid.
3. **Internal team / Admin** — create projects, auto-assign, run QA, track quality &
   progress vs. deadline, approve payouts.

Money flow: Clients pay us → we route tasks to vetted trainers → trainers paid per-task or
per-hour → we keep the margin (~50–60%+).

---

## 2. The Four Task Products (each needs a distinct workspace UI)

| Product | What trainers do | UI requirements | Pay | Client €/hr · Trainer |
|---|---|---|---|---|
| **1. Annotation & RLHF** | Rate / compare / correct AI outputs (client's data) | Speed, keyboard shortcuts, split-screen, **Gold Tasks** | Per-task | ~35€ · ~15€/hr |
| **2. Data Generation** | Write ideal prompts + answers from scratch | Clean doc editor, spell-check, **anti-AI detection** | Per-task (premium) | 60–70€ · ~24€/hr |
| **3. Red Teaming** | Jailbreak / break safety of client's bot | **Live chat wired to client model API**, log breaks | Per-hour / bounty | ~80€ · ~25€/hr |
| **4. Coding (premium, global)** | Code review, debugging+CoT, refactoring, generation | **Monaco IDE**, Docker run/test sandbox, **keystroke anti-AI** | Per-task (premium) | 90–120€ · 35–50€/hr |

The workspace is a **modular renderer** — each product is a plug-in. Greek-language products
require Greek-speaking trainers; Coding is global.

---

## 3. Platform Moat Features (why custom beats generic crowdsourcing)

- **Gold Tasks** — hidden tests with known answers seeded into real batches to catch lazy/spam work.
- **Automated QA** — small LLM (API) sanity-checks submissions before human review.
- **Anti-AI / anti-cheat** — Originality.ai-style detection, keystroke-rate tracking, block mass-paste (Zero-AI policy).
- **Time-tracking with Idle Detection** — for per-hour work, never bill dead time.
- **Auto-assignment** — tasks distributed automatically across available trainers.
- **Live quality dashboards** — per-trainer accuracy; cut low performers before they spoil a dataset.
- **Progress tracking** — "6,450 / 10,000 tasks done" vs. deadline.
- **Fast UI** — drive task time down (e.g. 15→10 min) to widen margin.

---

## 4. Enterprise Project Lifecycle ("Land & Expand")

1. **Pilot / Calibration** (100–500 tasks) — client tests our UI, guidelines adherence, QA.
2. **Main Batch** (10k–50k tasks) — bulk work for a model release (e.g. "Greek update").
3. **Continuous Pipeline** (monthly retainer) — fresh tasks to fight model drift.

Capacity reality: a 10k-task / 1-month project needs a fleet of ~20–25 active part-time trainers
→ the platform must act as the "manager" (assignment, QA, progress).

---

## 5. Workforce, Legal & Payments

- **Independent contractors** — click-wrap **Contractor Agreement** (non-employment + tax
  indemnification clauses) + **NDA**, signed digitally at signup. **IP transfer** to the company in ToS.
- **Vetting** — automated skills/grammar (or coding) test, >90% to pass. Domain-matched.
- **Payouts roadmap:** Phase 1 **PayPal** (email only, covers 99%) → Phase 2 **Wise** (low FX fees)
  → Phase 3 **Stripe Connect** (KYC, W-8BEN/W-9, full compliance). Receiving/FX fees borne by trainer.
- **Global-ready tech:** store timestamps in **UTC**, render in local timezone; host on edge CDN (Vercel).
- **GDPR/DPA** with clients; data security & encryption for client prompts.

---

## 6. Go-To-Market (100% outbound B2B)

- **Trojan Horse:** publish a premium Greek (and a coding/debugging-CoT) dataset free on
  **Hugging Face** → researchers see quality → inbound.
- **LinkedIn outbound:** 20 msgs/day, problem-led (hallucinations / brand safety), free **PoC** (50 tasks).
- **Just-in-Time Incorporation:** build platform → proof dataset with friends → land client →
  *then* form the Greek ΙΚΕ (3–5 days). **Building the platform is step one.**

> **Scope note:** This GTM (LinkedIn outreach, client pitches, B2B sales) is the *company's*
> business activity — NOT what the web platform we are building does. **The platform we build
> is the freelancer-facing product** (recruitment site + trainer dashboard + task workspace).
> A separate client-facing marketing site can come much later if ever; ignore for now.

---

## 7. Financials (bootstrapped)

- Startup (ΙΚΕ + legal/NDAs/GDPR + branding): ~2,500–3,000€ (legal is the big one).
- Monthly OpEx: ~440–950€ (accountant, ΕΦΚΑ, servers/APIs, tools). Break-even ≈ 600€ gross/mo.
- Example margins: 10k-task annotation project → 87.5k€ revenue / 50k€ gross profit;
  500 coding tasks → ~25k€ revenue / ~13.5k€ gross profit.

---

## 8. Build Status & Roadmap

**We are building the FREELANCER-FACING platform** (recruitment site + trainer dashboard +
task workspace). What's built so far is correct and stays.

**Done so far (this build):**
- ✅ Next.js 16 + TS + Tailwind v4 foundation, dark "Cinematic" design system
  (aurora + neural-net background), recolorable brand tokens.
- ✅ Marketing/recruitment site (trainer-facing) — correct as built.
- ✅ Demo auth (cookie session, `proxy.ts` guard) + trainer dashboard
  (Overview, Projects, Earnings, Profile) on mock data. Login: demo@trainway.ai / REDACTED_DEMO_PASSWORD.

**Next big pieces (all freelancer-facing):**
- ⬜ Align trainer dashboard task types to the four real products (Annotation/RLHF,
  Data Generation, Red Teaming, Coding).
- ⬜ **Task workspace** (the moat) — modular, start with Annotation/RLHF (+ Gold Tasks).
- ⬜ Onboarding + vetting test + NDA/Contractor click-wrap.
- ⬜ **Admin panel** — projects, batch upload, auto-assign, QA review, quality dashboards,
  progress tracking, payout approval.
- ⬜ Data Generation editor (+ anti-AI), Red Teaming chat, Coding IDE (Monaco + sandbox).
- ⬜ Payments (PayPal first). Real auth + Postgres/Prisma when we leave demo mode.
- ⬜ Client portal (later) — project funding, live progress & quality, data export.

---

## 9. Design Direction

**Cinematic Dark** (chosen 2026-06-14): deep canvas, drifting aurora + live neural-network
background, luminous type, hairline dividers (no boxes) on the public site, scroll-reveal motion,
brand spectrum indigo→violet→fuchsia→cyan (recolor via `--brand-*`). Dashboard uses calm panels.

## 10. Open Decisions

- [x] Tech stack — Next.js + TS + Tailwind v4
- [x] Public-site aesthetic — Cinematic Dark
- [x] Final brand name: "Trainway" — [ ] logo
- [ ] Which task workspace to build first (recommend: Annotation/RLHF)
- [ ] Greek-language vs. Coding division priority for the first dataset/PoC
