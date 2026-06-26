const TAB_KEYS = ["all", "coupon", "deal"];

export default function OfferTabs({ offerTabs, activeTab = "all", onTabChange }) {
  return (
    <div className="flex gap-6 border-b border-[var(--border)] pb-2">
      {offerTabs.map((tab, index) => (
        <button
          key={tab}
          type="button"
          onClick={() => onTabChange?.(TAB_KEYS[index] || "all")}
          className={`border-b-2 pb-2 text-sm font-bold ${
            activeTab === (TAB_KEYS[index] || "all") ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-white/58"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

