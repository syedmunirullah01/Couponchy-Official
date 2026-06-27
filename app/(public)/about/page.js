import AboutPage from "@/features/about/components/AboutPage";
import { getAllStores, } from "@/server/repositories/stores-repository";
import { getAllOffers } from "@/server/repositories/offers-repository";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "About Us | Couponchy",
  description:
    "Learn about Couponchy — our mission to verify every coupon code so you never waste time on expired deals again.",
};

export default async function Page() {
  let totalStores = 0;
  let totalOffers = 0;

  try {
    const [stores, offers] = await Promise.all([getAllStores(), getAllOffers()]);
    totalStores = stores.length;
    totalOffers = offers.length;
  } catch {
    // fallback to 0 silently
  }

  return <AboutPage totalStores={totalStores} totalOffers={totalOffers} />;
}
