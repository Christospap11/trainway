// Prisma config. Loads .env so the URLs below resolve.
// Migrations use the DIRECT connection (port 5432); the app runtime uses the
// pooled connection via a driver adapter (see src/lib/prisma.ts).
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DIRECT_URL"],
  },
});
