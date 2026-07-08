import AdminTopbar from "@/features/admin/components/AdminTopbar";
import AdminContactsManager from "@/features/admin/components/AdminContactsManager";
import { Suspense } from "react";

export const metadata = {
  title: "Contact Messages | Couponchy Admin",
};

export default function AdminContactsPage() {
  return (
    <div>
      <AdminTopbar title="Contact Messages" breadcrumbTrail={["Admin", "Contact Messages"]} />
      <main className="p-4 sm:p-6 lg:p-8">
        <Suspense fallback={<div className="text-xs text-[var(--muted)]">Loading contact submissions...</div>}>
          <AdminContactsManager />
        </Suspense>
      </main>
    </div>
  );
}
