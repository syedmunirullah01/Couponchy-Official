import AdminTopbar from "@/features/admin/components/AdminTopbar";
import AdminHomepageSectionsManager from "@/features/admin/components/AdminHomepageSectionsManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

export const metadata = {
  title: "Homepage | Couponchy Admin",
};

export default function AdminHomepagePage() {
  return (
    <div>
      <AdminTopbar title="Homepage" breadcrumbTrail={["Admin", "Homepage"]} />
      <main className="space-y-6 p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Homepage Sections</CardTitle>
            <CardDescription>Manage homepage content blocks outside the hero area.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <p className="text-sm text-[var(--muted)]">
              Choose which trending stores, featured coupons, and latest stores appear on the homepage.
            </p>
          </CardContent>
        </Card>
        <AdminHomepageSectionsManager />
      </main>
    </div>
  );
}
