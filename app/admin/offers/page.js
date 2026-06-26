import AdminTopbar from "@/features/admin/components/AdminTopbar";
import AdminOffersManager from "@/features/admin/components/AdminOffersManager";

export const metadata = {
  title: "Coupons & Deals | Couponchy Admin",
};

export default function AdminOffersPage() {
  return (
    <div>
      <AdminTopbar title="Coupons & Deals" breadcrumbTrail={["Admin", "Coupons & Deals"]} />
      <main className="p-4 sm:p-6 lg:p-8">
        <AdminOffersManager />
      </main>
    </div>
  );
}
