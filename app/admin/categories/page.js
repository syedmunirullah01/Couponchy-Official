import AdminTopbar from "@/features/admin/components/AdminTopbar";
import AdminCategoriesManager from "@/features/admin/components/AdminCategoriesManager";
import { Suspense } from "react";

export const metadata = {
  title: "Categories | Couponchy Admin",
};

export default function AdminCategoriesPage() {
  return (
    <div>
      <AdminTopbar title="Categories" breadcrumbTrail={["Admin", "Categories"]} />
      <main className="p-4 sm:p-6 lg:p-8">
        <Suspense fallback={<div className="text-xs text-[var(--muted)]">Loading categories...</div>}>
          <AdminCategoriesManager />
        </Suspense>
      </main>
    </div>
  );
}
