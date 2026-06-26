import HomePage from "@/features/home/components/HomePage";
import { getHomePageData } from "@/server/services/catalog-service";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";
import { getMetadataDefaults } from "@/server/services/settings-service";

export async function generateMetadata() {
  return getMetadataDefaults("Home");
}

export const dynamic = "force-dynamic";

export default async function Page() {
  const countryCode = await resolveRequestCountryCode();
  const homePageData = await getHomePageData(countryCode);
  return <HomePage {...homePageData} />;
}

