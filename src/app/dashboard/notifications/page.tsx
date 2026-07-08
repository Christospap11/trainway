import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { getNotifications } from "@/lib/queries";
import { NotificationsList } from "@/components/dashboard/notifications-list";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await getSession();
  if (!user) return null;
  const items = await getNotifications(user.id);
  return <NotificationsList initial={items} />;
}
