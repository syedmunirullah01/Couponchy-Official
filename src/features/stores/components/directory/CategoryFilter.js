export default function CategoryFilter({ categories, onCategorySelect }) {
  return (
    <aside className="w-full lg:w-[226px] lg:flex-shrink-0">
      <div className="rounded-[22px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-soft)_0%,var(--surface)_100%)] p-6 lg:sticky lg:top-24">
        <h2 className="text-[18px] font-black uppercase tracking-tight text-white">Categories</h2>
        <div className="mt-6 space-y-4">
          {categories.map((category) => (
            <label 
              key={category.name} 
              className="flex cursor-pointer items-center gap-3 select-none group"
              onClick={() => onCategorySelect?.(category.name)}
            >
              <span
                className={`grid h-5 w-5 place-items-center rounded-full border transition-all duration-200 ${
                  category.active
                    ? "border-[var(--accent)] bg-[var(--accent)] text-black"
                    : "border-[var(--border)] bg-black text-transparent group-hover:border-[var(--accent)]/50"
                }`}
              >
                {category.active ? "✓" : "."}
              </span>
              <span className={category.active ? "font-bold text-white transition-colors" : "text-white/62 group-hover:text-white transition-colors"}>
                {category.name}
              </span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
