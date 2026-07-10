import "server-only";

import { getAllOffers, getOffersByStoreSlug } from "@/server/repositories/offers-repository";
import { getAllProducts, getProductByStoreAndSlug, getProductsByStoreSlug } from "@/server/repositories/products-repository";
import { getSettings } from "@/server/repositories/settings-repository";
import { getAllStores, getStoreBySlug } from "@/server/repositories/stores-repository";
import { getAllCategories } from "@/server/repositories/categories-repository";
import { normalizeCountryCode } from "@/lib/countries";
import { generateStoreContent, generateStoreAboutDescription } from "@/lib/store-seo-templates";
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
  const aboutText = generateStoreAboutDescription(store, offers);

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
  ].filter((item) => item.question?.trim() && item.answer?.trim());

  // Resolve intro paragraphs:
  // If admin filled paragraph 1 or 2, respect those; otherwise use generated.
  const adminPara1 = store.contentIntroParagraph1?.trim();
  const adminPara2 = store.contentIntroParagraph2?.trim();
  const hasAdminIntro = !!(adminPara1 || adminPara2);

  const introParagraphs = hasAdminIntro
    ? [
        adminPara1 || generated.introParagraphs[0],
        adminPara2 || store.description || generated.introParagraphs[1],
      ]
    : generated.introParagraphs;

  return {
    aboutText,
    singleStore: {
      ...store,
      title: `${store.name} Coupons, Deals & Promo Codes`,
      partnerText: `${store.trustStatus} merchant in Couponchy catalog`,
      validatedText: `${offers.length} active offer${offers.length === 1 ? "" : "s"} currently available`,
      activeCoupons,
      activeDeals,
      // introTitle: admin wins, else generated
      introTitle: store.contentIntroTitle?.trim() || generated.introTitle,
      // introParagraphs: admin wins per-field, else full generated set
      introParagraphs,
      // whyItems: admin textarea wins, else generated
      whyItems: customWhyItems.length ? customWhyItems : generated.whyItems,
      // outro: admin wins, else generated
      outro: store.contentOutro?.trim() || generated.outro,
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
    // FAQs: admin custom FAQs win, else generated template FAQs
    faqs: customFaqs.length ? customFaqs : generated.faqs,
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
  return value.replace(/\s+/g, " ").replace(/\s+([&|,.\-])/g, "$1").trim();
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
    featuredCouponsTitle: homepageSections.featuredCoupons.title,
    featuredCoupons: featuredOffersSource.slice(0, homepageSections.featuredCoupons.limit).map((offer, index) => {
      const store = storeMap.get(offer.storeSlug);
      return {
        brand: offer.storeName,
        tag: offer.status,
        title: offer.title,
        value: offer.type === "Deal" ? "GET DEAL" : offer.code || "SAVE NOW",
        description: offer.description,
        expiryDate: offer.expiryDate,
        affiliateLink: offer.affiliateLink,
        storeSlug: offer.storeSlug,
        highlight: index === 1,
        logoImage: store?.logoImage || null,
        logoText: store?.logoText || "",
      };
    }),
    featuredProductsTitle: homepageSections.featuredProducts.title,
    featuredProducts: featuredProductsSource.slice(0, Math.max(10, homepageSections.featuredProducts.limit || 10)).map((product) => ({
      id: product.id,
      title: product.title,
      description: product.description,
      image: product.image,
      price: product.price,
      originalPrice: product.originalPrice,
      currency: product.currency,
      ctaLabel: product.ctaLabel,
      productUrl: product.productUrl,
      storeName: product.storeName,
      status: product.status,
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
      productUrl: `/stores/${store.categorySlug}/${store.slug}/products/${product.slug}`,
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

function generateLocalizedStoreMetadata(store, offers, lang) {
  const brandName = store.name || "Brand";
  const year = new Date().getFullYear();
  const counts = {
    offers: offers.length,
    coupons: offers.filter((offer) => offer.type === "Coupon").length,
    deals: offers.filter((offer) => offer.type === "Deal").length,
  };

  // Find highest discount if any
  const bestDiscountMatch = extractHighestDiscountOffer(offers);
  const bestDiscountVal = bestDiscountMatch?.discount ? `${bestDiscountMatch.discount}%` : "";

  // Templates map matching characters count guidelines and dynamic locale-specific requirements
  const templates = {
    en: {
      titleWithDiscount: `${brandName} Coupons & Promo Codes: ${bestDiscountVal} Off | Verified Discounts | CouponChy`,
      titleNoDiscount: `${brandName} Coupons & Promo Codes | Verified Discounts & Deals | CouponChy`,
      descWithDiscount: `Find the latest verified ${brandName} coupons, promo codes, and exclusive deals. Save up to ${bestDiscountVal} off your purchase with updated discounts at CouponChy.`,
      descNoDiscount: `Find the latest verified ${brandName} coupons, promo codes, and exclusive deals. Save more with regularly updated discounts and trusted offers at CouponChy.`
    },
    de: {
      titleWithDiscount: `${brandName} Gutscheine & Rabattcodes: ${bestDiscountVal} Rabatt | Geprüfte Angebote | CouponChy`,
      titleNoDiscount: `${brandName} Gutscheine & Rabattcodes | Geprüfte Angebote & Rabatte | CouponChy`,
      descWithDiscount: `Entdecken Sie die neuesten verifizierten ${brandName} Gutscheine, Rabattcodes und Angebote. Sparen Sie bis zu ${bestDiscountVal} mit regelmäßig aktualisierten Rabatten auf CouponChy.`,
      descNoDiscount: `Entdecken Sie die neuesten verifizierten ${brandName} Gutscheine, Rabattcodes und Angebote. Sparen Sie mit regelmäßig aktualisierten Rabatten auf CouponChy.`
    },
    fr: {
      titleWithDiscount: `Coupons et codes promo ${brandName} : ${bestDiscountVal} de réduction | Offres vérifiées | CouponChy`,
      titleNoDiscount: `Coupons et codes promo ${brandName} | Offres et réductions vérifiées | CouponChy`,
      descWithDiscount: `Découvrez les derniers coupons, codes promo et offres vérifiés de ${brandName}. Économisez jusqu'à ${bestDiscountVal} de réduction avec des offres mises à jour sur CouponChy.`,
      descNoDiscount: `Découvrez les derniers coupons, codes promo et offres vérifiés de ${brandName}. Économisez davantage grâce à des réductions régulièrement mises à jour sur CouponChy.`
    },
    es: {
      titleWithDiscount: `Cupones y códigos promocionales de ${brandName}: ${bestDiscountVal} Descuento | Ofertas verificadas | CouponChy`,
      titleNoDiscount: `Cupones y códigos promocionales de ${brandName} | Ofertas y descuentos verificados | CouponChy`,
      descWithDiscount: `Encuentra los últimos cupones, códigos promocionales y ofertas verificadas de ${brandName}. Ahorra hasta un ${bestDiscountVal} de descuento con ofertas actualizadas en CouponChy.`,
      descNoDiscount: `Encuentra los últimos cupones, códigos promocionales y ofertas verificadas de ${brandName}. Ahorra más con descuentos actualizados en CouponChy.`
    },
    ar: {
      titleWithDiscount: `كوبونات وأكواد خصم ${brandName}: خصم ${bestDiscountVal} | عروض وخصومات موثقة | CouponChy`,
      titleNoDiscount: `كوبونات وأكواد خصم ${brandName} | عروض وخصومات موثقة | CouponChy`,
      descWithDiscount: `اكتشف أحدث كوبونات وأكواد خصم وعروض ${brandName} الموثقة. وفر حتى ${bestDiscountVal} مع الخصومات المحدثة باستمرار على CouponChy.`,
      descNoDiscount: `اكتشف أحدث كوبونات وأكواد خصم وعروض ${brandName} الموثقة ووفر أكثر مع العروض المحدثة باستمرار على CouponChy.`
    },
    nl: {
      titleWithDiscount: `${brandName} Kortingscodes & Aanbiedingen: ${bestDiscountVal} Korting | Geverifieerde Deals | CouponChy`,
      titleNoDiscount: `${brandName} Kortingscodes & Aanbiedingen | Geverifieerde Deals & Korting | CouponChy`,
      descWithDiscount: `Vind de nieuwste geverifieerde ${brandName} kortingscodes, actiecodes en aanbiedingen. Bespaar tot ${bestDiscountVal} korting met actuele deals op CouponChy.`,
      descNoDiscount: `Vind de nieuwste geverifieerde ${brandName} kortingscodes, actiecodes en aanbiedingen. Bespaar meer met regelmatig bijgewerkte kortingen op CouponChy.`
    },
    pl: {
      titleWithDiscount: `Kody rabatowe i kupony ${brandName}: ${bestDiscountVal} Zniżki | Zweryfikowane promocje | CouponChy`,
      titleNoDiscount: `Kody rabatowe i kupony ${brandName} | Zweryfikowane promocje i zniżki | CouponChy`,
      descWithDiscount: `Znajdź najnowsze zweryfikowane kody rabatowe, kupony i promocje ${brandName}. Oszczędź do ${bestDiscountVal} zniżki dzięki aktualizowanym rabatom na CouponChy.`,
      descNoDiscount: `Znajdź najnowsze zweryfikowane kody rabatowe, kupony i promocje ${brandName}. Oszczędzaj więcej dzięki regularnie aktualizowanym rabatom na CouponChy.`
    },
    it: {
      titleWithDiscount: `Codici sconto e coupon ${brandName}: ${bestDiscountVal} Sconto | Offerte e sconti verificati | CouponChy`,
      titleNoDiscount: `Codici sconto e coupon ${brandName} | Offerte e sconti verificati | CouponChy`,
      descWithDiscount: `Trova i più recenti codici sconto, coupon e offerte verificate di ${brandName}. Risparmia fino al ${bestDiscountVal} di sconto con promozioni aggiornate su CouponChy.`,
      descNoDiscount: `Trova i più recenti codici sconto, coupon e offerte verificate di ${brandName}. Risparmia di più con sconti aggiornati regolarmente su CouponChy.`
    },
    ja: {
      titleWithDiscount: `${brandName} クーポン＆プロモーションコード: 最大 ${bestDiscountVal} 割引 | 確認済みセール | CouponChy`,
      titleNoDiscount: `${brandName} クーポン＆プロモーションコード | 確認済みのセールと割引 | CouponChy`,
      descWithDiscount: `最新の確認済み${brandName}クーポン、プロモーションコード、限定セールをご覧ください。最大${bestDiscountVal}の割引を活用してお得にショッピング。`,
      descNoDiscount: `最新の確認済み${brandName}クーポン、プロモーションコード、限定セールをご覧ください。CouponChyで定期的に更新される割引を活用してお得にショッピング。`
    },
    pt: {
      titleWithDiscount: `Cupons e códigos promocionais ${brandName}: ${bestDiscountVal} Desconto | Ofertas verificadas | CouponChy`,
      titleNoDiscount: `Cupons e códigos promocionais ${brandName} | Ofertas e descontos verificados | CouponChy`,
      descWithDiscount: `Encontre os cupons, códigos promocionais e ofertas verificadas mais recentes da ${brandName}. Economize até ${bestDiscountVal} de desconto com promoções atualizadas no CouponChy.`,
      descNoDiscount: `Encontre os cupons, códigos promocionais e ofertas verificadas mais recentes da ${brandName}. Economize mais com descontos atualizados regularmente no CouponChy.`
    },
    sv: {
      titleWithDiscount: `${brandName} Rabattkoder & Erbjudanden: ${bestDiscountVal} Rabatt | Verifierade rabatter | CouponChy`,
      titleNoDiscount: `${brandName} Rabattkoder & Erbjudanden | Verifierade rabatter & deals | CouponChy`,
      descWithDiscount: `Hitta de senaste verifierade rabattkoderna, kupongerna och erbjudandena från ${brandName}. Spara upp till ${bestDiscountVal} rabatt med uppdaterade deals på CouponChy.`,
      descNoDiscount: `Hitta de senaste verifierade rabattkoderna, kupongerna och erbjudandena från ${brandName}. Spara mer med regelbundet uppdaterade rabatter på CouponChy.`
    }
  };

  const selected = templates[lang] || templates.en;

  let title = bestDiscountVal ? selected.titleWithDiscount : selected.titleNoDiscount;
  let description = bestDiscountVal ? selected.descWithDiscount : selected.descNoDiscount;

  if (store.description && store.description.trim()) {
    const cleanDesc = store.description.trim();
    const firstSentence = cleanDesc.split(/[.!?]/)[0].trim();
    if (firstSentence && firstSentence.length > 15 && firstSentence.length < 100) {
      if (lang === "en") {
        description = `${firstSentence}. Save more with ${counts.offers} verified ${brandName} coupons and promo codes at CouponChy.`;
      } else if (lang === "de") {
        description = `${firstSentence}. Sparen Sie mehr mit ${counts.offers} verifizierten ${brandName} Gutscheinen und Rabattcodes auf CouponChy.`;
      } else if (lang === "fr") {
        description = `${firstSentence}. Économisez plus avec ${counts.offers} coupons et codes promo vérifiés de ${brandName} sur CouponChy.`;
      } else if (lang === "es") {
        description = `${firstSentence}. Ahorra más con ${counts.offers} cupones y códigos promocionales verificados de ${brandName} en CouponChy.`;
      } else if (lang === "ar") {
        description = `${firstSentence}. وفر أكثر مع ${counts.offers} كوبون وكود خصم موثق لـ ${brandName} على CouponChy.`;
      } else if (lang === "nl") {
        description = `${firstSentence}. Bespaar meer met ${counts.offers} geverifieerde ${brandName} kortingscodes en coupons op CouponChy.`;
      } else if (lang === "pl") {
        description = `${firstSentence}. Oszczędzaj więcej dzięki ${counts.offers} zweryfikowanym kodom rabatowym i kuponom ${brandName} w CouponChy.`;
      } else if (lang === "it") {
        description = `${firstSentence}. Risparmia di più con ${counts.offers} codici sconto e coupon verificati per ${brandName} su CouponChy.`;
      } else if (lang === "ja") {
        description = `${firstSentence}。CouponChyで${counts.offers}個の確認済み${brandName}クーポンやプロモーションコードを利用してお得にショッピング。`;
      } else if (lang === "pt") {
        description = `${firstSentence}. Economize mais com ${counts.offers} cupons e códigos promocionais verificados da ${brandName} no CouponChy.`;
      } else if (lang === "sv") {
        description = `${firstSentence}. Spara mer med ${counts.offers} verifierade ${brandName} rabattkoder och kuponger på CouponChy.`;
      }
    }
  }

  return {
    title: normalizeMetadataText(title),
    description: normalizeMetadataText(description),
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

  return generateLocalizedStoreMetadata(translatedStore, translatedOffers, lang);
}


