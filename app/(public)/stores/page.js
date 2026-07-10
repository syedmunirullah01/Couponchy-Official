import StorePage from "@/features/stores/components/directory/StoreDirectoryPage";
import { getStoreDirectoryData } from "@/server/services/catalog-service";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";
import { COUNTRY_TO_LANG } from "@/server/services/translation-service";
import { getAllCategories } from "@/server/repositories/categories-repository";
import { getTranslatedCategories } from "@/server/services/translation-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const categorySlug = resolvedSearchParams?.category;
  const countryCode = await resolveRequestCountryCode();
  const lang = COUNTRY_TO_LANG[String(countryCode || "").toUpperCase()] || "en";

  if (categorySlug) {
    const [categories] = await Promise.all([
      getAllCategories(),
    ]);
    const translatedCategories = await getTranslatedCategories(categories, lang);
    const category = translatedCategories.find((c) => c.slug === categorySlug);

    if (category) {
      const catName = category.name;
      
      const templates = {
        en: {
          title: `${catName} Coupons & Promo Codes | Verified Deals | CouponChy`,
          description: `Discover the latest verified ${catName} coupons, promo codes, and exclusive deals from top brands. Save more with regularly updated discounts at CouponChy.`
        },
        de: {
          title: `${catName} Gutscheine & Rabattcodes | Geprüfte Angebote | CouponChy`,
          description: `Entdecken Sie die neuesten verifizierten {Category} Gutscheine, Rabattcodes und exklusiven Angebote von Top-Marken. Sparen Sie mehr auf CouponChy.`.replaceAll("{Category}", catName)
        },
        fr: {
          title: `Coupons et codes promo ${catName} | Offres vérifiées | CouponChy`,
          description: `Découvrez les derniers coupons, codes promo et offres vérifiés pour la catégorie ${catName} auprès des meilleures marques. Économisez sur CouponChy.`
        },
        es: {
          title: `Cupones y códigos promocionales de ${catName} | Ofertas verificadas | CouponChy`,
          description: `Descubre los últimos cupones, códigos promocionales y ofertas verificadas de la categoría ${catName} de las mejores marcas. Ahorra más en CouponChy.`
        },
        ar: {
          title: `كوبونات وأكواد خصم ${catName} | عروض موثقة | CouponChy`,
          description: `اكتشف أحدث كوبونات وأكواد خصم وعروض ${catName} الموثقة من أشهر الماركات. وفر أكثر مع الخصومات المتجددة باستمرار على CouponChy.`
        },
        nl: {
          title: `${catName} Kortingscodes & Aanbiedingen | Geverifieerde Deals | CouponChy`,
          description: `Ontdek de nieuwste geverifieerde ${catName} kortingscodes, coupons en exclusieve deals van topmerken. Bespaar meer met actuele kortingen op CouponChy.`
        },
        pl: {
          title: `Kody rabatowe i kupony ${catName} | Zweryfikowane oferty | CouponChy`,
          description: `Odkryj najnowsze zweryfikowane kody rabatowe, kupony i promocje w kategorii ${catName} od wiodących marek. Oszczędzaj więcej dzięki rabatom na CouponChy.`
        },
        it: {
          title: `Codici sconto e coupon ${catName} | Offerte verificate | CouponChy`,
          description: `Scopri i più recenti codici sconto, coupon e offerte verificate per la categoria ${catName} dei migliori marchi. Risparmia di più con sconti su CouponChy.`
        },
        ja: {
          title: `${catName} クーポン＆プロモーションコード | 確認済みセール | CouponChy`,
          description: `人気ブランドの最新の確認済み${catName}クーポン、プロモーションコード、限定セールをご覧ください。CouponChyで賢くショッピングしてお得に節約。`
        },
        pt: {
          title: `Cupons e códigos promocionais de ${catName} | Ofertas verificadas | CouponChy`,
          description: `Descubra os cupons, códigos promocionais e ofertas verificadas mais recentes da categoria ${catName} das principais marcas. Economize mais no CouponChy.`
        },
        sv: {
          title: `${catName} Rabattkoder & Erbjudanden | Verifierade deals | CouponChy`,
          description: `Hitta de senaste verifierade rabattkoderna, kupongerna och erbjudandena inom ${catName} från populära butiker. Spara mer med uppdaterade rabatter på CouponChy.`
        }
      };

      const selected = templates[lang] || templates.en;

      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://couponchy.com";
      const canonicalUrl = `${baseUrl}${countryCode ? `/${countryCode.toLowerCase()}` : ""}/stores?category=${categorySlug}`;

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
        hreflangs[l] = `${baseUrl}/${cc}/stores?category=${categorySlug}`;
      });
      hreflangs["x-default"] = `${baseUrl}/us/stores?category=${categorySlug}`;

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
  }

  // General Store Directory Metadata Fallback
  const directoryTitles = {
    en: "Store Directory | Verified Coupon Codes & Deals | CouponChy",
    de: "Geschäftsverzeichnis | Verifizierte Gutscheincodes | CouponChy",
    fr: "Annuaire des magasins | Codes de réduction vérifiés | CouponChy",
    es: "Directorio de tiendas | Códigos de descuento verificados | CouponChy",
    ar: "دليل المتاجر | أكواد خصم وعروض موثقة | CouponChy",
    nl: "Winkeloverzicht | Geverifieerde kortingscodes | CouponChy",
    pl: "Katalog sklepów | Zweryfikowane kody rabatowe | CouponChy",
    it: "Elenco dei negozi | Codici sconto verificati | CouponChy",
    ja: "ストア一覧 | 確認済みクーポンコード＆セール | CouponChy",
    pt: "Diretório de lojas | Códigos de desconto verificados | CouponChy",
    sv: "Butiksregister | Verifierade rabattkoder & deals | CouponChy"
  };

  const directoryDescriptions = {
    en: "Browse through our fully verified list of retail stores and online brands. Choose a merchant to discover the latest active coupons and deals at CouponChy.",
    de: "Durchsuchen Sie unsere verifizierte Liste von Geschäften und Online-Marken. Finden Sie die neuesten aktiven Gutscheine auf CouponChy.",
    fr: "Parcourez notre liste vérifiée de magasins et de marques en ligne. Découvrez les derniers coupons actifs sur CouponChy.",
    es: "Explore nuestra lista verificada de tiendas y marcas en línea. Descubra los cupones activos más recientes en CouponChy.",
    ar: "تصفح قائمتنا الموثقة للمتاجر والماركات الإلكترونية. وفر مع أحدث الكوبونات والعروض على CouponChy.",
    nl: "Blader door onze geverifieerde lijst van winkels en online merken. Vind de nieuwste actieve kortingscodes op CouponChy.",
    pl: "Przeglądaj naszą zweryfikowaną listę sklepów i marek online. Odkryj najnowsze aktywne kupony rabatowe na CouponChy.",
    it: "Sfoglia il nostro elenco verificato di negozi e marchi online. Trova i coupon più recenti e attivi su CouponChy.",
    ja: "確認済みのオンラインショップやブランドの一覧をご覧ください。CouponChyで最新の有効なクーポンやセールをチェック。",
    pt: "Explore nossa lista de marcas e lojas online verificadas. Descubra os cupons ativos mais recentes no CouponChy.",
    sv: "Sök i vårt register över verifierade butiker och varumärken online. Hitta de senaste aktiva rabattkoderna på CouponChy."
  };

  const title = directoryTitles[lang] || directoryTitles.en;
  const description = directoryDescriptions[lang] || directoryDescriptions.en;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://couponchy.com";
  const canonicalUrl = `${baseUrl}${countryCode ? `/${countryCode.toLowerCase()}` : ""}/stores`;

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
    hreflangs[l] = `${baseUrl}/${cc}/stores`;
  });
  hreflangs["x-default"] = `${baseUrl}/us/stores`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: hreflangs,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function Page({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const countryCode = await resolveRequestCountryCode();
  const directoryData = await getStoreDirectoryData(resolvedSearchParams?.search || "", countryCode);
  return <StorePage {...directoryData} countryCode={countryCode} />;
}
