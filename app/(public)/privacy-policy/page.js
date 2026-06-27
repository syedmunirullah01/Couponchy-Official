import PrivacyPolicyPage from "@/features/privacy-policy/components/PrivacyPolicyPage";
import { getPublicSiteSettings } from "@/server/services/settings-service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Privacy Policy | Couponchy",
  description:
    "Review Couponchy's privacy policy. Learn how we handle information, cookies, and protect your data while using our platform.",
};

export default async function Page() {
  const settings = await getPublicSiteSettings();
  return <PrivacyPolicyPage settings={settings} />;
}
