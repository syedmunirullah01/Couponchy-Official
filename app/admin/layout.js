import AdminSidebar from "@/features/admin/components/AdminSidebar";

export default function AdminLayout({ children }) {
  return (
    <div 
      className="admin-root min-h-screen bg-[var(--page-bg)] text-[var(--text)] lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]"
      suppressHydrationWarning
    >
      <script
        dangerouslySetInnerHTML={{
          __html: `
            try {
              if (localStorage.getItem('admin-theme') === 'light') {
                document.currentScript.parentElement.classList.add('light');
              }
            } catch (_) {}
          `,
        }}
      />
      <AdminSidebar />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
