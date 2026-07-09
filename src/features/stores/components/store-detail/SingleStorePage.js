import OfferSection from "./OfferSection";
import StoreContent from "./StoreContent";
import StoreHeader from "./StoreHeader";
import StoreSidebar from "./StoreSidebar";
import { getStoreUITranslations } from "./store-translations";

export default function SingleStorePage({ singleStore, storeTabs, offerTabs, offers, products, faqs, relatedStores, aboutText }) {
  const t = getStoreUITranslations(singleStore.countryCode);

  return (
    <div className="mx-auto max-w-[1380px] px-4 py-8 sm:px-6 lg:px-8">
      <StoreHeader singleStore={singleStore} storeTabs={storeTabs} offerTabs={offerTabs} offers={offers} t={t} />
      {/* Main: offers left, sidebar right */}
      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Left: main content */}
        <div className="min-w-0 flex-1">
          <OfferSection offers={offers} store={singleStore} t={t} />
          <StoreContent singleStore={singleStore} faqs={faqs} t={t} />
        </div>
        {/* Right: sidebar */}
        <StoreSidebar singleStore={singleStore} relatedStores={relatedStores} offers={offers} aboutText={aboutText} t={t} />
      </div>

      {/* How It Works Section */}
      <section className="mt-20 border-t border-white/5 pt-16">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-3.5 py-1.5 text-[9px] font-black uppercase tracking-[0.25em] text-[var(--accent)]">
            {t.savingsGuide}
          </span>
          <h2 className="mt-5 text-3xl sm:text-4xl font-black uppercase tracking-[-0.04em] text-white">
            {t.howToSave.split("{name}")[0]}
            <span className="bg-gradient-to-r from-white via-white to-[var(--color-primary-hover)] bg-clip-text text-transparent">
              {singleStore.name || "this store"}
            </span>
            {t.howToSave.split("{name}")[1] || ""}
          </h2>
          <p className="mt-3.5 text-sm text-white/50 leading-relaxed">
            {t.howToSaveDesc}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Step 1 */}
          <div className="group relative rounded-[24px] border border-white/5 bg-[linear-gradient(180deg,var(--surface-soft)_0%,var(--surface)_100%)] p-6 transition hover:border-[var(--accent)]/45">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-base font-black text-[var(--accent)] transition-all duration-300 group-hover:scale-105">
              01
            </div>
            <h3 className="mt-6 text-lg font-black text-white group-hover:text-[var(--accent)] transition-colors">
              {t.step1Title}
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-white/45">
              {t.step1Desc.replace("{name}", singleStore.name || "this store")}
            </p>
          </div>

          {/* Step 2 */}
          <div className="group relative rounded-[24px] border border-white/5 bg-[linear-gradient(180deg,var(--surface-soft)_0%,var(--surface)_100%)] p-6 transition hover:border-[var(--accent)]/45">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-base font-black text-[var(--accent)] transition-all duration-300 group-hover:scale-105">
              02
            </div>
            <h3 className="mt-6 text-lg font-black text-white group-hover:text-[var(--accent)] transition-colors">
              {t.step2Title}
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-white/45">
              {t.step2Desc.replace("{name}", singleStore.name || "this store")}
            </p>
          </div>

          {/* Step 3 */}
          <div className="group relative rounded-[24px] border border-white/5 bg-[linear-gradient(180deg,var(--surface-soft)_0%,var(--surface)_100%)] p-6 transition hover:border-[var(--accent)]/45">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-base font-black text-[var(--accent)] transition-all duration-300 group-hover:scale-105">
              03
            </div>
            <h3 className="mt-6 text-lg font-black text-white group-hover:text-[var(--accent)] transition-colors">
              {t.step3Title}
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-white/45">
              {t.step3Desc.replace("{name}", singleStore.name || "this store")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
