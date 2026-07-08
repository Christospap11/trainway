import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function WorkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  return <div className="min-h-screen bg-background">{children}</div>;
}
