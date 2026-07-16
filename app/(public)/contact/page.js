import ContactPage from "@/features/contact/components/ContactPage";
import { getPublicSiteSettings } from "@/server/services/settings-service";
import { getCompanyContent } from "@/server/repositories/company-repository";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";
import { COUNTRY_TO_LANG, getTranslatedContact } from "@/server/services/translation-service";
import { getSeoAlternates } from "@/server/services/seo-alternates";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const countryCode = await resolveRequestCountryCode();
  const lang = COUNTRY_TO_LANG[String(countryCode || "").toUpperCase()] || "en";

  const templates = {
    en: {
      title: "Contact CouponChy | Customer Support & Business Inquiries",
      description: "Get in touch with the CouponChy team for support, partnership opportunities, affiliate inquiries, or general questions."
    },
    de: {
      title: "Kontakt CouponChy | Kundendienst & Geschäftsanfragen",
      description: "Kontaktieren Sie das CouponChy-Team für Support, Partnerschaften, Affiliate-Anfragen oder allgemeine Fragen."
    },
    fr: {
      title: "Contactez CouponChy | Support client et demandes commerciales",
      description: "Prenez contact avec l'équipe de CouponChy pour obtenir de l'aide, des opportunités de partenariat ou des questions générales."
    },
    es: {
      title: "Contacto CouponChy | Soporte al cliente y consultas comerciales",
      description: "Póngase en contacto con el equipo de CouponChy para soporte, oportunidades de asociación, consultas de afiliados o preguntas."
    },
    ar: {
      title: "اتصل بـ CouponChy | خدمة العملاء واستفسارات الأعمال",
      description: "تواصل مع فريق CouponChy للحصول على الدعم، أو لفرص الشراكة، أو استفسارات التسويق بالعمولة، أو الأسئلة العامة."
    },
    nl: {
      title: "Contact CouponChy | Klantenservice & zakelijke vragen",
      description: "Neem contact op met het CouponChy-team voor ondersteuning, samenwerkingen, affiliate-vragen of algemene opmerkingen."
    },
    pl: {
      title: "Kontakt z CouponChy | Wsparcie klienta i zapytania biznesowe",
      description: "Skontaktuj się z zespołem CouponChy w sprawie wsparcia, możliwości partnerskich, pytań o program partnerski lub pytań ogólnych."
    },
    it: {
      title: "Contatta CouponChy | Servizio clienti e richieste commerciali",
      description: "Mettiti in contatto con il team di CouponChy per supporto, opportunità di partnership, richieste di affiliazione o domande generali."
    },
    ja: {
      title: "CouponChyへのお問い合わせ | カスタマーサポート＆ビジネスのお問い合わせ",
      description: "サポート、パートナーシップのご提案、アフィリエイトに関するご質問、または一般的なお問い合わせはこちらから。"
    },
    pt: {
      title: "Contato CouponChy | Suporte ao cliente e consultas comerciais",
      description: "Entre em contato com a equipe do CouponChy para obter suporte, oportunidades de parceria, dúvidas de afiliados ou perguntas gerais."
    },
    sv: {
      title: "Kontakta CouponChy | Kundtjänst & affärsförfrågningar",
      description: "Hör av dig till CouponChy-teamet för support, samarbetsmöjligheter, affiliatefrågor eller allmänna funderingar."
    }
  };

  const selected = templates[lang] || templates.en;

  const alternates = await getSeoAlternates("/contact", countryCode);

  return {
    title: selected.title,
    description: selected.description,
    alternates,
    openGraph: {
      title: selected.title,
      description: selected.description,
      url: alternates.canonical,
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

    t = await getTranslatedContact(lang, company?.contactUs || {});
  } catch {
    [settings, company] = await Promise.all([
      getPublicSiteSettings().catch(() => ({})),
      getCompanyContent().catch(() => null),
    ]);
  }

  return <ContactPage settings={settings} company={company} t={t} />;
}
