import { Card, CardContent } from "@/components/ui/Card";

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.5a.75.75 0 0 0 .75-.75v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0-.75.75v3.5c0 .414.336.75.75.75Z" />
    </svg>
  );
}

function CouponIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M3.75 6h16.5a1.5 1.5 0 0 1 1.5 1.5v3.007c0 .115-.094.209-.21.209a3.75 3.75 0 0 0 0 7.5c.115 0 .21.094.21.209V16.5a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5v-3.007c0-.115.094-.209.21-.209a3.75 3.75 0 0 0 0-7.5c-.115 0-.21-.094-.21-.209V7.5A1.5 1.5 0 0 1 3.75 6Z" />
    </svg>
  );
}

function DealIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.5 1.5 0 0 0 2.122 0l4.318-4.318a1.5 1.5 0 0 0 0-2.122L11.159 3.659A1.5 1.5 0 0 0 9.568 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
  );
}

function NetworkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-.778.099-1.533.284-2.253" />
    </svg>
  );
}

export default function MetricCard({ label, value, change }) {
  const isStores = label.toLowerCase().includes("store");
  const isCoupons = label.toLowerCase().includes("coupon");
  const isDeals = label.toLowerCase().includes("deal");

  return (
    <Card className="group relative overflow-hidden rounded-[24px] border border-white/[0.04] bg-gradient-to-b from-white/[0.02] to-transparent p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)]/20 hover:bg-white/[0.04]">
      {/* Glow Effect */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[var(--color-primary)]/[0.03] blur-2xl transition-all duration-500 group-hover:bg-[var(--color-primary)]/[0.08]" />

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/35">
          {label}
        </span>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-sm group-hover:border-[var(--color-primary)]/30 group-hover:bg-[var(--color-primary)]/10 transition-all duration-300">
          {isStores && <StoreIcon />}
          {isCoupons && <CouponIcon />}
          {isDeals && <DealIcon />}
          {!isStores && !isCoupons && !isDeals && <NetworkIcon />}
        </div>
      </div>

      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-4xl font-black tracking-tight text-white">
          {value}
        </span>
      </div>

      <p className="mt-3.5 text-xs font-semibold text-white/20 group-hover:text-white/40 transition-colors">
        {change}
      </p>
    </Card>
  );
}
