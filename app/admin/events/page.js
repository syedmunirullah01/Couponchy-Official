import AdminTopbar from "@/features/admin/components/AdminTopbar";
import AdminEventsManager from "@/features/admin/components/AdminEventsManager";

export const metadata = {
  title: "Events | Couponchy Admin",
};

export default function AdminEventsPage() {
  return (
    <div>
      <AdminTopbar title="Events" breadcrumbTrail={["Admin", "Events"]} />
      <main className="p-4 sm:p-6 lg:p-8">
        <AdminEventsManager />
      </main>
    </div>
  );
}
