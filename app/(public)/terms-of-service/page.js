import TermsOfServicePage from "@/features/terms-of-service/components/TermsOfServicePage";
import { getPublicSiteSettings } from "@/server/services/settings-service";
import { getCompanyContent } from "@/server/repositories/company-repository";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";
import { COUNTRY_TO_LANG, getTranslatedTerms } from "@/server/services/translation-service";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  try {
    const company = await getCompanyContent();
    return {
      title: `${company.termsOfService.title || "Terms of Service"} | Couponchy`,
      description: "Review the Terms of Service for using Couponchy. Understand user obligations, content guidelines, and legal terms.",
    };
  } catch {
    return {
      title: "Terms of Service | Couponchy",
      description: "Review the Terms of Service for using Couponchy. Understand user obligations, content guidelines, and legal terms.",
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

    t = await getTranslatedTerms(lang, company?.termsOfService || {});
  } catch (err) {
    console.error("[Terms of Service Page] Error loading translations:", err);
    [settings, company] = await Promise.all([
      getPublicSiteSettings().catch(() => ({})),
      getCompanyContent().catch(() => null),
    ]);
  }

  const translatedCompany = company && t ? {
    ...company,
    termsOfService: { ...company.termsOfService, ...t }
  } : company;

  return <TermsOfServicePage settings={settings} company={translatedCompany} />;
}
