import { getAllOffers } from "@/server/repositories/offers-repository";
import { getAllStores } from "@/server/repositories/stores-repository";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";
import { normalizeCountryCode, buildCountryPath } from "@/lib/countries";
import { getMetadataDefaults } from "@/server/services/settings-service";
import {
  getTranslatedOffers,
  getTranslatedStores,
  getTranslatedExclusiveUI,
  COUNTRY_TO_LANG,
} from "@/server/services/translation-service";
import ExclusiveClientPage from "./ExclusiveClientPage";

export async function generateMetadata() {
  const countryCode = await resolveRequestCountryCode();
  const lang = COUNTRY_TO_LANG[String(countryCode || "").toUpperCase()] || "en";

  const titles = {
    en: "Exclusive Deals & Verified Discounts | CouponChy",
    de: "Exklusive Angebote & Geprüfte Rabatte | CouponChy",
    fr: "Offres exclusives et réductions vérifiées | CouponChy",
    nl: "Exclusieve Aanbiedingen & Geverifieerde Kortingen | CouponChy",
    pl: "Ekskluzywne oferty i zweryfikowane rabaty | CouponChy",
    it: "Offerte esclusive e sconti verificati | CouponChy",
    es: "Ofertas exclusivas y descuentos verificados | CouponChy",
    ar: "عروض حصريّة وخصومات موثقة | CouponChy",
    ja: "限定セール＆確認済み割引 | CouponChy",
    pt: "Ofertas exclusivas e descontos verificados | CouponChy",
    sv: "Exklusiva erbjudanden & verifierade rabatter | CouponChy"
  };

  const descriptions = {
    en: "Discover exclusive deals, verified discounts, limited-time offers, and hand-picked savings from trusted brands. Save more every day with CouponChy.",
    de: "Entdecken Sie exklusive Angebote, geprüfte Rabatte, zeitlich begrenzte Aktionen und handverlesene Schnäppchen von Top-Marken. Sparen Sie täglich mehr mit CouponChy.",
    fr: "Découvrez des offres exclusives, des réductions vérifiées, des promotions à durée limitée et des économies triées sur le volet auprès de marques de confiance. Économisez chaque jour avec CouponChy.",
    nl: "Ontdek exclusieve deals, geverifieerde kortingen, tijdelijke aanbiedingen en handverkozen besparingen van betrouwbare merken. Bespaar elke dag meer met CouponChy.",
    pl: "Odkryj ekskluzywne oferty, zweryfikowane rabaty, promocje ograniczone czasowo i starannie dobrane oszczędności od zaufanych marek. Oszczędzaj więcej każdego dnia z CouponChy.",
    it: "Scopri offerte esclusive, sconti verificati, promozioni a tempo limitato e risparmi selezionati dei migliori marchi. Risparmia ogni giorno di più con CouponChy.",
    es: "Descubra ofertas exclusivas, descuentos verificados, promociones de tiempo limitado y ahorros seleccionados de marcas de confianza. Ahorre más cada día con CouponChy.",
    ar: "اكتشف عروضًا حصريّة، وخصومات موثقة، وتخفيضات محدودة الوقت، ومدخرات منتقاة بعناية من ماركات موثوقة. وفر أكثر كل يوم مع CouponChy.",
    ja: "信頼できるブランドからの限定セール、確認済み割引、期間限定オファー、厳選されたお得な情報をご覧ください。CouponChyで毎日もっと節約。",
    pt: "Descubra ofertas exclusivas, descontos verificados, promoções de tempo limitado e economias selecionadas de marcas confiáveis. Economize mais todos os dias com CouponChy.",
    sv: "Hitta exklusiva erbjudanden, verifierade rabatter, tidsbegränsade kampanjer och handplockade besparingar från populära butiker. Spara mer varje dag med CouponChy."
  };

  const title = titles[lang] || titles.en;
  const description = descriptions[lang] || descriptions.en;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://couponchy.com";
  const segment = countryCode && countryCode.toUpperCase() !== "US" ? `/${countryCode.toLowerCase()}` : "";
  const canonicalUrl = `${baseUrl}${segment}/exclusive`;

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
    const pathSeg = cc === "us" ? "" : `/${cc}`;
    hreflangs[l] = `${baseUrl}${pathSeg}/exclusive`;
  });
  hreflangs["x-default"] = `${baseUrl}/exclusive`;

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

