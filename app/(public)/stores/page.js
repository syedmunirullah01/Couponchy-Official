import StorePage from "@/features/stores/components/directory/StoreDirectoryPage";
import { getStoreDirectoryData } from "@/server/services/catalog-service";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";
import { getMetadataDefaults } from "@/server/services/settings-service";

export async function generateMetadata() {
  return getMetadataDefaults("Store Directory");
}

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const countryCode = await resolveRequestCountryCode();
  const directoryData = await getStoreDirectoryData(resolvedSearchParams?.search || "", countryCode);
  return <StorePage {...directoryData} />;
}

