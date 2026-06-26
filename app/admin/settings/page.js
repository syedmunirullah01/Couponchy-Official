import AdminTopbar from "@/features/admin/components/AdminTopbar";
import AdminSettingsPanel from "@/features/admin/components/AdminSettingsPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

export const metadata = {
  title: "Settings | Couponchy Admin",
};

export default function AdminSettingsPage() {
  return (
    <div>
      <AdminTopbar title="Settings" breadcrumbTrail={["Admin", "Settings"]} />
      <main className="space-y-6 p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Platform Settings</CardTitle>
            <CardDescription>
              Manage platform settings through dedicated tabs.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <p className="text-sm text-[var(--muted)]">
              Switch tabs to manage general settings, integrations, social links, SEO, and access control.
            </p>
          </CardContent>
        </Card>
        <AdminSettingsPanel />
      </main>
    </div>
  );
}
