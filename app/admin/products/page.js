import AdminTopbar from "@/features/admin/components/AdminTopbar";
import AdminProductsManager from "@/features/admin/components/AdminProductsManager";

export const metadata = {
  title: "Products | Couponchy Admin",
};

export default function AdminProductsPage() {
  return (
    <div>
      <AdminTopbar title="Products" breadcrumbTrail={["Admin", "Products"]} />
      <main className="p-4 sm:p-6 lg:p-8">
        <AdminProductsManager />
      </main>
    </div>
  );
}