export const dynamic = "force-dynamic";

function isExclusiveOffer(offer) {
  const isActive = String(offer.status || "").trim().toLowerCase() === "active";
  const searchableText = [offer.title, offer.description, offer.code, offer.source, offer.status]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return isActive && searchableText.includes("exclusive");
}

const COUNTRY_CURRENCY_MAP = {
  US: "$",
  GB: "£",
  CA: "$",
  AU: "$",
  IN: "₹",
  DE: "€",
  FR: "€",
  IT: "€",
  ES: "€",
  NL: "€",
  BE: "€",
  AE: "AED",
  SA: "SAR",
  PL: "zł",
  PK: "Rs",
};

function getOfferValue(offer, countryCode = "US") {
  const defaultSymbol = COUNTRY_CURRENCY_MAP[String(countryCode).toUpperCase()] || "$";
  const title = offer.title || "";
  const description = offer.description || "";
  const combined = `${title} ${description}`.toLowerCase();

  // Multi-lingual Free Shipping detection
  const isFreeShipping =
    combined.includes("free shipping") ||
    combined.includes("free delivery") ||
    combined.includes("kostenloser versand") ||
    combined.includes("kostenlose lieferung") ||
    combined.includes("livraison gratuite") ||
    combined.includes("envoi gratuit") ||
    combined.includes("envío gratis") ||
    combined.includes("entrega gratis") ||
    combined.includes("darmowa dostawa") ||
    combined.includes("darmowa wysyłka") ||
    combined.includes("gratis verzending") ||
    combined.includes("gratis bezorging") ||
    combined.includes("spedizione gratuita") ||
    combined.includes("consegna gratuita");

  if (isFreeShipping) {
    if (combined.includes("versand") || combined.includes("lieferung")) return "Gratis Versand";
    if (combined.includes("livraison") || combined.includes("envoi")) return "Livraison Gratuite";
    if (combined.includes("envío") || combined.includes("entrega")) return "Envío Gratis";
    if (combined.includes("dostawa") || combined.includes("wysyłka")) return "Darmowa Dostawa";
    if (combined.includes("spedizione") || combined.includes("consegna")) return "Spedizione Gratis";
    return "Free Shipping";
  }

  // Price decimals indicate pricing, not discount (e.g. $19.99, Rs. 499.00)
  const hasDecimals = /(?:\$|£|€|¥|₹|zł|د\.إ|SR|TL|Rs\.?)\s*\d+\.\d{2}|\d+\.\d{2}\s*(?:\$|£|€|¥|₹|zł|د\.إ|SR|TL|Rs\.?|usd|gbp|eur|pkr)/i.test(combined);

  // If the offer is an entry-level price point (e.g. "Starting from $50" or "As low as $1,950"),
  // do not show a discount badge. Show the store name instead.
  const isStartingPrice =
    combined.includes("as low as") ||
    combined.includes("starting for") ||
    combined.includes("starting at") ||
    combined.includes("starts at") ||
    combined.includes("starts from") ||
    combined.includes("low price") ||
    /\bfrom\s*(?:\$|£|€|¥|₹|zł|Rs)/i.test(combined) ||
    /\bstarting\s*(?:\$|£|€|¥|₹|zł|Rs)/i.test(combined) ||
    /\bfor\s*(?:\$|£|€|¥|₹|zł|Rs)\s*\d+/i.test(combined) ||
    /\bjust\s*(?:\$|£|€|¥|₹|zł|Rs)\s*\d+/i.test(combined) ||
    /\bonly\s*(?:\$|£|€|¥|₹|zł|Rs)\s*\d+/i.test(combined) ||
    /(?:\$|£|€|¥|₹|zł|Rs)\s*\d+\s+for\b/i.test(combined) ||
    hasDecimals;

  if (isStartingPrice) {
    return offer.storeName || "Hot deal";
  }

  const source = [offer.title, offer.description, offer.code].filter(Boolean).join(" ");
  const percentMatch = source.match(/(\d{1,3})\s*%/);

  if (percentMatch) {
    return `${percentMatch[1]}% off`;
  }

  // Currency extraction (e.g. $10, £20, €5, Rs 500, etc. or 15$)
  const currencyRegex = /(?:\$|£|€|¥|₹|zł|د\.إ|SR|TL|Rs\.?)\s*(\d{1,4})|(\d{1,4})\s*(?:\$|£|€|¥|₹|zł|د\.إ|SR|TL|Rs\.?|\busd\b|\bgbp\b|\beur\b|\bpkr\b|\baed\b|\bsar\b|\bcad\b|\baud\b|\binr\b|\bpln\b|\btry\b)/i;
  const currencyMatch = source.match(currencyRegex);
  if (currencyMatch) {
    const matchedText = currencyMatch[0];
    if (currencyMatch[1]) {
      const symbol = matchedText.match(/(\$|£|€|¥|₹|zł|د\.إ|SR|TL|Rs\.?)/i)?.[1] || defaultSymbol;
      return `${symbol}${currencyMatch[1]} off`;
    }
    if (currencyMatch[2]) {
      const symbol = matchedText.match(/(\$|£|€|¥|₹|zł|د\.إ|SR|TL|Rs\.?|\busd\b|\bgbp\b|\beur\b|\bpkr\b|\baed\b|\bsar\b|\bcad\b|\baud\b|\binr\b|\bpln\b|\btry\b)/i)?.[0] || defaultSymbol;
      return `${currencyMatch[2]}${symbol.toUpperCase()} off`;
    }
  }

  // Digit flat off (e.g. "10 Off")
  const flatOffMatch = source.match(/(\d{1,3})\s*(?:off|discount)/i);
  if (flatOffMatch) {
    return `${defaultSymbol}${flatOffMatch[1]} off`;
  }

  if (offer.type === "Deal") {
    return "Hot deal";
  }

  // Fallback
  return "Exclusive code";
}

