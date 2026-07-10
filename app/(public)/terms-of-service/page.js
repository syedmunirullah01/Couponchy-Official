import TermsOfServicePage from "@/features/terms-of-service/components/TermsOfServicePage";
import { getPublicSiteSettings } from "@/server/services/settings-service";
import { getCompanyContent } from "@/server/repositories/company-repository";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";
import { COUNTRY_TO_LANG, getTranslatedTerms } from "@/server/services/translation-service";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const countryCode = await resolveRequestCountryCode();
  const lang = COUNTRY_TO_LANG[String(countryCode || "").toUpperCase()] || "en";

  const templates = {
    en: {
      title: "Terms & Conditions | CouponChy",
      description: "Review CouponChy's Terms & Conditions to understand the rules, policies, and guidelines for using our website and services."
    },
    de: {
      title: "Allgemeine Geschäftsbedingungen | CouponChy",
      description: "Nutzen Sie CouponChy? Lesen Sie unsere Allgemeinen Geschäftsbedingungen, um die Regeln, Richtlinien und Bedingungen unserer Website zu verstehen."
    },
    fr: {
      title: "Conditions générales d'utilisation | CouponChy",
      description: "Consultez les conditions générales de CouponChy pour comprendre les règles, politiques et directives d'utilisation de notre site Web."
    },
    es: {
      title: "Términos y condiciones | CouponChy",
      description: "Revise los Términos y condiciones de CouponChy para comprender las reglas, políticas y pautas de uso de nuestro sitio web."
    },
    ar: {
      title: "الشروط والأحكام | CouponChy",
      description: "راجع الشروط والأحكام الخاصة بـ CouponChy لفهم القواعد والسياسات والإرشادات التوجيهية لاستخدام موقعنا وخدماتنا."
    },
    nl: {
      title: "Algemene voorwaarden | CouponChy",
      description: "Lees de algemene voorwaarden van CouponChy om de regels, richtlijnen en voorwaarden voor het gebruik van onze website te begrijpen."
    },
    pl: {
      title: "Regulamin i warunki | CouponChy",
      description: "Zapoznaj się z Regulaminem CouponChy, aby zrozumieć zasady, polityki i wytyczne dotyczące korzystania z naszej witryny."
    },
    it: {
      title: "Termini e condizioni | CouponChy",
      description: "Leggi i Termini e condizioni di CouponChy per comprendere le regole, le politiche e le linee guida per l'utilizzo del nostro sito."
    },
    ja: {
      title: "利用規約 | CouponChy",
      description: "当社のウェブサイトおよびサービスのご利用に関するルール、ポリシー、ガイドラインを定めたCouponChyの利用規約をご確認ください。"
    },
    pt: {
      title: "Termos e Condições | CouponChy",
      description: "Reveja os Termos e Condições do CouponChy para compreender as regras, políticas e diretrizes de utilização do nosso website."
    },
    sv: {
      title: "Användarvillkor | CouponChy",
      description: "Läs igenom CouponChys användarvillkor för att förstå reglerna, riktlinjerna och villkoren för att använda vår webbplats."
    }
  };

  const selected = templates[lang] || templates.en;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://couponchy.com";
  const canonicalUrl = `${baseUrl}${countryCode ? `/${countryCode.toLowerCase()}` : ""}/terms-of-service`;

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
    hreflangs[l] = `${baseUrl}/${cc}/terms-of-service`;
  });
  hreflangs["x-default"] = `${baseUrl}/us/terms-of-service`;

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
