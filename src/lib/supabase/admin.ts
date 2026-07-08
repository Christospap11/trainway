import { createClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client (service role). SERVER-ONLY — never import into a
 * Client Component. Bypasses Row-Level Security; used for creating accounts.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
