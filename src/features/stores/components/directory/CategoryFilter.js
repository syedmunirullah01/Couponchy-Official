export default function CategoryFilter({ categories }) {
  return (
    <aside className="w-full lg:w-[226px] lg:flex-shrink-0">
      <div className="rounded-[22px] border border-[var(--border)] bg-[linear-gradient(180deg,#11190b_0%,#0f170a_100%)] p-6 lg:sticky lg:top-24">
        <h2 className="text-[18px] font-black uppercase tracking-tight text-white">Categories</h2>
        <div className="mt-6 space-y-4">
          {categories.map((category) => (
            <label key={category.name} className="flex cursor-pointer items-center gap-3">
              <span
                className={`grid h-5 w-5 place-items-center rounded-full border ${
                  category.active
                    ? "border-[var(--accent)] bg-[var(--accent)] text-black"
                    : "border-[#29371e] bg-black text-transparent"
                }`}
              >
                {category.active ? "✓" : "."}
              </span>
              <span className={category.active ? "font-bold text-white" : "text-white/62"}>{category.name}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}

