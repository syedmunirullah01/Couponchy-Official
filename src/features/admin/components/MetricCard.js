import { Card, CardContent } from "@/components/ui/Card";

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.5a.75.75 0 0 0 .75-.75v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0-.75.75v3.5c0 .414.336.75.75.75Z" />
    </svg>
  );
}

function CouponIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M3.75 6h16.5a1.5 1.5 0 0 1 1.5 1.5v3.007c0 .115-.094.209-.21.209a3.75 3.75 0 0 0 0 7.5c.115 0 .21.094.21.209V16.5a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5v-3.007c0-.115.094-.209.21-.209a3.75 3.75 0 0 0 0-7.5c-.115 0-.21-.094-.21-.209V7.5A1.5 1.5 0 0 1 3.75 6Z" />
    </svg>
  );
}

function DealIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.5 1.5 0 0 0 2.122 0l4.318-4.318a1.5 1.5 0 0 0 0-2.122L11.159 3.659A1.5 1.5 0 0 0 9.568 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
  );
}

function NetworkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-.778.099-1.533.284-2.253" />
    </svg>
  );
}

function WaveSparkline() {
  return (
    <svg className="h-10 w-24 overflow-visible" viewBox="0 0 100 40">
      <defs>
        <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d="M 0 30 Q 25 10 50 25 T 100 15 L 100 40 L 0 40 Z" fill="url(#waveGrad)" />
      <path d="M 0 30 Q 25 10 50 25 T 100 15" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
      <circle cx="100" cy="15" r="3" fill="#3b82f6" />
    </svg>
  );
}

function BarSparkline() {
  return (
    <svg className="h-10 w-24 overflow-visible animate-pulse-once" viewBox="0 0 80 40">
      <rect x="0" y="25" width="6" height="15" rx="1.5" fill="#c084fc" />
      <rect x="10" y="15" width="6" height="25" rx="1.5" fill="#c084fc" />
      <rect x="20" y="20" width="6" height="20" rx="1.5" fill="#c084fc" />
      <rect x="30" y="8" width="6" height="32" rx="1.5" fill="#c084fc" />
      <rect x="40" y="18" width="6" height="22" rx="1.5" fill="#a855f7" />
      <rect x="50" y="5" width="6" height="35" rx="1.5" fill="#a855f7" />
      <rect x="60" y="12" width="6" height="28" rx="1.5" fill="#a855f7" />
      <rect x="70" y="10" width="6" height="30" rx="1.5" fill="#a855f7" />
    </svg>
  );
}

function DonutSparkline() {
  return (
    <svg className="h-10 w-10 overflow-visible" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--border)" strokeWidth="4" />
      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="4"
        strokeDasharray="75 25" strokeDashoffset="25" strokeLinecap="round" />
      <text x="18" y="20.5" textAnchor="middle" className="text-[7.5px] font-black fill-[var(--text)]">75%</text>
    </svg>
  );
}

function OrangeBarSparkline() {
  return (
    <svg className="h-10 w-24 overflow-visible" viewBox="0 0 80 40">
      <rect x="0" y="30" width="6" height="10" rx="1.5" fill="#fbd38d" />
      <rect x="10" y="22" width="6" height="18" rx="1.5" fill="#fbd38d" />
      <rect x="20" y="15" width="6" height="25" rx="1.5" fill="#fbd38d" />
      <rect x="30" y="28" width="6" height="12" rx="1.5" fill="#fbd38d" />
      <rect x="40" y="12" width="6" height="28" rx="1.5" fill="#f6ad55" />
      <rect x="50" y="8" width="6" height="32" rx="1.5" fill="#f6ad55" />
      <rect x="60" y="18" width="6" height="22" rx="1.5" fill="#ed8936" />
      <rect x="70" y="5" width="6" height="35" rx="1.5" fill="#dd6b20" />
    </svg>
  );
}

export default function MetricCard({ label, value, change }) {
  const isStores = label.toLowerCase().includes("store");
  const isCoupons = label.toLowerCase().includes("coupon");
  const isDeals = label.toLowerCase().includes("deal");
  const isNetworks = label.toLowerCase().includes("network") || label.toLowerCase().includes("integration");

  let iconBg = "bg-blue-500/10 text-blue-500 border-blue-500/20";
  let tagText = "monthly";
  let sparkline = <WaveSparkline />;

  if (isStores) {
    iconBg = "bg-blue-500/10 text-[#3b82f6] border-blue-500/10";
    tagText = "catalog";
    sparkline = <WaveSparkline />;
  } else if (isCoupons) {
    iconBg = "bg-purple-500/10 text-[#8b5cf6] border-purple-500/10";
    tagText = "live codes";
    sparkline = <BarSparkline />;
  } else if (isDeals) {
    iconBg = "bg-emerald-500/10 text-[#10b981] border-emerald-500/10";
    tagText = "live deals";
    sparkline = <DonutSparkline />;
  } else if (isNetworks) {
    iconBg = "bg-orange-500/10 text-[#f59e0b] border-orange-500/10";
    tagText = "merchants";
    sparkline = <OrangeBarSparkline />;
  }

  return (
    <Card className="relative overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
          {label}
        </span>
        <span className="rounded-full bg-[var(--surface-soft)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--muted)] border border-[var(--border)]">
          {tagText}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${iconBg} shadow-sm`}>
            {isStores && <StoreIcon />}
            {isCoupons && <CouponIcon />}
            {isDeals && <DealIcon />}
            {!isStores && !isCoupons && !isDeals && <NetworkIcon />}
          </div>
          <span className="text-3xl font-bold tracking-tight text-[var(--text)]">
            {value}
          </span>
        </div>

        <div className="flex items-center justify-end">
          {sparkline}
        </div>
      </div>

      <p className="mt-4 text-[10px] font-bold text-[var(--muted)] flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
        {change}
      </p>
    </Card>
  );
}
