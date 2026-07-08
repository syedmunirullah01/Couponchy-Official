import OfferSection from "./OfferSection";
import StoreContent from "./StoreContent";
import StoreHeader from "./StoreHeader";
import StoreSidebar from "./StoreSidebar";

export default function SingleStorePage({ singleStore, storeTabs, offerTabs, offers, products, faqs, relatedStores }) {
  return (
    <div className="mx-auto max-w-[1380px] px-4 py-8 sm:px-6 lg:px-8">
      <StoreHeader singleStore={singleStore} storeTabs={storeTabs} offerTabs={offerTabs} offers={offers} />
      {/* Main: offers left, sidebar right */}
      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Left: main content */}
        <div className="min-w-0 flex-1">
          <OfferSection offers={offers} store={singleStore} />
          <StoreContent singleStore={singleStore} faqs={faqs} />
        </div>
        {/* Right: sidebar */}
        <StoreSidebar singleStore={singleStore} relatedStores={relatedStores} offers={offers} />
      </div>

      {/* How It Works Section */}
      <section className="mt-20 border-t border-white/5 pt-16">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-3.5 py-1.5 text-[9px] font-black uppercase tracking-[0.25em] text-[var(--accent)]">
            SAVINGS GUIDE
          </span>
          <h2 className="mt-5 text-3xl sm:text-4xl font-black uppercase tracking-[-0.04em] text-white">
            How to save at{" "}<span className="bg-gradient-to-r from-white via-white to-[var(--color-primary-hover)] bg-clip-text text-transparent">{singleStore.name || "this store"}</span>
          </h2>
          <p className="mt-3.5 text-sm text-white/50 leading-relaxed">
            Follow these three quick and easy steps to claim verified coupon discounts on your purchases.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Step 1 */}
          <div className="group relative rounded-[24px] border border-white/5 bg-[linear-gradient(180deg,var(--surface-soft)_0%,var(--surface)_100%)] p-6 transition hover:border-[var(--accent)]/45">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-base font-black text-[var(--accent)] transition-all duration-300 group-hover:scale-105">
              01
            </div>
            <h3 className="mt-6 text-lg font-black text-white group-hover:text-[var(--accent)] transition-colors">
              Pick Your Offer
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-white/45">
              Scroll through the active coupon codes and deals verified for {singleStore.name || "this store"} listed above, and click the copy or reveal button.
            </p>
          </div>

          {/* Step 2 */}
          <div className="group relative rounded-[24px] border border-white/5 bg-[linear-gradient(180deg,var(--surface-soft)_0%,var(--surface)_100%)] p-6 transition hover:border-[var(--accent)]/45">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-base font-black text-[var(--accent)] transition-all duration-300 group-hover:scale-105">
              02
            </div>
            <h3 className="mt-6 text-lg font-black text-white group-hover:text-[var(--accent)] transition-colors">
              Copy the Code
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-white/45">
              For coupons, click &quot;Reveal Code&quot;. The discount code will copy to your clipboard automatically, and the {singleStore.name || "this store"} shopping tab will open.
            </p>
          </div>

          {/* Step 3 */}
          <div className="group relative rounded-[24px] border border-white/5 bg-[linear-gradient(180deg,var(--surface-soft)_0%,var(--surface)_100%)] p-6 transition hover:border-[var(--accent)]/45">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-base font-black text-[var(--accent)] transition-all duration-300 group-hover:scale-105">
              03
            </div>
            <h3 className="mt-6 text-lg font-black text-white group-hover:text-[var(--accent)] transition-colors">
              Apply at Checkout
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-white/45">
              Select items to purchase on the merchant site. During checkout, paste your copied coupon code inside the discount promo box to apply savings.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
