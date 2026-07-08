import AdminTopbar from "@/features/admin/components/AdminTopbar";
import AdminSubscribersManager from "@/features/admin/components/AdminSubscribersManager";

export const metadata = {
  title: "Subscribers | Couponchy Admin",
};

export default function AdminSubscribersPage() {
  return (
    <div>
      <AdminTopbar title="Subscribers" breadcrumbTrail={["Admin", "Subscribers"]} />
      <main className="p-4 sm:p-6 lg:p-8">
        <AdminSubscribersManager />
      </main>
    </div>
  );
}
