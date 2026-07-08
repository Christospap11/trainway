import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/dashboard/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getSession();
  if (!user) return null;

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { payoutMethod: true, iban: true, paypalEmail: true, notifyPrefs: true },
  });

  const prefs = (profile?.notifyPrefs as Record<string, boolean> | null) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="mt-1 text-muted">
          Manage your account, payments, and preferences.
        </p>
      </div>
      <SettingsForm
        user={{
          name: user.name,
          email: user.email,
          method: profile?.payoutMethod === "WISE" ? "wise" : "paypal",
          iban: profile?.iban ?? "",
          paypalEmail: profile?.paypalEmail ?? user.email,
          prefs: {
            tasks: prefs?.tasks ?? true,
            payments: prefs?.payments ?? true,
            announcements: prefs?.announcements ?? false,
          },
        }}
      />
    </div>
  );
}
