import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

/**
 * Creates the private `submissions` Storage bucket that coding tasks upload
 * screenshots into. Idempotent — safe to re-run.
 *
 *   npx tsx prisma/create-bucket.ts
 */
const BUCKET = "submissions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  const { data: existing } = await supabase.storage.getBucket(BUCKET);
  if (existing) {
    console.log(`✅ Bucket "${BUCKET}" already exists (public: ${existing.public})`);
    return;
  }

  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: false, // private — reads go through short-lived signed URLs only
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
  });

  if (error) {
    console.error("❌ Could not create the bucket:", error.message);
    process.exit(1);
  }
  console.log(`✅ Created private bucket "${BUCKET}" (5 MB limit, images only)`);
}

main();
