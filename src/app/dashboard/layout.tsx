import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getDashboardChrome } from "@/lib/queries";

const STATUS_COPY: Record<string, { title: string; body: string }> = {
  PENDING: {
    title: "Your application is under review",
    body: "Thanks for applying! We'll email you as soon as it's approved.",
  },
  WAITLISTED: {
    title: "You're on the waitlist",
    body: "We'll reach out when a spot opens up.",
  },
  REJECTED: {
    title: "Application not approved",
    body: "Your application wasn't approved this time.",
  },
  SUSPENDED: {
    title: "Account suspended",
    body: "Your account has been suspended. Please contact support.",
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  // trainers must be APPROVED to use the dashboard (closes login / reset bypass)
  if (user.role === "TRAINER" && user.status !== "APPROVED") {
    const copy = STATUS_COPY[user.status] ?? {
      title: "Your account isn't active yet",
      body: "Please contact support if you think this is a mistake.",
    };
    return (
      <main className="grid min-h-screen place-items-center px-5 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
          <p className="mt-3 text-muted">{copy.body}</p>
          <form action={logout}>
            <button className="mt-8 inline-flex h-11 items-center justify-center rounded-full border border-ink/15 bg-ink/5 px-6 font-medium transition-colors hover:bg-ink/10">
              Log out
            </button>
          </form>
        </div>
      </main>
    );
  }

  const { availableBalance, unread } = await getDashboardChrome(user.id);

  return (
    <DashboardShell
      user={user}
      availableBalance={availableBalance}
      unread={unread}
      isAdmin={user.role === "ADMIN"}
    >
      {children}
    </DashboardShell>
  );
}
