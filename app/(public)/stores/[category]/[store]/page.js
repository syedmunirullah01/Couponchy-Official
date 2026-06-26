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

  return getMetadataDefaults(
    storePageMetadata?.title || "Store",
    storePageMetadata
  );
}

export default async function Page({ params }) {
  const { store } = await params;
  const countryCode = await resolveRequestCountryCode();
  const storePageData = await getStorePageData(store, countryCode);

  if (!storePageData) {
    notFound();
  }

  return <SingleStorePage {...storePageData} />;
}
