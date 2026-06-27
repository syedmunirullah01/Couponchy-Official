import TermsOfServicePage from "@/features/terms-of-service/components/TermsOfServicePage";
import { getPublicSiteSettings } from "@/server/services/settings-service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Terms of Service | Couponchy",
  description:
    "Review the Terms of Service for using Couponchy. Understand user obligations, content guidelines, and legal terms.",
};

export default async function Page() {
  const settings = await getPublicSiteSettings();
  return <TermsOfServicePage settings={settings} />;
}
