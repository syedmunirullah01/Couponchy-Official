import PrivacyPolicyPage from "@/features/privacy-policy/components/PrivacyPolicyPage";
import { getPublicSiteSettings } from "@/server/services/settings-service";
import { getCompanyContent } from "@/server/repositories/company-repository";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";
import { COUNTRY_TO_LANG, getTranslatedPrivacy } from "@/server/services/translation-service";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  try {
    const company = await getCompanyContent();
    return {
      title: `${company.privacyPolicy.title || "Privacy Policy"} | Couponchy`,
      description: "Review Couponchy's privacy policy. Learn how we handle information, cookies, and protect your data while using our platform.",
    };
  } catch {
    return {
      title: "Privacy Policy | Couponchy",
      description: "Review Couponchy's privacy policy. Learn how we handle information, cookies, and protect your data while using our platform.",
    };
  }
}

export default async function Page() {
  let settings = {};
  let company = null;
  let t = null;

  try {
    const countryCode = await resolveRequestCountryCode();
    const lang = COUNTRY_TO_LANG[String(countryCode || "").toUpperCase()] || "en";

    [settings, company] = await Promise.all([
      getPublicSiteSettings().catch(() => ({})),
      getCompanyContent().catch(() => null),
    ]);

    t = await getTranslatedPrivacy(lang, company?.privacyPolicy || {});
  } catch {
    [settings, company] = await Promise.all([
      getPublicSiteSettings().catch(() => ({})),
      getCompanyContent().catch(() => null),
    ]);
  }

  return <PrivacyPolicyPage settings={settings} company={company} t={t} />;
}
