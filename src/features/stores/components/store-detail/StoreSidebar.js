"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { buildCountryPath } from "@/lib/countries";
import { BrandMark } from "./StoreHeader";

function SidebarCard({ title, children }) {
  return (
    <section className="rounded-[22px] border border-[var(--border)] bg-[linear-gradient(180deg,#11190b_0%,#0f170a_100%)] p-6">
      <h3 className="mb-4 text-xl font-bold text-white">{title}</h3>
      {children}
    </section>
  );
}

export default function StoreSidebar({ singleStore, relatedStores }) {
  const storeVisitHref = singleStore.affiliateLink || "#";
  const [feedback, setFeedback] = useState("");

  return (
    <aside className="w-full space-y-5 lg:w-[320px] lg:shrink-0">
      <div className="flex flex-col items-center">
        <BrandMark
          size="large"
          logoText={singleStore.logoText}
          logoClassName={singleStore.logoClassName}
          logoImage={singleStore.logoImage}
          name={singleStore.name}
        />
        <Button asChild variant="primary" size="md" className="mt-5 w-full">
          <Link href={storeVisitHref} target={singleStore.affiliateLink ? "_blank" : undefined} rel={singleStore.affiliateLink ? "noreferrer" : undefined}>
            Visit Store
          </Link>
        </Button>
        <div className="mt-4 text-center">
          <div className="text-sm text-[#f7c94a]">★★★★★</div>
          <p className="mt-1 text-xs text-white/56">{singleStore.rating}</p>
        </div>
      </div>

      <section className="rounded-[22px] border border-[var(--border)] bg-[linear-gradient(180deg,#11190b_0%,#0f170a_100%)] p-5">
        <p className="text-center text-sm font-bold text-white">Are these {singleStore.name} offers useful?</p>
        <div className="mt-4 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setFeedback("yes")}
            className={`flex-1 shadow-none ${feedback === "yes" ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-black" : "bg-[var(--surface)]"}`}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setFeedback("no")}
            className={`flex-1 shadow-none ${feedback === "no" ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-black" : "bg-[var(--surface)]"}`}
          >
            No
          </Button>
        </div>
        {feedback ? (
          <p className="mt-3 text-center text-xs text-white/52">Thanks for the feedback.</p>
        ) : null}
      </section>

      <section className="rounded-[22px] border border-[var(--border)] bg-[linear-gradient(180deg,#11190b_0%,#0f170a_100%)] p-6">
        <h3 className="text-base font-bold text-white">Latest {singleStore.name} coupons and deals</h3>
        <p className="mt-2 text-xs text-white/48">Verified and updated</p>
        <div className="mt-4 space-y-2 text-sm text-white/72">
          <p>
            Active Coupons: <span className="font-bold text-white">{singleStore.activeCoupons}</span>
          </p>
          <p>
            Active Deals: <span className="font-bold text-white">{singleStore.activeDeals}</span>
          </p>
        </div>
      </section>

      <SidebarCard title="Why Trust Us?">
        <div className="space-y-4 text-sm leading-6 text-white/58">
          <p>
            At Couponchy, we are committed to providing you with the best deals and savings opportunities. Our dedicated team works tirelessly to ensure every coupon and deal we feature is verified, up-to-date, and reliable.
          </p>
          <p>
            We understand the importance of saving money, and that&apos;s why we make it our mission to help you find the best discounts from your favorite stores.
          </p>
          <p className="text-xs text-white/36">Last updated: {singleStore.updatedAt}</p>
        </div>
      </SidebarCard>

      <SidebarCard title="Related Stores">
        <div className="grid grid-cols-3 gap-4">
          {relatedStores.map((store) => (
            <Link key={store.name} href={buildCountryPath(`/stores/${store.categorySlug}/${store.slug}`, singleStore.countryCode)} className="group text-center">
              <div className="mx-auto">
                <BrandMark
                  size="small"
                  logoText={store.logoText}
                  logoClassName={store.logoClassName}
                  logoImage={store.logoImage}
                  name={store.name}
                />
              </div>
              <p className="mt-2 text-xs text-white/58 transition group-hover:text-[var(--accent)]">{store.name}</p>
            </Link>
          ))}
        </div>
      </SidebarCard>
    </aside>
  );
}
