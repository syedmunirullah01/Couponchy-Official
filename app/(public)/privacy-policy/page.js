import PrivacyPolicyPage from "@/features/privacy-policy/components/PrivacyPolicyPage";
import { getPublicSiteSettings } from "@/server/services/settings-service";
import { getCompanyContent } from "@/server/repositories/company-repository";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";
import { COUNTRY_TO_LANG, getTranslatedPrivacy } from "@/server/services/translation-service";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const countryCode = await resolveRequestCountryCode();
  const lang = COUNTRY_TO_LANG[String(countryCode || "").toUpperCase()] || "en";

  const templates = {
    en: {
      title: "Privacy Policy | CouponChy",
      description: "Read CouponChy's Privacy Policy to learn how we collect, use, protect, and manage your personal information."
    },
    de: {
      title: "Datenschutzerklärung | CouponChy",
      description: "Lesen Sie die Datenschutzerklärung von CouponChy, um zu erfahren, wie wir Ihre persönlichen Daten erheben, nutzen, schützen und verwalten."
    },
    fr: {
      title: "Politique de confidentialité | CouponChy",
      description: "Lisez la politique de confidentialité de CouponChy pour savoir comment nous collectons, utilisons, protégeons et gérons vos informations personnelles."
    },
    es: {
      title: "Política de privacidad | CouponChy",
      description: "Lea la política de privacidad de CouponChy para saber cómo recopilamos, utilizamos, protegemos y gestionamos su información personal."
    },
    ar: {
      title: "سياسة الخصوصية | CouponChy",
      description: "اقرأ سياسة الخصوصية الخاصة بـ CouponChy لمعرفة كيف نقوم بجمع معلوماتك الشخصية واستخدامها وحمايتها وإدارتها."
    },
    nl: {
      title: "Privacybeleid | CouponChy",
      description: "Lees het privacybeleid van CouponChy om te leren hoe we uw persoonlijke gegevens verzamelen, gebruiken, beschermen en beheren."
    },
    pl: {
      title: "Polityka prywatności | CouponChy",
      description: "Przeczytaj Politykę prywatności CouponChy, aby dowiedzieć się, jak gromadzimy, używamy, chronimy i zarządzamy Twoimi danymi osobowymi."
    },
    it: {
      title: "Informativa sulla privacy | CouponChy",
      description: "Leggi l'Informativa sulla privacy di CouponChy per scoprire come raccogliamo, utilizziamo, proteggiamo e gestiamo le tue informazioni personali."
    },
    ja: {
      title: "プライバシーポリシー | CouponChy",
      description: "CouponChyのプライバシーポリシーを読み、当社がお客様の個人情報をどのように収集、使用、保護、管理しているかをご確認ください。"
    },
    pt: {
      title: "Política de Privacidade | CouponChy",
      description: "Leia a Política de Privacidade do CouponChy para saber como coletamos, usamos, protegemos e gerenciamos suas informações pessoais."
    },
    sv: {
      title: "Integritetspolicy | CouponChy",
      description: "Läs CouponChys integritetspolicy för att lära dig hur vi samlar in, använder, skyddar och hanterar dina personuppgifter."
    }
  };

  const selected = templates[lang] || templates.en;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://couponchy.com";
  const canonicalUrl = `${baseUrl}${countryCode ? `/${countryCode.toLowerCase()}` : ""}/privacy-policy`;

  const supportedLanguages = ["en", "de", "fr", "nl", "pl", "it", "es", "ar", "ja", "pt", "sv"];
  const languageToCountry = {
    en: "us",
    de: "de",
    fr: "fr",
    nl: "nl",
    pl: "pl",
    it: "it",
    es: "es",
    ar: "sa",
    ja: "jp",
    pt: "pt",
    sv: "se"
  };

  const hreflangs = {};
  supportedLanguages.forEach((l) => {
    const cc = languageToCountry[l];
    hreflangs[l] = `${baseUrl}/${cc}/privacy-policy`;
  });
  hreflangs["x-default"] = `${baseUrl}/us/privacy-policy`;

  return {
    title: selected.title,
    description: selected.description,
    alternates: {
      canonical: canonicalUrl,
      languages: hreflangs,
    },
    openGraph: {
      title: selected.title,
      description: selected.description,
      url: canonicalUrl,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: selected.title,
      description: selected.description,
    },
  };
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