export default async function ExclusivePage() {
  const countryCode = await resolveRequestCountryCode();
  const [offers, stores] = await Promise.all([getAllOffers(), getAllStores()]);
  const scopedStores = stores.filter((store) => normalizeCountryCode(store.countryCode) === countryCode);
  const allowedStoreSlugs = new Set(scopedStores.map((store) => store.slug));
  const scopedOffers = offers.filter((offer) => allowedStoreSlugs.has(offer.storeSlug));

  const rawExclusiveOffers = scopedOffers.filter(isExclusiveOffer).map((o) => {
    const store = scopedStores.find((s) => s.slug === o.storeSlug);
    return {
      ...o,
      extractedValue: getOfferValue(o, store?.countryCode),
    };
  });

  const rawRelatedStores = scopedStores
    .filter((store) => rawExclusiveOffers.some((offer) => offer.storeSlug === store.slug))
    .map((store) => ({
      ...store,
      exclusiveCount: rawExclusiveOffers.filter((offer) => offer.storeSlug === store.slug).length,
      href: buildCountryPath(`/stores/${store.categorySlug}/${store.slug}`, countryCode),
    }))
    .sort((a, b) => b.exclusiveCount - a.exclusiveCount || a.name.localeCompare(b.name));

  const lang = COUNTRY_TO_LANG[String(countryCode || "").toUpperCase()] || "en";

  const [exclusiveOffers, relatedStores, t] = await Promise.all([
    getTranslatedOffers(rawExclusiveOffers, lang),
    getTranslatedStores(rawRelatedStores, lang),
    getTranslatedExclusiveUI(lang),
  ]);

  return (
    <ExclusiveClientPage
      exclusiveOffers={exclusiveOffers}
      relatedStores={relatedStores}
      t={t}
      countryCode={countryCode}
    />
  );
}
