import Link from "next/link";
import SectionHeader from "@/components/shared/SectionHeader";

export default function CategoriesSection({ categories, title = "Browse Categories" }) {
  if (!categories || !categories.length) {
    return (
      <section className="relative mt-16">
        <SectionHeader title={title} href="/stores" />
        <div className="rounded-[28px] border border-white/5 bg-[#09090c] p-8 text-center backdrop-blur-xl">
          <p className="text-lg font-semibold text-white/90">No categories available</p>
          <p className="mt-2 text-sm text-white/40">Categories will show up here once configured.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative mt-16">
      {/* Laser light backdrop effect */}
      <div className="pointer-events-none absolute -bottom-16 right-1/4 h-32 w-1/2 rounded-full bg-[var(--color-primary)]/5 blur-[120px]" />

      <SectionHeader title={title} href="/stores" />
      
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {categories.slice(0, 10).map((category) => (
          <Link
            key={category.name}
            href={category.href ?? "#"}
            className="group relative flex items-center gap-5 overflow-hidden rounded-[24px] border border-white/5 bg-[#09090c]/80 px-6 py-5 transition-all duration-500 hover:-translate-y-1 hover:border-[var(--color-primary)]/20 hover:bg-[#111118]/80 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5),0_0_20px_rgba(139,92,246,0.03)]"
          >
            {/* Shimmer Light Sweep Hover Effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />

            {/* Background Glow */}
            <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[var(--color-primary)]/5 blur-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            {/* Lettermark Circle */}
            <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/5 bg-white/[0.03] text-lg font-black transition-transform duration-500 group-hover:scale-105 group-hover:border-[var(--color-primary)]/20">
              <span className="bg-gradient-to-br from-white to-white/45 bg-clip-text text-transparent">
                {category.code}
              </span>
            </div>

            {/* Category Labels */}
            <div className="relative min-w-0 flex-1 text-left">
              <p className="truncate text-base font-bold text-white transition-colors duration-300 group-hover:text-[var(--color-primary)]">
                {category.name}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--color-primary)]/70"></span>
                </span>
                <p className="truncate text-[10px] font-extrabold uppercase tracking-wider text-white/30 group-hover:text-white/40 transition-colors">
                  {category.storesCount} {category.storesCount === 1 ? "Brand" : "Brands"}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {categories.length > 10 && (
        <div className="mt-10 flex justify-center">
          <Link
            href="/stores"
            className="group/btn relative overflow-hidden inline-flex items-center justify-center gap-2.5 rounded-2xl border border-white/5 bg-white/[0.03] px-8 py-4 text-xs font-black uppercase tracking-[0.2em] text-white/80 transition-all duration-300 hover:scale-[1.02] hover:border-[var(--color-primary)]/20 hover:bg-white/[0.05] hover:text-white hover:shadow-[0_0_25px_rgba(139,92,246,0.15)] active:scale-[0.98]"
          >
            {/* Shimmer Light Sweep Hover Effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-1000 group-hover/btn:translate-x-full" />
            
            <span className="relative z-10">Explore All Categories</span>
            <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      )}
    </section>
  );
}
