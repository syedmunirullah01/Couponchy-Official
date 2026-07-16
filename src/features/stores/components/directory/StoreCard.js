import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function StoreCard({ store }) {
  const hasDeals = store.count && !store.count.toLowerCase().startsWith("0");

  return (
    <Link
      href={`/stores/${store.categorySlug}/${store.slug}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-6 text-center transition-all duration-300 hover:border-violet-500/30 hover:bg-[#0c0c10] hover:shadow-[0_16px_40px_rgba(139,92,246,0.1)] hover:-translate-y-1"
    >
      <div className="space-y-5">
        {/* Rounded Premium Square Logo Box */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-[20px] border border-white/8 bg-white shadow-md transition-all duration-300 group-hover:scale-105 group-hover:border-white/20">
          {store.logoImage ? (
            <div className="relative h-full w-full">
              <Image src={store.logoImage} alt={`${store.name} logo`} fill className="object-cover" unoptimized />
            </div>
          ) : (
            <div className={cn("flex h-full w-full items-center justify-center rounded-[18px] text-center text-[10px] font-black uppercase tracking-wider leading-none", store.logoClassName || "bg-gradient-to-br from-violet-600 to-indigo-600 text-white")}>
              <span className="truncate p-1">{store.logoText || store.name.slice(0, 2)}</span>
            </div>
          )}
        </div>

        {/* Store Title */}
        <h3 className="text-[16px] font-black tracking-tight text-white leading-snug transition duration-300 group-hover:text-[var(--accent)]">
          {store.name}
        </h3>
      </div>

      {/* Styled Active Offer Count Badge */}
      <div className="mt-5 flex justify-center">
        <span
          className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider border transition-all duration-300 ${hasDeals
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.06)]"
              : "bg-white/[0.02] text-white/40 border-white/5"
            }`}
        >
          {store.count || "No Offers"}
        </span>
      </div>
    </Link>
  );
}

