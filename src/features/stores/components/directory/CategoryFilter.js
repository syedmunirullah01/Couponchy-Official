function getCategoryIcon(name) {
  const n = String(name || "").toLowerCase();
  const iconProps = { className: "h-4 w-4 stroke-current shrink-0", fill: "none", stroke: "currentColor", strokeWidth: "2" };
  
  if (n.includes("appliance") || n.includes("electron")) {
    return (
      <svg viewBox="0 0 24 24" {...iconProps}>
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    );
  }
  if (n.includes("apparel") || n.includes("cloth")) {
    return (
      <svg viewBox="0 0 24 24" {...iconProps}>
        <path d="M20.38 3.46L16 2a4 4 0 0 0-8 0L3.62 3.46a2 2 0 0 0-1.24 1.84V9a8 8 0 0 0 16 0V5.3a2 2 0 0 0-1.24-1.84z" />
      </svg>
    );
  }
  if (n.includes("home") || n.includes("garden")) {
    return (
      <svg viewBox="0 0 24 24" {...iconProps}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    );
  }
  if (n.includes("automotive") || n.includes("car")) {
    return (
      <svg viewBox="0 0 24 24" {...iconProps}>
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v4c0 .6.4 1 1 1h2" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="15" cy="17" r="2" />
      </svg>
    );
  }
  if (n.includes("fashion") || n.includes("bag") || n.includes("shoes") || n.includes("beauty")) {
    return (
      <svg viewBox="0 0 24 24" {...iconProps}>
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    );
  }
  if (n.includes("food") || n.includes("drink") || n.includes("restaurant") || n.includes("grocery")) {
    return (
      <svg viewBox="0 0 24 24" {...iconProps}>
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    );
  }
  if (n.includes("electric") || n.includes("energy") || n.includes("tech") || n.includes("digital")) {
    return (
      <svg viewBox="0 0 24 24" {...iconProps}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    );
  }
  // Fallback tag icon
  return (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" />
    </svg>
  );
}

export default function CategoryFilter({ categories, onCategorySelect }) {
  return (
    <aside className="w-full lg:w-[240px] lg:flex-shrink-0">
      <div className="rounded-[28px] border border-white/5 bg-[#09090b]/80 p-5 lg:sticky lg:top-28 backdrop-blur-xl shadow-lg space-y-5">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-1">Filter by Category</h2>
        <div className="flex flex-col gap-1.5">
          {categories.map((category) => {
            const isActive = category.active;
            return (
              <button
                key={category.name}
                type="button"
                onClick={() => onCategorySelect?.(category.name)}
                className={`flex w-full items-center justify-between gap-3 px-3.5 py-3 rounded-2xl text-left text-xs font-bold transition-all duration-200 cursor-pointer border ${
                  isActive
                    ? "bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)] font-black"
                    : "bg-transparent border-transparent text-white/60 hover:bg-white/[0.02] hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`transition-all duration-200 ${isActive ? "scale-110 text-[var(--accent)]" : "opacity-70 text-white"}`}>
                    {getCategoryIcon(category.name)}
                  </span>
                  <span className="truncate leading-none">{category.name}</span>
                </div>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
