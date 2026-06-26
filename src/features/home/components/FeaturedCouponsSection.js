import Link from "next/link";
import { cn } from "@/lib/utils";
import SectionHeader from "@/components/shared/SectionHeader";
import FeaturedCouponCard from "./FeaturedCouponCard";

export default function FeaturedCouponsSection({ featuredCoupons, title = "Featured Coupons" }) {
  if (!featuredCoupons.length) {
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
              <h3 className="text-xl font-bold text-white tracking-tight">No Active Coupons Yet</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/40 font-medium">
                We're currently scanning and verifying exclusive coupon codes. Create a deal in the admin dashboard to populate this slot.
              </p>
            </div>
            
            <Link 
              href="/admin/homepage" 
              className="relative mt-8 flex items-center justify-center gap-2.5 w-full h-12 rounded-xl bg-white/5 border border-white/10 text-white/70 text-xs font-bold transition-all duration-300 hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] hover:text-black hover:shadow-[0_0_15px_rgba(139,92,246,0.2)] active:scale-[0.98]"
            >
              <span>Manage Coupons</span>
              <span>→</span>
            </Link>
          </div>

          {/* Ghost Skeleton Card 1 */}
          <div className="relative overflow-hidden rounded-[28px] border border-white/[0.02] bg-[#09090c]/30 p-8 flex flex-col justify-between min-h-[320px] select-none opacity-60">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent" />
            <div>
              <div className="flex justify-between items-center">
                <span className="w-16 h-5 rounded bg-white/5 animate-pulse" />
                <span className="w-3 h-3 rounded-full bg-white/5 animate-pulse" />
              </div>
              <div className="mt-8 flex flex-col gap-2">
                <span className="w-8 h-3 rounded bg-white/5 animate-pulse" />
                <span className="w-2/3 h-10 rounded-lg bg-white/[0.03] animate-pulse" />
              </div>
            </div>
            {/* Cut-out ticket separator */}
            <div className="relative my-4 flex items-center">
              <div className="absolute -left-11 h-6 w-6 rounded-full border-r border-white/[0.02] bg-[#020202]" />
              <div className="w-full border-t border-dashed border-white/5" />
              <div className="absolute -right-11 h-6 w-6 rounded-full border-l border-white/[0.02] bg-[#020202]" />
            </div>
            <div>
              <span className="block w-full h-8 rounded-lg bg-white/[0.02] animate-pulse mb-4" />
              <span className="block w-full h-12 rounded-xl bg-white/[0.03] animate-pulse" />
            </div>
          </div>

          {/* Ghost Skeleton Card 2 */}
          <div className="relative overflow-hidden rounded-[28px] border border-white/[0.02] bg-[#09090c]/30 p-8 flex flex-col justify-between min-h-[320px] select-none opacity-30 hidden lg:flex">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent" />
            <div>
              <div className="flex justify-between items-center">
                <span className="w-16 h-5 rounded bg-white/5 animate-pulse" />
                <span className="w-3 h-3 rounded-full bg-white/5 animate-pulse" />
              </div>
              <div className="mt-8 flex flex-col gap-2">
                <span className="w-8 h-3 rounded bg-white/5 animate-pulse" />
                <span className="w-2/3 h-10 rounded-lg bg-white/[0.03] animate-pulse" />
              </div>
            </div>
            {/* Cut-out ticket separator */}
            <div className="relative my-4 flex items-center">
              <div className="absolute -left-11 h-6 w-6 rounded-full border-r border-white/[0.02] bg-[#020202]" />
              <div className="w-full border-t border-dashed border-white/5" />
              <div className="absolute -right-11 h-6 w-6 rounded-full border-l border-white/[0.02] bg-[#020202]" />
            </div>
            <div>
              <span className="block w-full h-8 rounded-lg bg-white/[0.02] animate-pulse mb-4" />
              <span className="block w-full h-12 rounded-xl bg-white/[0.03] animate-pulse" />
            </div>
          </div>

        </div>
      </section>
    );
  }

  const couponGridClassName =
    featuredCoupons.length === 1
      ? "max-w-[360px]"
      : featuredCoupons.length === 2
        ? "sm:grid-cols-2"
        : featuredCoupons.length === 3
          ? "sm:grid-cols-2 xl:grid-cols-3"
          : "sm:grid-cols-2 xl:grid-cols-4";

  return (
    <section className="relative">
      <SectionHeader title={title} href="#" />
      <div className={cn("grid gap-6 items-start", couponGridClassName)}>
        {featuredCoupons.map((coupon, index) => (
          <FeaturedCouponCard key={coupon.brand} coupon={coupon} index={index} />
        ))}
      </div>
    </section>
  );
}
