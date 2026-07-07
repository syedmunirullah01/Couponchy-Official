import AdminTopbar from "@/features/admin/components/AdminTopbar";
import AdminCompanyManager from "@/features/admin/components/AdminCompanyManager";

export const metadata = {
  title: "Company | Couponchy Admin",
};

export default function AdminCompanyPage() {
  return (
    <div>
      <AdminTopbar title="Company" breadcrumbTrail={["Admin", "Company"]} />
      <main className="space-y-6 p-4 sm:p-6 lg:p-8">
        <AdminCompanyManager />
      </main>
    </div>
  );
}
