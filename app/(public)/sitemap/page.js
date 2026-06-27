import SitemapPage from "@/features/sitemap/components/SitemapPage";
import { getAllCategories } from "@/server/repositories/categories-repository";
import { getAllStores } from "@/server/repositories/stores-repository";
import { getPublicSiteSettings } from "@/server/services/settings-service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sitemap | Couponchy",
  description:
    "Explore the complete sitemap of Couponchy. Locate categories, top stores, legal pages, and browse all savings lists.",
};

export default async function Page() {
  const [categories, stores, settings] = await Promise.all([
    getAllCategories(),
    getAllStores(),
    getPublicSiteSettings(),
  ]);

  return (
    <SitemapPage
      categories={categories}
      stores={stores}
      settings={settings}
    />
  );
}
