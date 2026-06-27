import Link from "next/link";
import { getAllCategories } from "@/server/repositories/categories-repository";
import { getAllStores } from "@/server/repositories/stores-repository";
import { buildCountryPath } from "@/lib/countries";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";

export const metadata = {
  title: "All Categories | Couponchy",
  description: "Browse discount codes, coupons, and verified promo deals organized by category.",
};

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const [categories, stores] = await Promise.all([getAllCategories(), getAllStores()]);
  const countryCode = await resolveRequestCountryCode();

  // Calculate store counts for each category slug
  const storeCounts = stores.reduce((acc, store) => {
    const slugKey = store.categorySlug || "";
    if (slugKey) {
      acc[slugKey] = (acc[slugKey] || 0) + 1;
    }
    return acc;
  }, {});

  const gridStyle = {
    backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
    backgroundSize: "24px 24px"
  };

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-12 px-5 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      
      {/* Dynamic Header Card */}
      <section className="relative overflow-hidden rounded-[32px] border border-white/5 bg-gradient-to-br from-[#0c0c0f] to-[#07070a] p-8 sm:p-12 lg:p-14 shadow-2xl">
        {/* Radial ambient glow */}
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-[var(--accent)]/5 blur-[120px] pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-[var(--accent)]/3 blur-[120px] pointer-events-none" />

        {/* Grid background overlay */}
        <div className="absolute inset-0 opacity-15 pointer-events-none" style={gridStyle} />

        <div className="relative z-10 max-w-2xl">
          <span className="rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-3.5 py-1.5 text-[9px] font-black uppercase tracking-[0.25em] text-[var(--accent)]">
            TAXONOMY BROWSER
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-[-0.05em] leading-tight text-white">
            All{" "}<span className="bg-gradient-to-r from-white via-white to-[var(--color-primary-hover)] bg-clip-text text-transparent">Categories</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/50 sm:text-base">
            Browse through our verified shopping categories. Select a category below to view all corresponding stores, active coupons, and promo codes.
          </p>
        </div>
      </section>

      {/* Categories Cards Grid */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const count = storeCounts[category.slug] || 0;
          const letterMark = category.name.slice(0, 1).toUpperCase();

          return (
            <Link 
              key={category.slug} 
              href={buildCountryPath(`/stores?category=${category.slug}`, countryCode)}
              className="group block rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-soft)_0%,var(--surface)_100%)] p-6 transition duration-300 hover:border-[var(--accent)]/45 hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
            >
              <div className="flex items-start justify-between">
                {/* Visual Letter Badge */}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-xl font-black text-[var(--accent)] transition-all duration-300 group-hover:scale-105">
                  {letterMark}
                </div>
                
                {/* Store Count Badge */}
                <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[10px] font-black text-white/40 uppercase">
                  {count} {count === 1 ? "Store" : "Stores"}
                </span>
              </div>

              <h2 className="mt-6 text-xl font-black tracking-tight text-white transition-colors duration-300 group-hover:text-[var(--accent)]">
                {category.name}
              </h2>
              <p className="mt-3.5 text-xs leading-relaxed text-white/40 line-clamp-3">
                {category.description || `Browse the best online discount vouchers, coupons, and active sales for ${category.name} merchants.`}
              </p>

              <div className="mt-6 pt-5 border-t border-white/[0.03] flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">
                  Explore deals
                </span>
                <svg className="h-4 w-4 text-[var(--accent)] transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </Link>
          );
        })}

        {!categories.length && (
          <div className="col-span-full rounded-3xl border border-dashed border-white/10 p-12 text-center bg-white/[0.01]">
            <svg className="mx-auto h-12 w-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <h3 className="mt-4 text-base font-bold text-white">No categories found</h3>
            <p className="mt-2 text-xs text-white/40 font-semibold">Please check back later or add categories from the admin dashboard.</p>
          </div>
        )}
      </section>

    </div>
  );
}
