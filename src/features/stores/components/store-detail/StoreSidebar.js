import Image from "next/image";
import Link from "next/link";
import { buildCountryPath } from "@/lib/countries";
export default function StoreSidebar({ singleStore, relatedStores, offers = [], aboutText: propAboutText, t }) {
  const storeWebsite = singleStore.affiliateLink || singleStore.website || "#";
  const storeDisplayUrl = singleStore.website
    ? singleStore.website.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : `${singleStore.name?.toLowerCase().replace(/\s+/g, "")}.com`;

  const aboutText = propAboutText || generateStoreAboutDescription(singleStore, offers);

  return (
    <aside className="w-full space-y-4 lg:w-[300px] lg:shrink-0">

      {/* About Store Card */}
      <div className="rounded-[22px] border border-white/[0.06] bg-[#0c0c11] p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full border border-white/15 text-white/40 text-xs">
            i
          </div>
          <p className="text-sm font-black text-white/80">{t.aboutBrand.replace("{name}", singleStore.name)}</p>
        </div>
        <p className="text-xs leading-5 text-white/45">
          {aboutText}
        </p>
      </div>

      {/* Related Stores */}
      {relatedStores?.length > 0 && (
        <div className="rounded-[22px] border border-white/[0.06] bg-[#0c0c11] p-5">
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{t.relatedStores}</p>
          <div className="grid grid-cols-3 gap-3">
            {relatedStores.slice(0, 6).map((store) => (
              <Link
                key={store.name}
                href={buildCountryPath(`/stores/${store.categorySlug}/${store.slug}`, singleStore.countryCode)}
                className="group flex flex-col items-center gap-1.5 rounded-xl border border-transparent p-1.5 transition-all duration-200 hover:border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/5"
              >
                <div className="h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-white p-0.5 flex items-center justify-center shadow-sm">
                  {store.logoImage ? (
                    <img src={store.logoImage} alt={store.name} className="h-full w-full object-contain rounded-lg" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-black uppercase text-black">
                      {store.name?.slice(0, 2)}
                    </div>
                  )}
                </div>
                <p className="text-center text-[10px] font-bold leading-tight text-white/40 transition-colors group-hover:text-[var(--color-primary)] line-clamp-1 max-w-full">
                  {store.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
