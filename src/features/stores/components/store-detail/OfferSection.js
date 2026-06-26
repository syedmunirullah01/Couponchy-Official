"use client";

import { useMemo, useState } from "react";
import OfferList from "./OfferList";
import OfferTabs from "./OfferTabs";

const TAB_KEYS = ["all", "coupon", "deal"];

export default function OfferSection({ offerTabs, offers, store }) {
  const [activeTab, setActiveTab] = useState("all");

  const filteredOffers = useMemo(() => {
    if (activeTab === "all") {
      return offers;
    }

    return offers.filter((offer) => offer.type?.toLowerCase() === activeTab);
  }, [activeTab, offers]);

  return (
    <>
      <div id="coupons" className="scroll-mt-28">
        <OfferTabs offerTabs={offerTabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <div className="mt-5">
        <OfferList offers={filteredOffers} store={store} />
      </div>
    </>
  );
}
