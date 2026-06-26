import AdminTopbar from "@/features/admin/components/AdminTopbar";
import AdminHeroManager from "@/features/admin/components/AdminHeroManager";

export const metadata = {
  title: "Hero | Couponchy Admin",
};

export default function AdminHeroPage() {
  return (
    <div>
      <AdminTopbar title="Hero" breadcrumbTrail={["Admin", "Hero"]} />
      <main className="space-y-6 p-4 sm:p-6 lg:p-8">
        <AdminHeroManager />
      </main>
    </div>
  );
}
