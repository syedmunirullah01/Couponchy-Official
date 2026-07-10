import SitemapPage from "@/features/sitemap/components/SitemapPage";
import { getAllCategories } from "@/server/repositories/categories-repository";
import { getAllStores } from "@/server/repositories/stores-repository";
import { getPublicSiteSettings } from "@/server/services/settings-service";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sitemap | Couponchy",
  description:
    "Explore the complete sitemap of Couponchy. Locate categories, top stores, legal pages, and browse all savings lists.",
};

export default async function Page() {
  const [categories, stores, settings, countryCode] = await Promise.all([
    getAllCategories(),
    getAllStores(),
    getPublicSiteSettings(),
    resolveRequestCountryCode(),
  ]);

  const activeCountry = (countryCode || "US").toUpperCase();

  // Filter stores to only include those belonging to the active region/country
  const filteredStores = stores.filter(
    (s) => s && s.name && s.slug && (s.countryCode || "US").toUpperCase() === activeCountry
  );

  // Filter categories to only include those containing at least one store in the active region/country
  const activeCategorySlugs = new Set(
    filteredStores.map((s) => s.categorySlug).filter(Boolean)
  );
  const activeCategoryNames = new Set(
    filteredStores.map((s) => s.category?.trim().toLowerCase()).filter(Boolean)
  );
  const filteredCategories = categories.filter(
    (c) =>
      activeCategorySlugs.has(c.slug) ||
      activeCategoryNames.has(c.name.trim().toLowerCase())
  );

  return (
    <SitemapPage
      categories={filteredCategories}
      stores={filteredStores}
      settings={settings}
      countryCode={activeCountry.toLowerCase()}
    />
  );
}
