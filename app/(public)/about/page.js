import AboutPage from "@/features/about/components/AboutPage";
import { getAllStores } from "@/server/repositories/stores-repository";
import { getAllOffers } from "@/server/repositories/offers-repository";
import { getCompanyContent } from "@/server/repositories/company-repository";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  try {
    const company = await getCompanyContent();
    return {
      title: `${company.aboutUs.title || "About Us"} | Couponchy`,
      description: company.aboutUs.subtitle || "Learn about Couponchy — our mission to verify every coupon code so you never waste time on expired deals again.",
    };
  } catch {
    return {
      title: "About Us | Couponchy",
      description: "Learn about Couponchy — our mission to verify every coupon code so you never waste time on expired deals again.",
    };
  }
}

export default async function Page() {
  let totalStores = 0;
  let totalOffers = 0;
  let company = null;

  try {
    const [stores, offers, companyContent] = await Promise.all([
      getAllStores(),
      getAllOffers(),
      getCompanyContent(),
    ]);
    totalStores = stores.length;
    totalOffers = offers.length;
    company = companyContent;
  } catch {
    // fallback to defaults silently
  }

  return <AboutPage totalStores={totalStores} totalOffers={totalOffers} company={company} />;
}
