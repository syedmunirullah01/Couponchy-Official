import AdminTopbar from "@/features/admin/components/AdminTopbar";
import AdminBlogManager from "@/features/admin/components/AdminBlogManager";

export const metadata = {
  title: "Blog Posts | Couponchy Admin",
};

export default function AdminBlogPage() {
  return (
    <div>
      <AdminTopbar title="Blog Posts" breadcrumbTrail={["Admin", "Blog Posts"]} />
      <main className="p-4 sm:p-6 lg:p-8">
        <AdminBlogManager />
      </main>
    </div>
  );
}
