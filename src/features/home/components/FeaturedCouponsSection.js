"use client";
import Link from "next/link";
import SectionHeader from "@/components/shared/SectionHeader";
import FeaturedCouponCard from "./FeaturedCouponCard";

export default function FeaturedCouponsSection({ featuredCoupons, title = "Featured Coupons", t: propT }) {
  // Fallback default translations
  const t = propT || {
    verified: "Verified",
    active: "ACTIVE",
    expiresIn: "Expires in:",
    days: "DAYS",
    hrs: "HRS",
    min: "MIN",
    sec: "SEC",
    redirecting: "Redirecting...",
    copied: "Copied!",
    getDealNow: "Get Deal Now",
    copyCode: "Copy Code",
    deal: "DEAL",
    code: "CODE",
    noActiveCoupons: "No Active Coupons Yet",
    scannedDesc: "We're currently scanning and verifying exclusive coupon codes. Create a deal in the admin dashboard to populate this slot.",
    manageCoupons: "Manage Coupons",
  };

  // Filter: Only show 1 main coupon per store (deduplicated by storeSlug or brand)
  const seenStores = new Set();
  const deduplicatedCoupons = featuredCoupons.filter((coupon) => {
    const slug = coupon.storeSlug || coupon.brand;
    if (seenStores.has(slug)) {
      return false;
    }
    seenStores.add(slug);
    return true;
  });

  // Only take the top 3 coupons
  const topThreeCoupons = deduplicatedCoupons.slice(0, 3);

  if (topThreeCoupons.length === 0) {
    return (
      <section className="relative mt-24">
        {/* Glow backdrop behind section */}
        <div className="pointer-events-none absolute -top-12 left-1/4 h-32 w-1/2 rounded-full bg-[var(--color-primary)]/5 blur-[100px]" />
        
        <SectionHeader title={title} href="#" />
        
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* Main Empty Callout Card */}
          <div className="relative overflow-hidden rounded-[28px] border border-white/5 bg-[#09090c]/80 p-8 flex flex-col justify-between min-h-[320px] backdrop-blur-xl shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 via-transparent to-transparent" />
            
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 text-[var(--color-primary)] shadow-[0_0_15px_rgba(139,92,246,0.1)] mb-6">
                <svg className="h-6 w-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">{t.noActiveCoupons}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/40 font-medium">
                {t.scannedDesc}
              </p>
            </div>
            
            <Link 
              href="/admin/homepage" 
              className="relative mt-8 flex items-center justify-center gap-2.5 w-full h-12 rounded-xl bg-white/5 border border-white/10 text-white/70 text-xs font-bold transition-all duration-300 hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] hover:text-black hover:shadow-[0_0_15px_rgba(139,92,246,0.2)] active:scale-[0.98]"
            >
              <span>{t.manageCoupons}</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full">
      <SectionHeader title={title} href="/stores" />

      {/* Responsive Grid for exactly 3 Coupons */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {topThreeCoupons.map((coupon, index) => (
          <FeaturedCouponCard
            key={`${coupon.storeSlug || coupon.brand}-${index}`}
            coupon={coupon}
            index={index}
            t={t}
          />
        ))}
      </div>
    </section>
  );
}
