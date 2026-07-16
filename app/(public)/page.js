import HomePage from "@/features/home/components/HomePage";
import { getHomePageData } from "@/server/services/catalog-service";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";
import { COUNTRY_TO_LANG } from "@/server/services/translation-service";
import { getSeoAlternates } from "@/server/services/seo-alternates";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const countryCode = await resolveRequestCountryCode();
  const lang = COUNTRY_TO_LANG[String(countryCode || "").toUpperCase()] || "en";

  const templates = {
    en: {
      title: "CouponChy | Verified Coupons, Promo Codes & Exclusive Deals",
      description: "Save more with verified coupons, promo codes, and exclusive deals from thousands of trusted brands. Discover the latest discounts updated daily at CouponChy."
    },
    de: {
      title: "CouponChy | Verifizierte Gutscheine, Rabattcodes & Angebote",
      description: "Sparen Sie mehr mit verifizierten Gutscheinen, Rabattcodes und exklusiven Angeboten von Tausenden vertrauenswürdigen Marken. Täglich neue Rabatte auf CouponChy."
    },
    fr: {
      title: "CouponChy | Coupons, codes promo et offres exclusives vérifiés",
      description: "Économisez plus avec des coupons, codes promo et offres exclusives vérifiés parmi des milliers de marques de confiance. Découvrez des réductions quotidiennes sur CouponChy."
    },
    es: {
      title: "CouponChy | Cupones, códigos promocionales y ofertas exclusivas verificadas",
      description: "Ahorra más con cupones, códigos promocionales y ofertas exclusivas verificadas de miles de marcas de confianza. Descuentos actualizados a diario en CouponChy."
    },
    ar: {
      title: "CouponChy | كوبونات وأكواد خصم موثقة وعروض حصريّة",
      description: "وفر أكثر مع كوبونات وأكواد خصم وعروض حصرية موثقة من آلاف الماركات الموثوقة. اكتشف أحدث الخصومات المحدثة يومياً على CouponChy."
    },
    nl: {
      title: "CouponChy | Geverifieerde kortingscodes, coupons & exclusieve deals",
      description: "Bespaar meer met geverifieerde kortingscodes, coupons en exclusieve aanbiedingen van duizenden betrouwbare merken. Ontdek dagelijkse nieuwe deals op CouponChy."
    },
    pl: {
      title: "CouponChy | Zweryfikowane kody rabatowe, kupony i promocje",
      description: "Oszczędzaj więcej dzięki zweryfikowanym kodom rabatowym, kuponom i wyjątkowym promocjom od tysięcy znanych marek. Sprawdź nowe rabaty każdego dnia na CouponChy."
    },
    it: {
      title: "CouponChy | Codici sconto, coupon e offerte esclusive verificate",
      description: "Risparmia di più con codici sconto, coupon e offerte esclusive verificate di migliaia di marchi affidabili. Scopri gli sconti aggiornati ogni giorno su CouponChy."
    },
    ja: {
      title: "CouponChy | 確認済みクーポン、プロモーションコード、限定セール",
      description: "数千の人気ブランドの確認済みクーポン、プロモーションコード、限定セールでお得にお買い物。CouponChyで毎日更新される最新の割引情報をチェック。"
    },
    pt: {
      title: "CouponChy | Cupons, códigos promocionais e ofertas exclusivas verificadas",
      description: "Economize mais com cupons, códigos promocionais e ofertas exclusivas verificadas de milhares de marcas confiáveis. Descubra os descontos atualizados diariamente no CouponChy."
    },
    sv: {
      title: "CouponChy | Verifierade rabattkoder, kuponger & exklusiva deals",
      description: "Spara mer med verifierade rabattkoder, kuponger och exklusiva erbjudanden från tusentals kända varumärken. Upptäck nya rabatter som uppdateras dagligen på CouponChy."
    }
  };

  const selected = templates[lang] || templates.en;
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://couponchy.com";
  const alternates = await getSeoAlternates("/", countryCode);

  return {
    title: selected.title,
    description: selected.description,
    alternates,
    openGraph: {
      title: selected.title,
      description: selected.description,
      url: alternates.canonical,
      type: "website",
      images: [
        {
          url: `${baseUrl}/images/og-home.jpg`,
          width: 1200,
          height: 630,
          alt: "CouponChy",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: selected.title,
      description: selected.description,
      images: [`${baseUrl}/images/og-home.jpg`],
    },
  };
}

export default async function Page() {
  const countryCode = await resolveRequestCountryCode();
  const homePageData = await getHomePageData(countryCode);
  return <HomePage {...homePageData} countryCode={countryCode} />;
}
