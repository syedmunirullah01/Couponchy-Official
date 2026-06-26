import AdminSidebar from "@/features/admin/components/AdminSidebar";

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--text)] lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
      <AdminSidebar />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
