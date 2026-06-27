const TAB_KEYS = ["all", "coupon", "deal"];

export default function OfferTabs({ offerTabs, activeTab = "all", onTabChange }) {
  return (
    <div className="flex flex-nowrap items-center gap-2 overflow-x-auto select-none shrink-0">
      {offerTabs.map((tab, index) => {
        const key = TAB_KEYS[index] || "all";
        const isActive = activeTab === key;
        
        // Parse "Label (Count)" to extract only the text
        const match = tab.match(/(.*?)\s*\((\d+)\)/);
        const label = match ? match[1].trim() : tab;

        return (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange?.(key)}
            className={`group rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
              isActive
                ? "bg-gradient-to-r from-[var(--color-primary)] to-purple-600 text-black shadow-[0_4px_15px_rgba(139,92,246,0.35)]"
                : "border border-white/5 bg-white/[0.02] text-white/40 hover:bg-white/[0.06] hover:border-white/10 hover:text-white/80"
            }`}
          >
            <span className="select-none">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
