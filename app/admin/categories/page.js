import AdminTopbar from "@/features/admin/components/AdminTopbar";
import AdminCategoriesManager from "@/features/admin/components/AdminCategoriesManager";

export const metadata = {
  title: "Categories | Couponchy Admin",
};

export default function AdminCategoriesPage() {
  return (
    <div>
      <AdminTopbar title="Categories" breadcrumbTrail={["Admin", "Categories"]} />
      <main className="p-4 sm:p-6 lg:p-8">
        <AdminCategoriesManager />
      </main>
    </div>
  );
}
