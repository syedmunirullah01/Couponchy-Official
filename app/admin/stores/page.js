import AdminTopbar from "@/features/admin/components/AdminTopbar";
import AdminStoresManager from "@/features/admin/components/AdminStoresManager";
import { Suspense } from "react";

export const metadata = {
  title: "Stores | Couponchy Admin",
};

export default function AdminStoresPage() {
  return (
    <div>
      <AdminTopbar title="Stores" breadcrumbTrail={["Admin", "Stores"]} />
      <main className="p-4 sm:p-6 lg:p-8">
        <Suspense fallback={<div className="text-xs text-[var(--muted)]">Loading stores...</div>}>
          <AdminStoresManager />
        </Suspense>
      </main>
    </div>
  );
}
