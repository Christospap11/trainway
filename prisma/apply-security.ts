import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Applies prisma/security.sql (RLS lockdown) through the privileged Prisma
// connection. Run with: npx tsx prisma/apply-security.ts
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

export async function applySecurity(client: PrismaClient = prisma) {
  const sql = readFileSync(join(import.meta.dirname, "security.sql"), "utf8");
  const statements = sql
    .split(";")
    .map((s) => s.replace(/--.*$/gm, "").trim())
    .filter((s) => s.length > 0);
  for (const stmt of statements) {
    await client.$executeRawUnsafe(stmt);
  }
}

// Allow running standalone
if (import.meta.filename === process.argv[1]) {
  applySecurity()
    .then(() => console.log(`✅ RLS lockdown applied`))
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
}
