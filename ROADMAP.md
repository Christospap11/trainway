# Roadmap

What's built and what's next for Trainway. The longer product reasoning is in
[PLAN.md](PLAN.md).

## Done

- [x] Next.js 16 + TypeScript + Tailwind v4 foundation, dark/light design system
- [x] Public recruitment site, legal pages and trainer application flow
- [x] Supabase Auth (login, email confirm, password reset) and Prisma/Postgres data layer
- [x] Trainer dashboard: projects, earnings, payouts, notifications, profile, settings
- [x] Per-project qualification quizzes, graded on the server
- [x] Task workspace: response rating, side-by-side, writing, fact-check
- [x] Coding workspaces: generation, refactoring, debugging, review, with per-category rubrics and screenshot proof
- [x] Agentic task authoring (off-platform, structured submission)
- [x] Admin panel: projects, bulk CSV/JSON task upload, submissions review, trainers, payouts
- [x] Gold tasks plus automated and manual QA sharing one clearing path
- [x] CSV export of completed work (UTF-8 BOM for Greek text in Excel)
- [x] Row-level security lockdown, private storage bucket, auth rate limiting

## Next

### Quality and reliability
- [ ] Automated test suite: unit tests for `qa`, `qualification`, `parse-tasks` and `validation`, and Playwright end-to-end tests for login → qualify → submit → QA → export
- [ ] CI on GitHub Actions (lint, type-check, build, tests)
- [ ] Shared rate-limit store (Upstash Redis) so limits hold on serverless
- [ ] Proper Prisma migrations instead of `db push`
- [ ] Retire the legacy `CODING` task type in favour of the four `CODE_*` types

### Task workspace
- [ ] Keyboard shortcuts and faster navigation for rating tasks
- [ ] Monaco code editor in the coding workspace
- [ ] Sandboxed run/test for code submissions
- [ ] Data-generation editor with spell-check and AI-text detection
- [ ] Red-teaming workspace: live chat against a model API, with logged breaks
- [ ] Anti-cheat: paste blocking and keystroke-rate signals

### Operations
- [ ] Automatic task assignment across available trainers
- [ ] Time tracking with idle detection for hourly projects
- [ ] Live per-trainer quality dashboards and progress-vs-deadline tracking
- [ ] Onboarding with a click-wrap contractor agreement and NDA

### Payments
- [ ] PayPal payouts
- [ ] Wise payouts
- [ ] Stripe Connect with KYC and tax forms

### Later
- [ ] Client portal: fund projects, watch progress and quality, download datasets
- [ ] Full Greek translation of the trainer-facing UI
- [ ] Logo and brand assets
