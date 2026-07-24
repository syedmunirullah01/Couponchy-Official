import "server-only";

import { getAllOffers, getOffersByStoreSlug } from "@/server/repositories/offers-repository";
import { getAllProducts, getProductByStoreAndSlug, getProductsByStoreSlug } from "@/server/repositories/products-repository";
import { getSettings } from "@/server/repositories/settings-repository";
import { getAllStores, getStoreBySlug } from "@/server/repositories/stores-repository";
import { getAllCategories } from "@/server/repositories/categories-repository";
import { normalizeCountryCode } from "@/lib/countries";
import { generateStoreContent, generateStoreAboutDescription } from "@/lib/store-seo-templates";
import { replaceDynamicDatePlaceholders, getLocalizedMonthYear } from "@/lib/date-replacer";
import {
  COUNTRY_TO_LANG,
  getTranslatedSettings,
  getTranslatedCategories,
  getTranslatedOffers,
  getTranslatedStore,
  getTranslatedStoreDetail,
  getTranslatedTrendingStores,
  getTranslatedStoreDirectory,
  getTranslatedHowItWorks,
  getTranslatedFeaturedCoupons,
  getTranslatedHero,
  getTranslatedMarquee,
} from "@/server/services/translation-service";


function buildStoreDirectoryRecord(store) {
  const label = `${store.offersCount} ${store.offersCount === 1 ? "Active Offer" : "Active Offers"}`;

  return {
    ...store,
    count: label,
  };
}

function orderItemsBySelection(items, selectedIds, getId) {
  const itemMap = new Map(items.map((item) => [getId(item), item]));
  return selectedIds.map((id) => itemMap.get(id)).filter(Boolean);
}

