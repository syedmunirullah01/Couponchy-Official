"use client";

import OfferList from "./OfferList";

export default function OfferSection({ offers = [], store }) {
  return (
    <div>
      <div id="coupons" className="mb-6 border-b border-white/[0.04] pb-5 scroll-mt-28">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
          Today's {store.name} Promo Codes & Verification Report
        </h2>
      </div>

      {/* Offer list */}
      {offers.length > 0 ? (
        <OfferList offers={offers} store={store} />
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-white/[0.07] bg-white/[0.02] py-14 text-center">
          <div className="text-3xl">🎟️</div>
          <p className="text-sm font-bold text-white/40">No offers found</p>
        </div>
      )}
    </div>
  );
}
