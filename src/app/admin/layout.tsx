import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");
  // role gate — trainers can't reach the admin console
  if (user.role !== "ADMIN") redirect("/dashboard");

  return (
    <AdminShell admin={{ name: user.name, initials: user.initials }}>
      {children}
    </AdminShell>
  );
}
