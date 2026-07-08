import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  firstName: string;
  initials: string;
  tier: string;
  status: string;
  role: string;
};

/** Returns the signed-in trainer's profile, or null. */
export async function getSession(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await prisma.user.findUnique({ where: { id: user.id } });
  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    firstName: profile.name.split(" ")[0] || profile.name,
    initials:
      profile.initials ?? profile.name.slice(0, 2).toUpperCase(),
    tier: profile.tier ?? "Trainer",
    status: profile.status,
    role: profile.role,
  };
}
