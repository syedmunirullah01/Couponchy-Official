import ActivityMarqueeSection from "./ActivityMarqueeSection";
import FeaturedCouponsSection from "./FeaturedCouponsSection";
import FeaturedProductsSection from "./FeaturedProductsSection";
import HeroSection from "./HeroSection";
import CategoriesSection from "./CategoriesSection";
import LiveVaultSection from "./LiveVaultSection";
import TrendingStoresSection from "./TrendingStoresSection";

export default function HomePage({
  hero,
  trendingStores,
  trendingStoresTitle,
  featuredCoupons,
  featuredCouponsTitle,
  featuredProducts,
  featuredProductsTitle,
  categories,
  categoriesTitle,
}) {
  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-20 px-4 pb-8 pt-3 sm:px-6 sm:pb-10 sm:pt-4 lg:px-8 lg:pb-12 lg:pt-5">
      <HeroSection hero={hero} />
      <ActivityMarqueeSection />
      <TrendingStoresSection trendingStores={trendingStores} title={trendingStoresTitle} />
      <FeaturedCouponsSection featuredCoupons={featuredCoupons} title={featuredCouponsTitle} />
      <FeaturedProductsSection featuredProducts={featuredProducts} title={featuredProductsTitle} />
      <CategoriesSection categories={categories} title={categoriesTitle} />
      <LiveVaultSection />
    </div>
  );
}
