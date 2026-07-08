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
      <section className="relative overflow-hidden rounded-[32px] border border-[var(--color-primary)]/20 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.12),transparent_35%)] bg-[#0c0a0f] p-6 sm:p-10 lg:p-12 shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        {/* Glow orb */}
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[var(--color-primary)]/10 blur-[80px] pointer-events-none" />

        {/* Right side floating glass illustration (Experience level design) */}
        <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2 w-[280px] h-[180px] pointer-events-none select-none">
          <div className="relative w-full h-full">
            {/* Layer 1: Glowing orb behind */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-primary-hover)] rounded-2xl opacity-15 blur-xl" />
            
            {/* Layer 2: Floating Coupon card */}
            <div className="absolute right-4 top-2 w-[200px] h-[110px] rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-4 rotate-6 shadow-[0_20px_40px_rgba(139,92,246,0.25)]">
              <div className="flex items-center gap-1.5">
                <span className="flex h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                <span className="text-[7.5px] font-black uppercase tracking-wider text-[var(--color-primary)]">Verified Categories</span>
              </div>
              <div className="mt-2.5 text-lg font-black text-white tracking-wider">BROWSE</div>
              <div className="mt-0.5 text-[8.5px] font-semibold text-white/40">Verified shopping niches</div>
              <div className="mt-3 pt-1.5 border-t border-white/5 flex items-center justify-between">
                <span className="text-[7.5px] font-bold text-white/30">UPDATED: 24H</span>
                <span className="text-[7.5px] font-bold text-[var(--color-primary)]">COUPONCHY</span>
              </div>
            </div>

            {/* Layer 3: Second overlapping floating card */}
            <div className="absolute left-2 bottom-1 w-[180px] h-[95px] rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-3.5 -rotate-6 shadow-[0_20px_40px_rgba(139,92,246,0.25)]">
              <div className="text-[7.5px] font-black uppercase tracking-wider text-[var(--color-primary)]">Market Niches</div>
              <div className="mt-1 text-[13px] font-black text-white tracking-tight">ACTIVE BRANDS</div>
              <div className="mt-2.5 pt-1.5 border-t border-white/5 flex items-center justify-between">
                <span className="text-[7.5px] font-semibold text-white/30">Full Taxonomy</span>
                <div className="flex -space-x-1.5">
                  <div className="h-4 w-4 rounded-full bg-[var(--color-primary)] border border-black/30 text-[6.5px] flex items-center justify-center font-black text-white">CAT</div>
                  <div className="h-4 w-4 rounded-full bg-[var(--color-primary-hover)] border border-black/30 text-[6.5px] flex items-center justify-center font-black text-white">🏷️</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-2xl lg:max-w-[640px]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] shadow-[0_0_15px_rgba(139,92,246,0.1)]">
            Taxonomy Browser
          </span>
          <h1 className="mt-4 text-[28px] sm:text-4xl lg:text-[54px] font-black tracking-[-0.04em] leading-[1.12] text-white">
            Find{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] drop-shadow-[0_0_15px_rgba(139,92,246,0.2)]">
             Deals by Category
            </span>
          </h1>
          <p className="mt-4 text-xs sm:text-base leading-6 sm:leading-7 text-[var(--muted)]/90">
            Browse hundreds of brands and discover the best coupons, promo codes, and deals across every shopping category.
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
