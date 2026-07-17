import Link from "next/link";
import Image from "next/image";

export default function StoreSpotlightCard({ store }) {
  const offerCount = Number(store.offer?.split(" ")[0] ?? 0);
  const offerLabel = offerCount > 0 ? store.offer : "Ready for launch";
  const shortMark = (store.logoText || store.name)
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      href={store.href ?? "#"}
      className="group relative block overflow-hidden rounded-[32px] border border-white/5 bg-[#0a0a0a] transition-all duration-500 hover:-translate-y-2 hover:border-[var(--color-primary)]/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_20px_rgba(139, 92, 246,0.03)]"
    >
      {/* Background Glow */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[var(--color-primary)]/5 blur-[80px] transition-opacity duration-500 group-hover:opacity-100" />
      <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-[var(--color-primary)]/5 blur-[80px] transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex min-h-[380px] flex-col items-center p-8 text-center">
        {/* Top Badge */}
        <div className="mb-8 flex w-full items-center justify-between">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">
            {store.trustStatus ?? "Verified"}
          </span>
          <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]/40 animate-pulse" />
        </div>

        {/* Logo Container */}
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-[32px] bg-[var(--color-primary)]/10 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          {store.logoImage ? (
            <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-white transition-transform duration-500 group-hover:scale-110 group-hover:border-[var(--color-primary)]/20">
              <Image src={store.logoImage} alt={`${store.name} logo`} fill sizes="96px" unoptimized={store.logoImage && !store.logoImage.includes("supabase.co") && !store.logoImage.startsWith("/")} className="object-contain p-3" />
            </div>
          ) : (
            <div className="relative flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.03] text-2xl font-black transition-transform duration-500 group-hover:scale-110 group-hover:border-[var(--color-primary)]/20">
              <span className="bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent">
                {shortMark}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col">
          <h3 className="text-xl font-black italic tracking-tight text-white transition-colors duration-300 group-hover:text-[var(--color-primary)]">
            {store.name}
          </h3>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">
            {offerCount > 0 ? `${offerCount} Active Offers` : "New Merchant"}
          </p>

          <div className="mt-auto pt-8">
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] text-white/60 transition-all duration-300 group-hover:border-[var(--color-primary)]/20 group-hover:bg-[var(--color-primary)] group-hover:text-black">
              View Store
              <svg viewBox="0 0 24 24" className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M5 12h14m-7-7 7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
