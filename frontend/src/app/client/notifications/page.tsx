import type { Metadata } from "next";
import NotificationsView from "@/components/shared/NotificationsView";
import { NOTIFICATIONS_CLIENT } from "@/lib/data";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return <NotificationsView initial={NOTIFICATIONS_CLIENT} destinataire="client" />;
}
