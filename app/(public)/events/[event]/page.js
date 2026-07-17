import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { buildCountryPath } from "@/lib/countries";
import { getAllOffers } from "@/server/repositories/offers-repository";
import { getAllStores } from "@/server/repositories/stores-repository";
import { getEventBySlug } from "@/server/repositories/events-repository";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";
import { getMetadataDefaults } from "@/server/services/settings-service";
import { getSeoAlternates } from "@/server/services/seo-alternates";
import { normalizeCountryCode } from "@/lib/countries";
import {
  getTranslatedEvent,
  getTranslatedEventUI,
  getTranslatedOffers,
  getTranslatedStores,
  COUNTRY_TO_LANG
} from "@/server/services/translation-service";

export const dynamic = "force-dynamic";

function normalizeEventSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatEventName(slug) {
  return normalizeEventSlug(slug)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isEventOffer(offer, keyword) {
  const isActive = String(offer.status || "").trim().toLowerCase() === "active";
  const searchableText = [offer.title, offer.description, offer.code, offer.source, offer.status]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return isActive && searchableText.includes(String(keyword || "").trim().toLowerCase());
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

function getOfferValue(offer, eventName, countryCode = "US") {
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
    combined.includes("à partir de") ||
    /\bfor\s*(?:\$|£|€|¥|₹|zł|Rs)\s*\d+/i.test(combined) ||
    /\bjust\s*(?:\$|£|€|¥|₹|zł|Rs)\s*\d+/i.test(combined) ||
    /\bonly\s*(?:\$|£|€|¥|₹|zł|Rs)\s*\d+/i.test(combined) ||
    /(?:\$|£|€|¥|₹|zł|Rs)\s*\d+\s+for\b/i.test(combined) ||
    // Prepositions meaning "from" or "starting" followed by price/digits (multi-lingual)
    /\b(ab|von|od|da|desde|vanaf|from|starting|starts)\s*(?:nur|only|just|at|for|to|a|à)?\s*(?:\$|£|€|¥|₹|zł|Rs|\d)/i.test(combined) ||
    hasDecimals;

  if (isStartingPrice) {
    return offer.storeName || `${eventName} deal`;
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

  return `${eventName} code`;
}

function getOfferMetaLabel(offer) {
  if (offer.status?.toLowerCase().includes("verified")) {
    return "Verified";
  }

  if (offer.type === "Deal") {
    return "Unlocked";
  }

  return "Official";
}

function getHeroAccent() {
  return "bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.12),transparent_35%)] bg-[#0c0a0f] border-[var(--color-primary)]/20";
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const countryCode = await resolveRequestCountryCode();
  const lang = COUNTRY_TO_LANG[String(countryCode || "").toUpperCase()] || "en";
  const event = await getEventBySlug(resolvedParams?.event);
  const translatedEvent = await getTranslatedEvent(event, lang);
  const eventName = translatedEvent?.name || formatEventName(resolvedParams?.event || "Event");

  const titles = {
    en: `${eventName} Deals, Coupons & Offers | CouponChy`,
    de: `${eventName} Angebote, Gutscheine & Deals | CouponChy`,
    fr: `Offres, coupons et réductions ${eventName} | CouponChy`,
    nl: `${eventName} Aanbiedingen, Coupons & Deals | CouponChy`,
    pl: `Oferty, kupony i promocje ${eventName} | CouponChy`,
    it: `Offerte, coupon e sconti ${eventName} | CouponChy`,
    es: `Ofertas, cupones y descuentos ${eventName} | CouponChy`,
    ar: `عروض وكوبونات ${eventName} | CouponChy`,
    ja: `${eventName} セール、クーポン＆オファー | CouponChy`,
    pt: `Ofertas, cupons e descontos ${eventName} | CouponChy`,
    sv: `${eventName} erbjudanden, kuponger & deals | CouponChy`
  };

  const descriptions = {
    en: `Find the latest ${eventName} deals, verified coupons, promo codes, and exclusive discounts from top brands. Save more with regularly updated offers on CouponChy.`,
    de: `Finden Sie die neuesten ${eventName} Angebote, verifizierten Gutscheine, Rabattcodes und exklusiven Rabatte von Top-Marken. Sparen Sie mehr mit regelmäßig aktualisierten Angeboten auf CouponChy.`,
    fr: `Retrouvez les dernières offres, coupons vérifiés, codes promo et réductions exclusives pour ${eventName} auprès des meilleures marques. Économisez plus avec des offres régulièrement mises à jour sur CouponChy.`,
    nl: `Vind de nieuwste ${eventName} deals, geverifieerde kortingscodes, coupons en exclusieve kortingen van topmerken. Bespaar meer met regelmatig bijgewerkte aanbiedingen op CouponChy.`,
    pl: `Znajdź najnowsze oferty, zweryfikowane kupony, kody rabatowe i ekskluzywne zniżki na ${eventName} od najlepszych marek. Oszczędzaj więcej dzięki regularnie aktualizowanym promocjom na CouponChy.`,
    it: `Trova le ultime offerte, i coupon verificati, i codici promozionali e gli sconti esclusivi per ${eventName} dei migliori marchi. Risparmia di più con offerte aggiornate regolarmente su CouponChy.`,
    es: `Encuentre las últimas ofertas de ${eventName}, cupones verificados, códigos promocionales y descuentos exclusivos de las principales marcas. Ahorre más con ofertas actualizadas regularmente en CouponChy.`,
    ar: `احصل على أحدث عروض وكوبونات وأكواد خصم ${eventName} الموثقة والتخفيضات الحصرية من أشهر الماركات. وفر أكثر مع العروض المتجددة باستمرار على CouponChy.`,
    ja: `最新の${eventName}セール、確認済みクーポン、プロモーションコード、人気ブランドの限定割引をご覧ください。CouponChyで定期的に更新されるオファーでお得に節約。`,
    pt: `Encontre as melhores ofertas de ${eventName}, cupons verificados, códigos promocionais e descontos exclusivos das principais marcas. Economize mais com ofertas atualizadas regularmente no CouponChy.`,
    sv: `Hitta de senaste ${eventName}-erbjudandena, verifierade kupongerna, rabattkoderna och exklusiva rabatterna från populära varumärken. Spara mer med uppdaterade deals på CouponChy.`
  };

  const title = titles[lang] || titles.en;
  const description = descriptions[lang] || descriptions.en;
  const alternates = await getSeoAlternates(`/events/${resolvedParams?.event}`, countryCode);

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: alternates.canonical,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function EventPage({ params }) {
  const resolvedParams = await params;
  const eventSlug = normalizeEventSlug(resolvedParams?.event);
  const eventConfig = await getEventBySlug(eventSlug);
  const countryCode = await resolveRequestCountryCode();
  const currentCountry = String(countryCode || "US").toUpperCase();

  if (eventConfig) {
    const eventCountry = String(eventConfig.countryCode || "GLOBAL").toUpperCase();
    if (eventCountry !== "GLOBAL" && eventCountry !== currentCountry) {
      notFound();
    }
  }

  const lang = COUNTRY_TO_LANG[String(countryCode || "").toUpperCase()] || "en";

  const [translatedEvent, translatedUI] = await Promise.all([
    getTranslatedEvent(eventConfig, lang),
    getTranslatedEventUI(lang),
  ]);

  const t = translatedUI;
  const eventName = translatedEvent?.name || formatEventName(eventSlug || "event");
  const eventKeyword = String(translatedEvent?.keyword || eventConfig?.keyword || eventSlug).trim().toLowerCase();

  const [offers, stores] = await Promise.all([getAllOffers(), getAllStores()]);
  const scopedStores = stores.filter((store) => normalizeCountryCode(store.countryCode) === countryCode);
  const allowedStoreSlugs = new Set(scopedStores.map((store) => store.slug));
  const scopedOffers = offers.filter((offer) => allowedStoreSlugs.has(offer.storeSlug));
  const eventOffers = scopedOffers.filter((offer) => isEventOffer(offer, eventKeyword));
  
  const relatedStores = scopedStores
    .filter((store) => eventOffers.some((offer) => offer.storeSlug === store.slug))
    .map((store) => ({
      ...store,
      eventCount: eventOffers.filter((offer) => offer.storeSlug === store.slug).length,
      href: buildCountryPath(`/stores/${store.categorySlug}/${store.slug}`, countryCode),
    }))
    .sort((a, b) => b.eventCount - a.eventCount || a.name.localeCompare(b.name));

  const [translatedOffers, translatedStores] = await Promise.all([
    getTranslatedOffers(eventOffers, lang),
    getTranslatedStores(relatedStores, lang),
  ]);

  const displayOffers = translatedOffers;
  const displayStores = translatedStores;

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <section className={`relative overflow-hidden rounded-[32px] border p-6 sm:p-10 lg:p-12 shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl ${getHeroAccent(eventSlug)}`}>
        {/* Glow orb */}
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[var(--color-primary)]/10 blur-[80px] pointer-events-none" />
        
        {/* Right side floating glass illustration (Experience level design) */}
        <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2 w-[280px] h-[180px] pointer-events-none select-none">
          <div className="relative w-full h-full">
            {/* Layer 1: Glowing orb behind */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-primary-hover)] rounded-2xl opacity-15 blur-xl" />
            
            {/* Layer 2: Floating Coupon card */}
            <div className="absolute right-4 top-2 w-[200px] h-[110px] rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-4 rotate-6 shadow-[0_20px_40px_rgba(139,92,246,0.25)]">
              <div className="flex items-center gap-1.5">
                <span className="flex h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                <span className="text-[7.5px] font-black uppercase tracking-wider text-[var(--color-primary)]">Verified Code</span>
              </div>
              <div className="mt-2.5 text-lg font-black text-white tracking-wider">SAVE50</div>
              <div className="mt-0.5 text-[8.5px] font-semibold text-white/40">Exclusive Discount</div>
              <div className="mt-3 pt-1.5 border-t border-white/5 flex items-center justify-between">
                <span className="text-[7.5px] font-bold text-white/30">EXP: 24H</span>
                <span className="text-[7.5px] font-bold text-[var(--color-primary)]">COUPONCHY</span>
              </div>
            </div>

            {/* Layer 3: Second overlapping floating card */}
            <div className="absolute left-2 bottom-1 w-[180px] h-[95px] rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-3.5 -rotate-6 shadow-[0_20px_40px_rgba(139,92,246,0.25)]">
              <div className="text-[7.5px] font-black uppercase tracking-wider text-[var(--color-primary)]">Special Promo</div>
              <div className="mt-1 text-[13px] font-black text-white tracking-tight">UP TO 50% OFF</div>
              <div className="mt-2.5 pt-1.5 border-t border-white/5 flex items-center justify-between">
                <span className="text-[7.5px] font-semibold text-white/30">Active Deals</span>
                <div className="flex -space-x-1.5">
                  <div className="h-4 w-4 rounded-full bg-[var(--color-primary)] border border-black/30 text-[6.5px] flex items-center justify-center font-black text-white">50%</div>
                  <div className="h-4 w-4 rounded-full bg-[var(--color-primary-hover)] border border-black/30 text-[6.5px] flex items-center justify-center font-black text-white">25%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-2xl lg:max-w-[640px]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] shadow-[0_0_15px_rgba(139,92,246,0.1)]">
            {t.eventSpotlight || "Event Spotlight"}
          </span>
          <h1 className="mt-4 text-[28px] sm:text-4xl lg:text-[54px] font-black tracking-[-0.04em] leading-[1.12] text-white">
            {t.bestPrefix || "Best"} {eventName}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] drop-shadow-[0_0_15px_rgba(139,92,246,0.2)]">
              {t.couponsAndDealsToday || "Coupons & Deals Today"}
            </span>
          </h1>
          <p className="mt-4 text-xs sm:text-base leading-6 sm:leading-7 text-[var(--muted)]/90">
            {translatedEvent?.shortDescription || t.defaultShortDesc?.replace("{eventName}", eventName) || `Discover active ${eventName.toLowerCase()} offers, coupon codes, and timely savings from featured stores in one place.`}
          </p>
          <div className="mt-6 flex flex-row flex-wrap gap-2.5 sm:gap-4">
            <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] backdrop-blur-md px-3.5 py-1.5 sm:px-4.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-white/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--color-primary)] stroke-current" fill="none" strokeWidth="2.5">
                <path d="M12.5 2H2v10.5L12.5 23H23L12.5 2Z" />
                <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
              </svg>
              <span>
                <span className="inline sm:hidden">{displayOffers.length} {t.offersLabel || "Offers"}</span>
                <span className="hidden sm:inline">{displayOffers.length} {eventName} {t.offersLabel || "Offers"}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] backdrop-blur-md px-3.5 py-1.5 sm:px-4.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-white/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--color-primary)] stroke-current" fill="none" strokeWidth="2.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>
                <span className="inline sm:hidden">{displayStores.length} {t.storesLabel || "Stores"}</span>
                <span className="hidden sm:inline">{displayStores.length} {t.relatedStores || "Related Stores"}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[290px_minmax(0,1fr)]">
        {/* Sidebar / Aside - render second on mobile, first on desktop */}
        <aside className="order-2 xl:order-1 xl:sticky xl:top-24 xl:self-start">
          <Card className="rounded-[28px] border-white/10 bg-white/[0.01] backdrop-blur-md shadow-2xl p-5">
            <CardHeader className="border-b border-white/5 pb-4.5 px-0 pt-0">
              <CardTitle className="text-lg font-black text-white/95">{t.relatedStores || "Related Stores"}</CardTitle>
              <CardDescription className="text-xs text-[var(--muted)]/60 leading-normal mt-1">{t.relatedStoresDesc?.replace("{eventName}", eventName.toLowerCase()) || `Stores currently featuring live ${eventName.toLowerCase()} offers.`}</CardDescription>
            </CardHeader>
            <CardContent className="mt-5 p-0 max-h-[480px] overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-1 gap-3">
              {displayStores.length ? (
                displayStores.map((store) => (
                  <Link
                    key={store.slug}
                    href={store.href}
                    className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/30 hover:bg-white/[0.05] hover:shadow-[0_12px_28px_rgba(0,0,0,0.24)]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-sm text-white/90 transition group-hover:text-white">{store.name}</p>
                      <p className="mt-0.5 truncate text-[11px] text-[var(--muted)]/50">{store.category || "Store"}</p>
                    </div>
                    <span className="flex-shrink-0 h-6 px-2.5 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 flex items-center justify-center text-[10px] font-black tracking-wider text-[var(--color-primary)]">
                      {store.eventCount}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="col-span-full rounded-2xl border border-dashed border-white/5 bg-white/[0.01] p-4 text-center text-xs text-[var(--muted)]/50 italic">
                  {t.noRelatedStores || "No related stores found."}
                </div>
              )}
            </CardContent>
          </Card>
        </aside>

        {/* Offers List - render first on mobile */}
        <div className="order-1 xl:order-2">
          {displayOffers.length ? (
            <div className="grid gap-4.5">
              {displayOffers.map((offer) => {
                const matchedStore = displayStores.find((store) => store.slug === offer.storeSlug);
                const storeHref = matchedStore?.href || "#";
                const offerValue = getOfferValue(offer, eventName, matchedStore?.countryCode);
                const offerMeta = offer.status?.toLowerCase().includes("verified") ? (t.verified || "Verified") : (offer.type === "Deal" ? (t.unlocked || "Unlocked") : (t.official || "Official"));

                return (
                  <Card
                    key={offer.id}
                    className="group overflow-hidden rounded-[28px] border-white/10 bg-white/[0.01] backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-[var(--color-primary)]/30 hover:bg-white/[0.03] hover:shadow-[0_20px_50px_rgba(139,92,246,0.04)]"
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col lg:grid lg:items-stretch lg:grid-cols-[170px_minmax(0,1fr)_220px]">
                        {/* Discount Badge */}
                        <div className="relative overflow-hidden flex flex-row lg:flex-col items-center justify-between lg:justify-center border-b lg:border-b-0 lg:border-r border-white/10 bg-white/[0.01] px-5 py-3.5 lg:px-6 lg:py-6.5 lg:w-[170px] lg:flex-shrink-0">
                          {/* Accent background mesh */}
                          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent pointer-events-none" />
                          <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)]">{t.discount || "Discount"}</span>
                          <div className="relative z-10 text-2xl lg:text-4xl sm:text-[42px] font-black leading-none tracking-[-0.05em] text-white bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70 lg:mt-2.5">
                            {offerValue.replace(" off", "")}
                          </div>
                          <span className="relative z-10 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 lg:mt-1.5">
                            {offerValue.toLowerCase().includes("off") ? (t.off || "OFF") : (t.deal || offer.type)}
                          </span>
                        </div>

                        {/* Middle Content Section */}
                        <div className="border-b lg:border-b-0 lg:border-r border-white/10 px-5 py-5 lg:px-6.5 lg:py-6.5 flex flex-col justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="border-white/10 text-white/60 bg-white/[0.02] text-[10px] font-semibold tracking-wider">
                                {offer.type}
                              </Badge>
                              <span className="rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-3 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)]">
                                {eventName}
                              </span>
                            </div>

                            <h2 className="mt-3 text-[20px] sm:text-[24px] lg:text-[28px] font-black leading-[1.15] tracking-[-0.03em] text-white group-hover:text-[var(--color-primary-hover)] transition-colors duration-200">
                              {offer.title}
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-[var(--muted)]/80">
                              {offer.description || (t.noDescYet || "No description added yet.")}
                            </p>
                          </div>

                          <div className="mt-5 flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]/50">
                            <span className="inline-flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                              <span className="text-white/80">{offerMeta}</span>
                            </span>
                            <span className="inline-flex items-center gap-2">
                              {matchedStore?.logoImage ? (
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white p-1 border border-white/10 overflow-hidden relative">
                                  <Image
                                    src={matchedStore.logoImage}
                                    alt=""
                                    fill
                                    sizes="40px"
                                    unoptimized={matchedStore.logoImage && !matchedStore.logoImage.includes("supabase.co") && !matchedStore.logoImage.startsWith("/")}
                                    className="object-contain p-1"
                                  />
                                </span>
                              ) : (
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/30 overflow-hidden">
                                  <span className="text-[12px] font-black text-[var(--color-primary)]">
                                    {(offer.storeName || "ST").slice(0, 2).toUpperCase()}
                                  </span>
                                </span>
                              )}
                              <span className="text-white/60">{offer.storeName}</span>
                            </span>
                          </div>
                        </div>

                        {/* CTA Action Section */}
                        <div className="flex items-center justify-center px-5 py-4 lg:px-4 lg:py-6.5 lg:w-[220px] lg:flex-shrink-0">
                          <Link
                            href={storeHref}
                            className="group/cta flex items-center justify-center gap-2.5 w-full lg:max-w-[240px] h-12 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-black uppercase tracking-[0.1em] whitespace-nowrap shadow-lg shadow-[var(--color-primary)]/20 hover:shadow-[var(--color-primary)]/40 hover:-translate-y-0.5 transition-all duration-200 active:scale-95 border border-[var(--color-primary-hover)]/20"
                          >
                            <span>{offer.code ? (t.revealCode || "Reveal Code") : (offer.ctaLabel || t.getDeal || "Get Deal")}</span>
                            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 transition-transform duration-300 group-hover/cta:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M5 12h14" />
                              <path d="m13 6 6 6-6 6" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="rounded-[28px] border-dashed p-8 text-center">
              <p className="text-lg font-semibold text-[var(--text)]">{t.noOffersYetTitle?.replace("{eventName}", eventName) || `No ${eventName.toLowerCase()} offers yet`}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {translatedEvent?.longDescription || t.defaultLongDesc?.replace("{eventName}", eventName) || `Fresh ${eventName.toLowerCase()} deals and coupon codes will appear here as soon as matching offers are available.`}
              </p>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
