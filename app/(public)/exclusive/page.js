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
  return getMetadataDefaults("Exclusive");
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

function getOfferValue(offer) {
  const source = [offer.title, offer.description, offer.code].filter(Boolean).join(" ");
  const percentMatch = source.match(/(\d{1,3})\s*%/);

  if (percentMatch) {
    return `${percentMatch[1]}% off`;
  }

  // Currency extraction (e.g. $10, £20, €5, etc. or 15$)
  const currencyMatch = source.match(/(?:\$|£|€|¥|₹)\s*(\d{1,4})|(\d{1,4})\s*(?:\$|£|€|¥|₹|usd|gbp|eur)/i);
  if (currencyMatch) {
    if (currencyMatch[1]) {
      const symbol = source.match(/(\$|£|€|¥|₹)/)?.[1] || "$";
      return `${symbol}${currencyMatch[1]} off`;
    }
    if (currencyMatch[2]) {
      const symbol = source.match(/(\$|£|€|¥|₹|usd|gbp|eur)/i)?.[0] || "$";
      return `${currencyMatch[2]}${symbol.toUpperCase()} off`;
    }
  }

  // Digit flat off (e.g. "10 Off")
  const flatOffMatch = source.match(/(\d{1,3})\s*(?:off|discount)/i);
  if (flatOffMatch) {
    return `$${flatOffMatch[1]} off`;
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

  const rawExclusiveOffers = scopedOffers.filter(isExclusiveOffer).map((o) => ({
    ...o,
    extractedValue: getOfferValue(o),
  }));

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
