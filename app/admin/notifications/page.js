import AdminTopbar from "@/features/admin/components/AdminTopbar";
import AdminNotificationsManager from "@/features/admin/components/AdminNotificationsManager";

export const metadata = {
  title: "Notifications | Couponchy Admin",
};

export default function AdminNotificationsPage() {
  return (
    <div>
      <AdminTopbar title="Notifications" breadcrumbTrail={["Admin", "Notifications"]} />
      <main className="p-4 sm:p-6 lg:p-8">
        <AdminNotificationsManager />
      </main>
    </div>
  );
}
