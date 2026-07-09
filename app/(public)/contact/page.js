import ContactPage from "@/features/contact/components/ContactPage";
import { getPublicSiteSettings } from "@/server/services/settings-service";
import { getCompanyContent } from "@/server/repositories/company-repository";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";
import { COUNTRY_TO_LANG, getTranslatedContact } from "@/server/services/translation-service";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  try {
    const company = await getCompanyContent();
    return {
      title: `${company.contactUs.title || "Contact Us"} | Couponchy`,
      description: company.contactUs.subtitle || "Have questions or suggestions? Reach out to the Couponchy team.",
    };
  } catch {
    return {
      title: "Contact Us | Couponchy",
      description: "Have questions, suggestions, or want to submit a new coupon code? Reach out to the Couponchy team directly.",
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

    t = await getTranslatedContact(lang, company?.contactUs || {});
  } catch {
    // fallback silently
    [settings, company] = await Promise.all([
      getPublicSiteSettings().catch(() => ({})),
      getCompanyContent().catch(() => null),
    ]);
  }

  return <ContactPage settings={settings} company={company} t={t} />;
}
