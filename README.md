# Trainway

Trainway is a web platform for running AI-training data work with vetted freelance
experts. Admins create projects and upload task batches. Trainers qualify for those
projects, rate and compare model responses or write and review code in a task
workspace, and get paid per task. Gold tasks and a QA pass catch low-quality work
before it is exported as a labelled dataset.

**Who it's for:** small AI-data teams that want their own expert-in-the-loop pipeline
(recruiting, vetting, task work, QA, payouts) instead of a generic crowdsourcing tool.
The first focus is Greek-language evaluation and a coding division.

**Status:** in active development, set up for deployment on Vercel ([DEPLOY.md](DEPLOY.md)). See [ROADMAP.md](ROADMAP.md)
for what's next.

## Features

- **Public site**: a recruitment site for trainers (home, about, blog, contact, terms,
  privacy, contractor agreement) and an application flow.
- **Trainer dashboard**: projects, earnings, payouts, notifications, profile and settings.
- **Qualification quizzes** per project. The answer key never leaves the server.
- **Task workspace** with one view per task type:
  - Response rating (5 dimensions plus required written feedback)
  - Side-by-side comparison (A/B on a 5-point scale)
  - Response writing and fact-checking
  - Coding: generation, refactoring, debugging and review, each with its own rubric
    and screenshot proof
  - Agentic task authoring (off-platform work submitted through a structured form)
- **Admin panel**: create projects, bulk-upload tasks (CSV or JSON), review
  submissions, manage trainers, approve payouts, and export completed work as CSV.
- **Quality control**: hidden gold tasks, an automated QA pass, and manual review.
  Both QA paths share the same clearing logic.
- **Security**: Supabase Auth, Postgres row-level security lockdown, a private storage
  bucket with signed URLs, and rate limiting on auth endpoints.

## Built with

- [Next.js 16](https://nextjs.org) (App Router, Server Actions), React 19, TypeScript
- Tailwind CSS v4
- [Prisma 7](https://www.prisma.io) with the `pg` driver adapter
- [Supabase](https://supabase.com) for Postgres, Auth and Storage
- Zod for validation
- Deployed on [Vercel](https://vercel.com)

## Getting started

### Requirements

- Node.js 20 or newer
- A free Supabase project

### 1. Install

```bash
git clone https://github.com/Christospap11/trainway.git
cd trainway
npm install        # also runs `prisma generate`
```

### 2. Configure

```bash
cp .env.example .env
```

Fill in `.env` from your Supabase dashboard. `.env.example` explains each value:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Pooled connection (port 6543, add `?pgbouncer=true`) used by the app |
| `DIRECT_URL` | Direct connection (port 5432) used by Prisma for schema changes |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin access (never expose it to the browser) |
| `SEED_DEMO_PASSWORD` / `SEED_ADMIN_PASSWORD` | Passwords for the seeded demo accounts. Choose your own |

### 3. Set up the database

```bash
npx prisma db push                  # create the tables from prisma/schema.prisma
npx prisma db seed                  # demo users, projects and tasks (also applies RLS)
npx tsx prisma/create-bucket.ts     # private storage bucket for coding screenshots
```

### 4. Run

```bash
npm run dev
```

Open <http://localhost:3000>. Sign in as `demo@trainway.ai` (trainer) or
`admin@trainway.ai` (admin) with the passwords you set in `.env`.

### Other scripts

```bash
npm run build      # production build
npm run start      # serve the production build
npm run lint       # ESLint
```

Deployment steps for Vercel are in [DEPLOY.md](DEPLOY.md). The longer product and
business plan is in [PLAN.md](PLAN.md).

## Project structure

```
src/
  app/
    (site)/        public marketing and legal pages
    apply/         trainer application
    dashboard/     trainer dashboard
    work/          task workspace
    admin/         admin panel (projects, submissions, trainers, payouts, export)
    api/           upload endpoint
  components/      UI, grouped by area (site, dashboard, work, admin, ...)
  lib/             data queries, QA, qualification, rubrics, validation, storage
prisma/
  schema.prisma    data model
  seed.ts          demo data
  security.sql     row-level security lockdown
*.csv              sample task batches (written by the author) for bulk upload
```

## License

[MIT](LICENSE) © 2026 Christos Papadopoulos
