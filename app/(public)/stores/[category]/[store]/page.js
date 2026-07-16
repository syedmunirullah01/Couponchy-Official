import SingleStorePage from "@/features/stores/components/store-detail/SingleStorePage";
import { notFound } from "next/navigation";
import { getStorePageData, getStorePageMetadata } from "@/server/services/catalog-service";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";
import { getMetadataDefaults } from "@/server/services/settings-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { store } = await params;
  const countryCode = await resolveRequestCountryCode();
  const storePageMetadata = await getStorePageMetadata(store, countryCode);

  const defaults = await getMetadataDefaults(
    storePageMetadata?.title || "Store",
    storePageMetadata
  );

  return {
    ...defaults,
    openGraph: {
      ...defaults.openGraph,
      title: storePageMetadata?.title || defaults.openGraph?.title,
      description: storePageMetadata?.description || defaults.openGraph?.description,
      url: storePageMetadata?.openGraph?.url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: storePageMetadata?.title || defaults.openGraph?.title,
      description: storePageMetadata?.description || defaults.openGraph?.description,
    },
    alternates: {
      ...storePageMetadata?.alternates,
    },
  };
}

export default async function Page({ params }) {
  const { category, store } = await params;
  const countryCode = await resolveRequestCountryCode();
  const storePageData = await getStorePageData(store, countryCode);

  if (!storePageData || storePageData.singleStore.categorySlug !== category) {
    notFound();
  }

  return <SingleStorePage {...storePageData} />;
}
