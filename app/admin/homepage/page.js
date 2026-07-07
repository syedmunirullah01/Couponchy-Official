import AdminTopbar from "@/features/admin/components/AdminTopbar";
import AdminHomepageSectionsManager from "@/features/admin/components/AdminHomepageSectionsManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

export const metadata = {
  title: "Homepage | Couponchy Admin",
};

export default function AdminHomepagePage() {
  return (
    <div className="relative min-h-screen pb-12 bg-[var(--page-bg)]">
      <AdminTopbar title="Homepage Content" breadcrumbTrail={["Admin", "Homepage"]} />
      <main className="space-y-6 p-4 sm:p-6 lg:p-8">
        <AdminHomepageSectionsManager />
      </main>
    </div>
  );
}
