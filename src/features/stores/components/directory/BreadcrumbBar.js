export default function BreadcrumbBar({ breadcrumbItems }) {
  return (
    <div className="border-b border-[var(--border)] bg-[var(--surface-soft)]/60 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1240px] items-center gap-2 px-4 py-4 text-sm text-white/48 sm:px-6 lg:px-8">
        {breadcrumbItems.map((item, index) => (
          <div key={item} className="flex items-center gap-2">
            <span className={index === breadcrumbItems.length - 1 ? "font-bold text-[var(--accent)]" : ""}>{item}</span>
            {index < breadcrumbItems.length - 1 ? <span className="text-white/28">›</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

