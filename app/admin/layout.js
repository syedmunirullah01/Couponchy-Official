import AdminSidebar from "@/features/admin/components/AdminSidebar";
import ScrollToTopButton from "@/components/layout/ScrollToTopButton";

export default function AdminLayout({ children }) {
  return (
    <div 
      className="admin-root min-h-screen bg-[var(--page-bg)] text-[var(--text)] lg:pl-72"
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
      <ScrollToTopButton />
    </div>
  );
}
