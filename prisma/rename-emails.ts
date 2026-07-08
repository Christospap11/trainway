/**
 * One-off rebrand migration: TrainLoop → Trainway.
 * Renames the two live auth users' emails (and their DB User rows) from
 * @trainloop.ai to @trainway.ai. Passwords, user ids, and all related data
 * are untouched — the app looks users up by id, so nothing breaks.
 *
 * Idempotent: safe to run twice (skips accounts already migrated).
 *
 *   npx tsx prisma/rename-emails.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const MAP: [string, string][] = [
  ["admin@trainloop.ai", "admin@trainway.ai"],
  ["demo@trainloop.ai", "demo@trainway.ai"],
];

async function main() {
  // Supabase paginates listUsers; one page of 1000 is plenty here.
  const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;

  for (const [oldEmail, newEmail] of MAP) {
    const authUser =
      list.users.find((u) => u.email === newEmail) ??
      list.users.find((u) => u.email === oldEmail);

    if (!authUser) {
      console.log(`• ${oldEmail}: no auth user found — skipping.`);
      continue;
    }

    // 1) Auth email (what they type to log in). email_confirm keeps it verified.
    if (authUser.email !== newEmail) {
      const { error: upErr } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        email: newEmail,
        email_confirm: true,
      });
      if (upErr) throw upErr;
      console.log(`• Auth ${oldEmail} → ${newEmail} ✓`);
    } else {
      console.log(`• Auth already ${newEmail} ✓`);
    }

    // 2) Stored profile fields (cosmetic; id is the real key). Match by id.
    const updated = await prisma.user.updateMany({
      where: { id: authUser.id },
      data: { email: newEmail },
    });
    // paypalEmail was seeded to the same address for the demo trainer.
    await prisma.user.updateMany({
      where: { id: authUser.id, paypalEmail: oldEmail },
      data: { paypalEmail: newEmail },
    });
    console.log(`  DB User row updated (${updated.count}).`);
  }

  console.log("\nDone. New logins:");
  console.log("  admin@trainway.ai / REDACTED_ADMIN_PASSWORD");
  console.log("  demo@trainway.ai  / REDACTED_DEMO_PASSWORD");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
