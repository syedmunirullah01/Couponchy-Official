import AboutPage from "@/features/about/components/AboutPage";
import { getAllStores } from "@/server/repositories/stores-repository";
import { getAllOffers } from "@/server/repositories/offers-repository";
import { getCompanyContent } from "@/server/repositories/company-repository";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";
import { COUNTRY_TO_LANG, getTranslatedAbout } from "@/server/services/translation-service";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const countryCode = await resolveRequestCountryCode();
  const lang = COUNTRY_TO_LANG[String(countryCode || "").toUpperCase()] || "en";

  const templates = {
    en: {
      title: "About CouponChy | Helping You Save with Verified Coupons & Deals",
      description: "Learn more about CouponChy, our mission, and how we help shoppers save money with verified coupons, promo codes, and exclusive deals from trusted brands."
    },
    de: {
      title: "Über CouponChy | Sparen mit verifizierten Gutscheinen & Angeboten",
      description: "Erfahren Sie mehr über CouponChy, unsere Mission und wie wir Käufern helfen, Geld mit verifizierten Gutscheinen, Rabattcodes und exklusiven Angeboten zu sparen."
    },
    fr: {
      title: "À propos de CouponChy | Vous aider à économiser avec des coupons vérifiés",
      description: "En savoir plus sur CouponChy, notre mission et comment nous aidons les acheteurs à économiser de l'argent grâce à des coupons, codes promo et offres exclusives."
    },
    es: {
      title: "Sobre CouponChy | Ahorra con cupones y ofertas verificadas",
      description: "Conozca más sobre CouponChy, nuestra misión y cómo ayudamos a los compradores a ahorrar dinero con cupones verificados, códigos promocionales y ofertas exclusivas."
    },
    ar: {
      title: "حول CouponChy | نساعدك على التوفير باستخدام كوبونات وعروض موثقة",
      description: "تعرف على المزيد حول CouponChy، ورسالتنا، وكيف نساعد المتسوقين على توفير المال باستخدام كوبونات وأكواد خصم وعروض حصرية موثقة من ماركات موثوقة."
    },
    nl: {
      title: "Over CouponChy | Bespaar met geverifieerde coupons & deals",
      description: "Lees meer over CouponChy, onze missie en hoe we shoppers helpen geld te besparen met geverifieerde kortingscodes, coupons en exclusieve deals."
    },
    pl: {
      title: "O CouponChy | Pomagamy oszczędzać dzięki zweryfikowanym kuponom",
      description: "Dowiedz się więcej o CouponChy, naszej misji i tym, jak pomagamy kupującym oszczędzać pieniądze dzięki zweryfikowanym kodom rabatowym i kuponom."
    },
    it: {
      title: "Chi siamo | CouponChy | Risparmia con coupon e offerte verificate",
      description: "Scopri di più su CouponChy, la nostra missione e come aiutiamo gli acquirenti a risparmiare con coupon verificati, codici sconto e offerte esclusive."
    },
    ja: {
      title: "CouponChyについて | 確認済みクーポン＆セールでお得な節約をサポート",
      description: "CouponChyのミッションや、確認済みクーポン、プロモーションコード、限定セールで買い物客が賢く節約できるよう支援する仕組みについてご紹介。"
    },
    pt: {
      title: "Sobre a CouponChy | Ajudando você a economizar com cupons verificados",
      description: "Saiba mais sobre a CouponChy, nossa missão e como ajudamos os compradores a economizar dinheiro com cupons verificados, códigos promocionales e ofertas exclusivas."
    },
    sv: {
      title: "Om CouponChy | Spara pengar med verifierade kuponger & deals",
      description: "Läs mer om CouponChy, vår mission och hur vi hjälper shoppare att spara pengar med verifierade rabattkoder, kuponger och exklusiva erbjudanden."
    }
  };

  const selected = templates[lang] || templates.en;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://couponchy.com";
  const canonicalUrl = `${baseUrl}${countryCode ? `/${countryCode.toLowerCase()}` : ""}/about`;

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
    hreflangs[l] = `${baseUrl}/${cc}/about`;
  });
  hreflangs["x-default"] = `${baseUrl}/us/about`;

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
  let totalStores = 0;
  let totalOffers = 0;
  let company = null;
  let t = null;

  try {
    const countryCode = await resolveRequestCountryCode();
    const lang = COUNTRY_TO_LANG[String(countryCode || "").toUpperCase()] || "en";

    const [stores, offers, companyContent] = await Promise.all([
      getAllStores(),
      getAllOffers(),
      getCompanyContent(),
    ]);
    totalStores = stores.length;
    totalOffers = offers.length;
    company = companyContent;
    t = await getTranslatedAbout(lang, companyContent.aboutUs || {});
  } catch {
    // fallback to defaults silently
  }

  return <AboutPage totalStores={totalStores} totalOffers={totalOffers} company={company} t={t} />;
}