function buildStoreDetail(store, offers, allStores) {
  const activeCoupons = offers.filter((offer) => offer.type === "Coupon").length;
  const activeDeals = offers.filter((offer) => offer.type === "Deal").length;

  // ── Generate SEO content via 4-template engine ──────────────────────────
  // Admin-entered content always takes priority; generated content is fallback.
  const generated = generateStoreContent(store, offers);
  const aboutText = store.aboutText?.trim() || generateStoreAboutDescription(store, offers);

  // Admin why-items (from textarea, one per line)
  const customWhyItems = String(store.contentWhyItemsText || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  // Admin FAQs
  const customFaqs = [
    { question: store.faq1Question, answer: store.faq1Answer },
    { question: store.faq2Question, answer: store.faq2Answer },
    { question: store.faq3Question, answer: store.faq3Answer },
    { question: store.faq4Question, answer: store.faq4Answer },
    { question: store.faq5Question, answer: store.faq5Answer },
  ].filter((item) => item.question?.trim() && item.answer?.trim());

  // Resolve intro paragraphs:
  // If admin filled paragraph 1 or 2, respect those; otherwise use generated.
  const adminPara1 = store.contentIntroParagraph1?.trim();
  const adminPara2 = store.contentIntroParagraph2?.trim();
  const hasAdminIntro = !!(adminPara1 || adminPara2);

  const introParagraphs = hasAdminIntro
    ? [adminPara1, adminPara2].filter(Boolean)
    : generated.introParagraphs;

  const cc = store.countryCode;
  const resolvedAboutText = replaceDynamicDatePlaceholders(aboutText, cc);
  const rawIntroTitle = store.contentIntroTitle?.trim() || generated.introTitle;
  const resolvedIntroTitle = replaceDynamicDatePlaceholders(rawIntroTitle, cc);
  const resolvedIntroParagraphs = introParagraphs.map((p) => replaceDynamicDatePlaceholders(p, cc));
  const rawWhyItems = customWhyItems.length ? customWhyItems : generated.whyItems;
  const resolvedWhyItems = rawWhyItems.map((item) => replaceDynamicDatePlaceholders(item, cc));
  const rawOutro = store.contentOutro?.trim() || generated.outro;
  const resolvedOutro = replaceDynamicDatePlaceholders(rawOutro, cc);
  const rawFaqs = customFaqs.length ? customFaqs : generated.faqs;
  const resolvedFaqs = rawFaqs.map((faq) => ({
    question: replaceDynamicDatePlaceholders(faq.question, cc),
    answer: replaceDynamicDatePlaceholders(faq.answer, cc),
  }));

  return {
    aboutText: resolvedAboutText,
    singleStore: {
      ...store,
      title: `${store.name} Coupons, Deals & Promo Codes`,
      partnerText: `${store.trustStatus} merchant in Couponchy catalog`,
      validatedText: `${offers.length} active offer${offers.length === 1 ? "" : "s"} currently available`,
      activeCoupons,
      activeDeals,
      introTitle: resolvedIntroTitle,
      introParagraphs: resolvedIntroParagraphs,
      whyItems: resolvedWhyItems,
      outro: resolvedOutro,
    },
    storeTabs: ["Coupons", "Store Info", "FAQs"],
    offerTabs: [
      `All (${offers.length})`,
      `Coupons (${activeCoupons})`,
      `Deals (${activeDeals})`,
    ],
    offers: offers.map((offer) => ({
      ...offer,
      views: `${Math.max(0, 10 + activeCoupons + activeDeals)} views`,
      date: new Date(offer.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    })),
    faqs: resolvedFaqs,
    relatedStores: allStores
      .filter((item) => item.slug !== store.slug)
      .slice(0, 6)
      .map((item) => ({
        name: item.name,
        slug: item.slug,
        categorySlug: item.categorySlug,
        logoText: item.logoText,
        logoClassName: item.logoClassName,
        logoImage: item.logoImage,
      })),
  };
}

function extractHighestDiscountOffer(offers) {
  return offers.reduce((bestMatch, offer) => {
    const source = [offer.title, offer.description, offer.code].filter(Boolean).join(" ");
    const matches = [...source.matchAll(/(\d{1,3})\s*%/g)];

    if (matches.length === 0) {
      return bestMatch;
    }

    const highestInOffer = Math.max(...matches.map((match) => Number(match[1])));

    if (!bestMatch || highestInOffer > bestMatch.discount) {
      return {
        offer,
        discount: highestInOffer,
      };
    }

    return bestMatch;
  }, null);
}

function normalizeMetadataText(value) {
  return value.replace(/\s+/g, " ").replace(/\s+([,.])/g, "$1").trim();
}

function doesStoreMatchSearch(store, query) {
  const haystack = [store.name, store.slug, store.category, store.categorySlug, store.description].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query);
}

function doesOfferMatchSearch(offer, query) {
  const haystack = [
    offer.title,
    offer.description,
    offer.code,
    offer.type,
    offer.storeName,
    offer.ctaLabel,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function buildStoreMetadataFallback(store, offers, counts, year) {
  const title = `${store.name} Coupon Codes & Deals ${year}`;
  const description = `Save with ${offers.length} verified ${store.name} coupon codes and deals on Couponchy. Browse ${counts.coupons} coupons and ${counts.deals} deals updated for ${year}.`;

  return { title, description };
}

function buildAutoStoreMetadata(settings, store, offers) {
  const year = new Date().getFullYear();
  const counts = {
    offers: offers.length,
    coupons: offers.filter((offer) => offer.type === "Coupon").length,
    deals: offers.filter((offer) => offer.type === "Deal").length,
  };
  const bestDiscountMatch = extractHighestDiscountOffer(offers);

  if (!bestDiscountMatch) {
    return buildStoreMetadataFallback(store, offers, counts, year);
  }

  const replacements = {
    "%store%": store.name,
    "%best_discount%": String(bestDiscountMatch.discount),
    "%best_offer%": bestDiscountMatch.offer.title || `${bestDiscountMatch.discount}% off`,
    "%offers_count%": String(counts.offers),
    "%coupons_count%": String(counts.coupons),
    "%deals_count%": String(counts.deals),
    "%year%": String(year),
  };

  const applyTemplate = (template, fallback) => {
    const result = Object.entries(replacements).reduce(
      (output, [token, replacement]) => output.replaceAll(token, replacement),
      template
    );

    return normalizeMetadataText(result || fallback);
  };

  return {
    title: applyTemplate(
      settings.seo.storeMetaTitleTemplate,
      `${store.name} ${bestDiscountMatch.discount}% Off Discount & Coupon Codes ${year}`
    ),
    description: applyTemplate(
      settings.seo.storeMetaDescriptionTemplate,
      `Save with ${counts.offers} verified ${store.name} coupon codes and deals on Couponchy. Best current offer: ${bestDiscountMatch.offer.title}. Updated for ${year}.`
    ),
  };
}

function filterStoresByCountry(stores, countryCode) {
  const normalizedCountry = normalizeCountryCode(countryCode);
  return stores.filter((store) => normalizeCountryCode(store.countryCode) === normalizedCountry);
}

export async function getStoreDirectoryData(search = "", countryCode) {
  const [stores, offers] = await Promise.all([getAllStores(), getAllOffers()]);
  const scopedStores = filterStoresByCountry(stores, countryCode);
  const allowedStoreSlugs = new Set(scopedStores.map((store) => store.slug));
  const scopedOffers = offers.filter((offer) => allowedStoreSlugs.has(offer.storeSlug));
  const lang = COUNTRY_TO_LANG[String(countryCode || "").toUpperCase()] || "en";
  const translatedStoreDirectory = await getTranslatedStoreDirectory(lang);
  const normalizedSearch = String(search || "").trim().toLowerCase();
  const matchingStoreSlugsFromOffers = normalizedSearch
    ? new Set(
      scopedOffers
        .filter((offer) => offer.status?.toLowerCase() !== "expired")
        .filter((offer) => doesOfferMatchSearch(offer, normalizedSearch))
        .map((offer) => offer.storeSlug)
    )
    : new Set();
  const filteredStores = normalizedSearch
    ? scopedStores.filter((store) => {
      return doesStoreMatchSearch(store, normalizedSearch) || matchingStoreSlugsFromOffers.has(store.slug);
    })
    : scopedStores;

  const categories = [...new Set(filteredStores.map((store) => store.category))].map((category, index) => ({
    name: category,
    active: index === 0,
  }));

  return {
    breadcrumbItems: normalizedSearch
      ? ["Home", "Stores", `Search: ${search}`]
      : ["Home", "Stores", categories[0]?.name || "All Stores"],
    categories,
    stores: filteredStores.map(buildStoreDirectoryRecord),
    searchValue: search,
    t: translatedStoreDirectory,
  };
}

export async function getHomePageData(countryCode) {
  const [stores, offers, products, settings, categories] = await Promise.all([
    getAllStores(),
    getAllOffers(),
    getAllProducts(),
    getSettings(),
    getAllCategories(),
  ]);

  const lang = COUNTRY_TO_LANG[String(countryCode || "").toUpperCase()] || "en";
  const [
    translatedSettings,
    translatedCategories,
    translatedTrendingStores,
    translatedHowItWorks,
    translatedFeaturedCoupons,
    translatedHero,
    translatedMarquee,
  ] = await Promise.all([
    getTranslatedSettings(settings, lang),
    getTranslatedCategories(categories, lang),
    getTranslatedTrendingStores(lang),
    getTranslatedHowItWorks(lang),
    getTranslatedFeaturedCoupons(lang),
    getTranslatedHero(lang),
    getTranslatedMarquee(lang),
  ]);

  const scopedStores = filterStoresByCountry(stores, countryCode);
  const storeMap = new Map(scopedStores.map((store) => [store.slug, store]));
  const allowedStoreSlugs = new Set(scopedStores.map((store) => store.slug));
  const scopedOffers = offers.filter((offer) => allowedStoreSlugs.has(offer.storeSlug));

  // Translate offers for the active language
  const translatedOffers = await getTranslatedOffers(scopedOffers, lang);

  // Filter only Coupons and ensure one coupon per brand/store
  const marqueeCoupons = [];
  const seenStoresForMarquee = new Set();
  for (const offer of translatedOffers) {
    if (offer.type === "Coupon") {
      const storeSlug = offer.storeSlug || offer.storeName;
      if (storeSlug && !seenStoresForMarquee.has(storeSlug)) {
        seenStoresForMarquee.add(storeSlug);
        marqueeCoupons.push(offer);
      }
    }
  }

  const marqueeItems = marqueeCoupons.slice(0, 15).map((offer, idx) => {
    // Create some variety in activity labels
    let action = "Code verified";
    let statusLabel = "Verified";
    let statusTone = "success";
    let actor = "COUPONCHY LAB";

    if (idx % 3 === 0) {
      action = "Code verified";
      statusLabel = "Verified";
      statusTone = "success";
      actor = "COUPONCHY LAB";
    } else if (idx % 3 === 1) {
      action = "Code submitted";
      statusLabel = "New code";
      statusTone = "warning";
      actor = "COUPONCHY TEAM";
    } else {
      action = "Coupon updated";
      statusLabel = "Fresh update";
      statusTone = "warning";
      actor = "SAVINGS TEAM";
    }

    return {
      store: offer.storeName || "Brand",
      action,
      code: offer.code || "SAVE",
      statusLabel,
      statusTone,
      actor,
    };
  });

  const scopedProducts = products.filter((product) => allowedStoreSlugs.has(product.storeSlug));
  const homepageSections = translatedSettings.homepage.sections;

  const storesByCategory = scopedStores.reduce((acc, store) => {
    const key = store.categorySlug || "uncategorized";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const trendingStoresSource =
    homepageSections.trendingStores.selectedStoreSlugs?.length
      ? orderItemsBySelection(scopedStores, homepageSections.trendingStores.selectedStoreSlugs, (store) => store.slug)
      : scopedStores;

  const featuredOffersSource =
    homepageSections.featuredCoupons.selectedOfferIds?.length
      ? orderItemsBySelection(translatedOffers, homepageSections.featuredCoupons.selectedOfferIds, (offer) => offer.id)
      : translatedOffers;

  const featuredProductsSource =
    homepageSections.featuredProducts.selectedProductIds?.length
      ? orderItemsBySelection(scopedProducts, homepageSections.featuredProducts.selectedProductIds, (product) => product.id)
      : scopedProducts;

  const rawTitle = homepageSections.latestStores.title || "";
  const categoriesTitle = rawTitle.toLowerCase().includes("store") ? "Browse Categories" : (rawTitle || "Browse Categories");

  return {
    hero: translatedSettings.homepage.hero,
    categoriesTitle,
    heroStatsT: translatedHero,
    marqueeT: translatedMarquee,
    marqueeItems,
    trendingStoresT: translatedTrendingStores,
    howItWorksT: translatedHowItWorks,
    featuredCouponsT: translatedFeaturedCoupons,
    categories: translatedCategories.map((cat) => ({
      name: cat.name,
      slug: cat.slug,
      code: cat.name.slice(0, 1).toUpperCase(),
      href: `/stores?category=${cat.slug}`,
      storesCount: storesByCategory[cat.slug] || 0,
    })),
    trendingStoresTitle: homepageSections.trendingStores.title,
    trendingStores: trendingStoresSource.slice(0, homepageSections.trendingStores.limit).map((store) => ({
      name: store.name,
      slug: store.slug,
      categorySlug: store.categorySlug,
      href: `/stores/${store.categorySlug}/${store.slug}`,
      offer: `${store.offersCount} ACTIVE OFFERS`,
      cta: store.logoText,
      image: store.heroImage,
      logoImage: store.logoImage,
      logoText: store.logoText,
      trustStatus: store.trustStatus,
      offersCount: store.offersCount || 0,
    })),
    featuredCouponsTitle: homepageSections?.featuredCoupons?.title || "Featured Coupons",
    featuredCoupons: featuredOffersSource.slice(0, homepageSections?.featuredCoupons?.limit || 4).filter(Boolean).map((offer, index) => {
      const store = offer?.storeSlug ? storeMap.get(offer.storeSlug) : null;
      return {
        brand: offer?.storeName || "",
        tag: offer?.status || "",
        title: offer?.title || "",
        value: offer?.type === "Deal" ? "GET DEAL" : offer?.code || "SAVE NOW",
        description: offer?.description || "",
        expiryDate: offer?.expiryDate || "",
        affiliateLink: offer?.affiliateLink || "",
        storeSlug: offer?.storeSlug || "",
        highlight: index === 1,
        logoImage: store?.logoImage || null,
        logoText: store?.logoText || "",
      };
    }),
    featuredProductsTitle: homepageSections?.featuredProducts?.title || "Featured Products",
    featuredProducts: featuredProductsSource.slice(0, Math.max(10, homepageSections?.featuredProducts?.limit || 10)).filter(Boolean).map((product) => ({
      id: product?.id || "",
      title: product?.title || "",
      description: product?.description || "",
      image: product?.image || "",
      price: product?.price || "",
      originalPrice: product?.originalPrice || "",
      currency: product?.currency || "",
      ctaLabel: product?.ctaLabel || "",
      productUrl: product?.productUrl || "",
      storeName: product?.storeName || "",
      status: product?.status || "",
    })),
    allCategories: categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
    })),
    allStores: scopedStores.map((store) => ({
      name: store.name,
      slug: store.slug,
      categorySlug: store.categorySlug,
      logoImage: store.logoImage,
      logoText: store.logoText,
      trustStatus: store.trustStatus,
      offersCount: store.offersCount,
    })),
    totalStoresCount: scopedStores.length,
  };
}

export async function getStorePageData(slug, countryCode) {
  const [store, offers, products, allStores] = await Promise.all([
    getStoreBySlug(slug),
    getOffersByStoreSlug(slug),
    getProductsByStoreSlug(slug),
    getAllStores(),
  ]);

  if (!store) {
    return null;
  }

  if (countryCode && normalizeCountryCode(store.countryCode) !== normalizeCountryCode(countryCode)) {
    return null;
  }

  const countryMatchedStores = allStores.filter(
    (item) => normalizeCountryCode(item.countryCode) === normalizeCountryCode(store.countryCode)
  );

  const lang = COUNTRY_TO_LANG[String(store.countryCode || "").toUpperCase()] || "en";
  const [translatedStore, translatedOffers] = await Promise.all([
    getTranslatedStore(store, lang),
    getTranslatedOffers(offers, lang),
  ]);

  const detail = buildStoreDetail(translatedStore, translatedOffers, countryMatchedStores);
  const translatedDetail = await getTranslatedStoreDetail(detail, lang);

  return {
    ...translatedDetail,
    products: products.map((product) => ({
      ...product,
      productUrl: product.productUrl || `/stores/${store.categorySlug}/${store.slug}/products/${product.slug}`,
    })),
  };
}

export async function getProductPageData(storeSlug, productSlug, countryCode) {
  const [store, product] = await Promise.all([
    getStoreBySlug(storeSlug),
    getProductByStoreAndSlug(storeSlug, productSlug),
  ]);

  if (!store || !product) {
    return null;
  }

  if (countryCode && normalizeCountryCode(store.countryCode) !== normalizeCountryCode(countryCode)) {
    return null;
  }

  const lang = COUNTRY_TO_LANG[String(store.countryCode || "").toUpperCase()] || "en";
  const translatedStore = await getTranslatedStore(store, lang);

  return {
    singleStore: translatedStore,
    productItem: {
      ...product,
      productUrl: `/stores/${store.categorySlug}/${store.slug}/products/${product.slug}`,
    },
  };
}

export async function getProductPageMetadata(storeSlug, productSlug, countryCode) {
  const data = await getProductPageData(storeSlug, productSlug, countryCode);

  if (!data) {
    return null;
  }

  return {
    title: `${data.productItem.title} | ${data.singleStore.name}`,
    description: data.productItem.description,
  };
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

const FREEBIE_LOCALIZATION = {
  en: { trial: "Free Trial", shipping: "Free Shipping" },
  de: { trial: "Kostenlose Testversion", shipping: "Gratis Versand" },
  fr: { trial: "Essai Gratuit", shipping: "Livraison Gratuite" },
  es: { trial: "Prueba Gratuita", shipping: "Envío Gratis" },
  nl: { trial: "Gratis Proefversie", shipping: "Gratis Verzending" },
  pl: { trial: "Darmowy Okres Próbny", shipping: "Darmowa Dostawa" },
  it: { trial: "Prova Gratuita", shipping: "Spedizione Gratis" },
  ja: { trial: "無料トライアル", shipping: "送料無料" },
  pt: { trial: "Teste Grátis", shipping: "Envio Grátis" },
  sv: { trial: "Gratis Testperiod", shipping: "Gratis Frakt" },
  ar: { trial: "تجربة مجانية", shipping: "شحن مجاني" }
};

function extractHighestOffer(offers, countryCode = "US", lang = "en") {
  if (!offers || offers.length === 0) return null;

  const defaultSymbol = COUNTRY_CURRENCY_MAP[String(countryCode).toUpperCase()] || "$";

  let bestOfferStr = null;
  let bestDiscountPercent = 0;
  let bestDiscountAmount = 0;
  let bestFreebie = null;

  for (const offer of offers) {
    const title = offer.title || "";
    const description = offer.description || "";
    const combined = `${title} ${description}`.toLowerCase();

    // 1. Free Shipping / Trial Check
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

    const isFreeTrial = combined.includes("free trial") || combined.includes("kostenlose testversion") || combined.includes("essai gratuit") || combined.includes("prueba gratuita") || combined.includes("okres próbny");

    // 2. Decimal / Price check (ignore decimals as they are prices, not discounts)
    const hasDecimals = /(?:\$|£|€|¥|₹|zł|د\.إ|SR|TL|Rs\.?)\s*\d+\.\d{2}|\d+\.\d{2}\s*(?:\$|£|€|¥|₹|zł|د\.إ|SR|TL|Rs\.?|usd|gbp|eur|pkr)/i.test(combined);

    // Starting prices are prices, not discounts, so ignore them
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
      /\b(ab|von|od|da|desde|vanaf|from|starting|starts)\s*(?:nur|only|just|at|for|to|a|à)?\s*(?:\$|£|€|¥|₹|zł|Rs|\d)/i.test(combined) ||
      hasDecimals;

    if (isStartingPrice) continue;

    // 3. Percent Match
    const percentMatch = combined.match(/(\d{1,3})\s*%/);
    if (percentMatch) {
      const pct = parseInt(percentMatch[1], 10);
      if (pct > bestDiscountPercent && pct <= 100) {
        bestDiscountPercent = pct;
        bestOfferStr = `${pct}% Off`;
      }
      continue;
    }

    // If it is a Free Shipping or Free Trial offer, do not parse currency amounts (they are minimum thresholds, not discounts)
    if (isFreeShipping || isFreeTrial) {
      if (isFreeTrial) {
        bestFreebie = "Free Trial";
      } else {
        bestFreebie = "Free Shipping";
      }
      continue;
    }

    // 4. Currency Amount Match
    // e.g. $100, €50, Rs 500
    const currencyRegex = /(?:\$|£|€|¥|₹|zł|د\.إ|SR|TL|Rs\.?)\s*(\d{1,4})|(\d{1,4})\s*(?:\$|£|€|¥|₹|zł|د\.إ|SR|TL|Rs\.?|\busd\b|\bgbp\b|\beur\b|\bpkr\b|\baed\b|\bsar\b|\bcad\b|\baud\b|\binr\b|\bpln\b|\btry\b)/i;
    const currencyMatch = combined.match(currencyRegex);
    if (currencyMatch) {
      const matchedText = currencyMatch[0];
      const numStr = (currencyMatch[1] || currencyMatch[2]).replace(/,/g, "");
      const amt = parseInt(numStr, 10);
      if (amt > bestDiscountAmount) {
        bestDiscountAmount = amt;
        const symbol = currencyMatch[1] 
          ? (matchedText.match(/(\$|£|€|¥|₹|zł|د\.إ|SR|TL|Rs\.?)/i)?.[1] || defaultSymbol)
          : (matchedText.match(/(\$|£|€|¥|₹|zł|د\.إ|SR|TL|Rs\.?|\busd\b|\bgbp\b|\beur\b|\bpkr\b|\baed\b|\bsar\b|\bcad\b|\baud\b|\binr\b|\bpln\b|\btry\b)/i)?.[0] || defaultSymbol);
        
        // If symbol is abbreviation like "EUR" or "USD", format nicely
        const isPrefix = currencyMatch[1];
        if (isPrefix) {
          bestOfferStr = `${symbol}${amt} Off`;
        } else {
          bestOfferStr = `${amt}${symbol.toUpperCase()} Off`;
        }
      }
      continue;
    }

    // 5. Flat Off Match (e.g. 50 Off)
    const flatOffMatch = combined.match(/(\d{1,3})\s*(?:off|discount)/i);
    if (flatOffMatch) {
      const amt = parseInt(flatOffMatch[1], 10);
      if (amt > bestDiscountAmount) {
        bestDiscountAmount = amt;
        bestOfferStr = `${defaultSymbol}${amt} Off`;
      }
      continue;
    }

    if (isFreeTrial) {
      bestFreebie = "Free Trial";
    } else if (isFreeShipping) {
      bestFreebie = "Free Shipping";
    }
  }

  // Priority: Percent > Amount > Freebie
  if (bestDiscountPercent > 0) {
    return bestOfferStr;
  }
  if (bestDiscountAmount > 0) {
    return bestOfferStr;
  }
  if (bestFreebie) {
    const loc = FREEBIE_LOCALIZATION[lang] || FREEBIE_LOCALIZATION.en;
    return bestFreebie === "Free Trial" ? loc.trial : loc.shipping;
  }

  return null;
}

function generateLocalizedTitle(brandName, highestOffer, lang, counts = { offers: 0 }) {
  const { month, year } = getLocalizedMonthYear(lang);
  const totalOffers = counts.offers || 0;

  if (highestOffer) {
    switch (lang) {
      case "de":
        return `${brandName} Gutscheincodes - ${highestOffer} (${totalOffers} Verifiziert) ${month} ${year}`;
      case "fr":
        return `${brandName} Codes Promo - ${highestOffer} (${totalOffers} Vérifiés) ${month} ${year}`;
      case "es":
        return `${brandName} Códigos Promocionales - ${highestOffer} (${totalOffers} Verificados) ${month} ${year}`;
      case "nl":
        return `${brandName} Kortingscodes - ${highestOffer} (${totalOffers} Geverifieerd) ${month} ${year}`;
      case "pl":
        return `${brandName} Kody Rabatowe - ${highestOffer} (${totalOffers} Zweryfikowane) ${month} ${year}`;
      case "it":
        return `${brandName} Codici Sconto - ${highestOffer} (${totalOffers} Verificati) ${month} ${year}`;
      case "ja":
        return `${brandName} プロモコード - ${highestOffer} (${totalOffers}確認済み) ${year}年${month}月`;
      case "pt":
        return `${brandName} Códigos Promocionais - ${highestOffer} (${totalOffers} Verificados) ${month} ${year}`;
      case "sv":
        return `${brandName} Rabattkoder - ${highestOffer} (${totalOffers} Verifierade) ${month} ${year}`;
      case "ar":
        return `أكواد خصم ${brandName} - ${highestOffer} (${totalOffers} موثق) ${month} ${year}`;
      default: // en
        return `${brandName} Promo Codes - ${highestOffer} (${totalOffers} Verified) ${month} ${year}`;
    }
  } else {
    switch (lang) {
      case "de":
        return `${brandName} Gutscheincodes - (${totalOffers} Verifiziert) ${month} ${year}`;
      case "fr":
        return `${brandName} Codes Promo - (${totalOffers} Vérifiés) ${month} ${year}`;
      case "es":
        return `${brandName} Códigos Promocionales - (${totalOffers} Verificados) ${month} ${year}`;
      case "nl":
        return `${brandName} Kortingscodes - (${totalOffers} Geverifieerd) ${month} ${year}`;
      case "pl":
        return `${brandName} Kody Rabatowe - (${totalOffers} Zweryfikowane) ${month} ${year}`;
      case "it":
        return `${brandName} Codici Sconto - (${totalOffers} Verificati) ${month} ${year}`;
      case "ja":
        return `${brandName} プロモコード - (${totalOffers}確認済み) ${year}年${month}月`;
      case "pt":
        return `${brandName} Códigos Promocionais - (${totalOffers} Verificados) ${month} ${year}`;
      case "sv":
        return `${brandName} Rabattkoder - (${totalOffers} Verifierade) ${month} ${year}`;
      case "ar":
        return `أكواد خصم ${brandName} - (${totalOffers} موثق) ${month} ${year}`;
      default: // en
        return `${brandName} Promo Codes - (${totalOffers} Verified) ${month} ${year}`;
    }
  }
}

function generateLocalizedDescription(brandName, highestOffer, counts, lang, storeDesc = "") {
  const { month, year } = getLocalizedMonthYear(lang);
  const firstSentence = storeDesc && storeDesc.trim() ? storeDesc.trim().split(/[.!?]/)[0].trim() : "";
  const baseIntro = firstSentence && firstSentence.length > 15 && firstSentence.length < 120 ? `${firstSentence}. ` : "";

  if (highestOffer) {
    switch (lang) {
      case "de":
        return `${baseIntro}Sparen Sie bis zu ${highestOffer} mit ${counts.offers} verifizierten ${brandName} Gutscheinen und Rabattcodes. Entdecken Sie geprüfte Angebote und exklusive Deals für ${month} ${year} auf CouponChy.`;
      case "fr":
        return `${baseIntro}Économisez jusqu'à ${highestOffer} avec ${counts.offers} coupons et codes de réduction ${brandName} vérifiés. Découvrez des offres exclusives et des sconti mis à jour pour ${month} ${year} sur CouponChy.`;
      case "es":
        return `${baseIntro}Ahorra hasta un ${highestOffer} con ${counts.offers} cupones y códigos de descuento verificados de ${brandName}. Explora ofertas exclusivas y ahorros reales actualizados para ${month} ${year} en CouponChy.`;
      case "nl":
        return `${baseIntro}Bespaar tot ${highestOffer} met ${counts.offers} geverifieerde ${brandName} kortingscodes en coupons. Ontdek de beste actieve deals en exclusieve kortingen voor ${month} ${year} op CouponChy.`;
      case "pl":
        return `${baseIntro}Oszczędź do ${highestOffer} dzięki ${counts.offers} zweryfikowanym kodom rabatowym i kuponom ${brandName}. Odkryj aktywne promocje i zniżki na ${month} ${year} w CouponChy.`;
      case "it":
        return `${baseIntro}Risparmia fino a ${highestOffer} con ${counts.offers} codici sconto e coupon verificati di ${brandName}. Scopri le migliori offerte attive e sconti aggiornati per ${month} ${year} su CouponChy.`;
      case "ja":
        return `${baseIntro}確認済みの${brandName}クーポンとプロモーションコード（全${counts.offers}件）で、最大${highestOffer}オフの割引。${year}年${month}月最新の限定セールとお得な情報をCouponChyでチェック！`;
      case "pt":
        return `${baseIntro}Economize até ${highestOffer} com ${counts.offers} cupons e códigos de desconto verificados da ${brandName}. Explore ofertas ativas e descontos imperdíveis para ${month} ${year} no CouponChy.`;
      case "sv":
        return `${baseIntro}Spara upp till ${highestOffer} med ${counts.offers} verifierade ${brandName} rabattkoder och kuponger. Hitta de bästa aktiva erbjudandena och rabatterna för ${month} ${year} på CouponChy.`;
      case "ar":
        return `${baseIntro}وفر حتى ${highestOffer} مع ${counts.offers} كوبون وكود خصم موثق لـ ${brandName}. اكتشف أفضل العروض الحصرية والخصومات النشطة لـ ${month} ${year} على CouponChy.`;
      default: // en
        return `${baseIntro}Save up to ${highestOffer} with ${counts.offers} verified ${brandName} coupons and discount codes. Find the best active deals, promo codes, and exclusive savings for ${month} ${year} at CouponChy.`;
    }
  } else {
    switch (lang) {
      case "de":
        return `${baseIntro}Sparen Sie mit ${counts.offers} verifizierten ${brandName} Gutscheinen, Rabattcodes und Deals. Entdecken Sie geprüfte Sparmöglichkeiten und exklusive Rabatte für ${month} ${year} auf CouponChy.`;
      case "fr":
        return `${baseIntro}Économisez avec ${counts.offers} coupons, codes de réduction et offres ${brandName} vérifiés. Découvrez des offres exclusives et des économies mises à jour pour ${month} ${year} sur CouponChy.`;
      case "es":
        return `${baseIntro}Ahorra con ${counts.offers} cupones, códigos de descuento y ofertas verificadas de ${brandName}. Explora oportunidades de ahorro reales actualizadas para ${month} ${year} en CouponChy.`;
      case "nl":
        return `${baseIntro}Bespaar met ${counts.offers} geverifieerde ${brandName} kortingscodes, coupons en aanbiedingen. Ontdek de beste actieve deals en exclusieve kortingen voor ${month} ${year} op CouponChy.`;
      case "pl":
        return `${baseIntro}Oszczędzaj dzięki ${counts.offers} zweryfikowanym kodom rabatowym, kuponom i promocjom ${brandName}. Odkryj aktywne oferty i zniżki na ${month} ${year} w CouponChy.`;
      case "it":
        return `${baseIntro}Risparmia con ${counts.offers} codici sconto, coupon e offerte verificate di ${brandName}. Scopri le migliori promozioni attive e sconti aggiornati per ${month} ${year} su CouponChy.`;
      case "ja":
        return `${baseIntro}確認済みの${brandName}クーポンと割引セール（全${counts.offers}件）でお得にショッピング。${year}年${month}月最新のプロモーションコードと限定キャンペーン情報をCouponChyでチェック！`;
      case "pt":
        return `${baseIntro}Economize com ${counts.offers} cupons, códigos de desconto e promoções verificadas da ${brandName}. Explore ofertas ativas e descontos atualizados para ${month} ${year} no CouponChy.`;
      case "sv":
        return `${baseIntro}Spara med ${counts.offers} verifierade ${brandName} rabattkoder, kuponger och deals. Hitta de bästa aktiva erbjudandena och rabatterna för ${month} ${year} på CouponChy.`;
      case "ar":
        return `${baseIntro}وفر أكثر مع ${counts.offers} كوبون وكود خصم وعرض موثق لـ ${brandName}. اكتشف أفضل العروض الحصرية والخصومات النشطة لـ ${month} ${year} على CouponChy.`;
      default: // en
        return `${baseIntro}Save with ${counts.offers} verified ${brandName} coupons, discount codes, and deals. Find active promo codes, community verified offers, and exclusive savings for ${month} ${year} at CouponChy.`;
    }
  }
}

function shouldRegenerateMetaTitle(metaTitle, brandName) {
  if (!metaTitle || !metaTitle.trim()) return true;
  const t = metaTitle.trim();
  if (/\b0\s*(verified|gütig|véri|verific|zweryf|moath|mofath)\b/i.test(t) || /\(0\s*[a-z]*\)/i.test(t)) return true;
  if (t.includes(`${brandName} Promo Codes -`) || t.includes(`${brandName} Promo Codes & Coupons`) || t.includes(`${brandName} Discount & Coupons Code`)) {
    if (!t.includes('{totaloffers}') && !t.includes('{highest%}')) return true;
  }
  return false;
}

function shouldRegenerateMetaDescription(metaDesc, brandName) {
  if (!metaDesc || !metaDesc.trim()) return true;
  const d = metaDesc.trim();
  if (/\b0\s*(verified|coupons|deals|gutscheinen|cupones|kodom|codici|rabattkoder)\b/i.test(d) || /with 0 verified/i.test(d)) return true;
  if (d.includes("updated by Couponchy. Save with") || d.includes("at CouponChy.")) return true;
  return false;
}

export function generateLocalizedStoreMetadata(store, offers, lang, countryCode) {
  const brandName = store.name || "Brand";
  const counts = {
    offers: offers.length,
    coupons: offers.filter((offer) => offer.type === "Coupon").length,
    deals: offers.filter((offer) => offer.type === "Deal").length,
  };

  const highestOffer = extractHighestOffer(offers, countryCode, lang);

  const metaTitleStr = String(store?.metaTitle || "").trim();
  const metaDescStr = String(store?.metaDescription || "").trim();

  const useGeneratedTitle = shouldRegenerateMetaTitle(metaTitleStr, brandName);
  const useGeneratedDesc = shouldRegenerateMetaDescription(metaDescStr, brandName);

  const rawTitle = useGeneratedTitle ? generateLocalizedTitle(brandName, highestOffer, lang, counts) : metaTitleStr;
  const rawDescription = useGeneratedDesc ? generateLocalizedDescription(brandName, highestOffer, counts, lang, store?.description || "") : metaDescStr;

  const title = replaceDynamicDatePlaceholders(rawTitle, countryCode, lang, counts, highestOffer);
  const description = replaceDynamicDatePlaceholders(rawDescription, countryCode, lang, counts, highestOffer);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://couponchy.com";
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

  const isDefault = String(lang).toLowerCase() === "en";
  const cc = languageToCountry[lang] || "us";
  const countrySegment = isDefault ? "" : `/${cc}`;
  const canonicalUrl = `${baseUrl}${countrySegment}/stores/${store.categorySlug}/${store.slug}`;

  const hreflangs = {};
  supportedLanguages.forEach((l) => {
    const languageCc = languageToCountry[l];
    const prefix = languageCc === "us" ? "" : `/${languageCc}`;
    hreflangs[l] = `${baseUrl}${prefix}/stores/${store.categorySlug}/${store.slug}`;
  });
  hreflangs["x-default"] = `${baseUrl}/stores/${store.categorySlug}/${store.slug}`;

  const alternates = {
    canonical: canonicalUrl,
    languages: hreflangs,
  };

  return {
    title: normalizeMetadataText(title),
    description: normalizeMetadataText(description),
    alternates,
    openGraph: {
      title: normalizeMetadataText(title),
      description: normalizeMetadataText(description),
      url: canonicalUrl,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: normalizeMetadataText(title),
      description: normalizeMetadataText(description),
    }
  };
}

export async function getStorePageMetadata(slug, countryCode) {
  const [store, offers] = await Promise.all([
    getStoreBySlug(slug),
    getOffersByStoreSlug(slug),
  ]);

  if (!store) {
    return null;
  }

  // Resolve target language
  const resolvedCountryCode = countryCode || store.countryCode;
  const lang = COUNTRY_TO_LANG[String(resolvedCountryCode || "").toUpperCase()] || "en";

  // Translate store and offers to match the target language
  const [translatedStore, translatedOffers] = await Promise.all([
    getTranslatedStore(store, lang),
    getTranslatedOffers(offers, lang),
  ]);
  return generateLocalizedStoreMetadata(translatedStore, translatedOffers, lang, resolvedCountryCode);
}


