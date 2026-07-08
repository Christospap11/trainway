-- ─────────────────────────────────────────────────────────────────
-- Row-Level Security lockdown
--
-- This app accesses the database ONLY through Prisma, connecting as the
-- table-owner role (which bypasses RLS). It never uses the Supabase
-- anon/authenticated PostgREST API for data. So we enable RLS with NO
-- public policies — that denies all access to the anon & authenticated
-- roles (the keys that ship to the browser) while Prisma keeps full access.
--
-- Idempotent: safe to re-run. Re-apply after any `prisma db push` that
-- recreates a table (the seed also re-applies this automatically).
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE "User"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Application"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserQualification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Submission"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EarningEntry"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WeeklyEarning"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payout"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Announcement"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContactMessage"   ENABLE ROW LEVEL SECURITY;

-- Belt-and-suspenders: revoke the table grants from the browser-facing
-- roles too, so the REST API has nothing to expose even if RLS were off.
REVOKE ALL ON "User", "Application", "Project", "UserQualification", "Task",
  "Submission", "EarningEntry", "WeeklyEarning", "Payout", "Notification",
  "Announcement", "ContactMessage"
  FROM anon, authenticated;
