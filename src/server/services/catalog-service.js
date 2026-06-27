import "server-only";

import { getAllOffers, getOffersByStoreSlug } from "@/server/repositories/offers-repository";
import { getAllProducts, getProductByStoreAndSlug, getProductsByStoreSlug } from "@/server/repositories/products-repository";
import { getSettings } from "@/server/repositories/settings-repository";
import { getAllStores, getStoreBySlug } from "@/server/repositories/stores-repository";
import { getAllCategories } from "@/server/repositories/categories-repository";
import { normalizeCountryCode } from "@/lib/countries";

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
  const fallbackWhyItems = [
    `Track verified ${store.name} promotions in one place`,
    `Separate coupon codes from direct deal links`,
    `Surface fresh savings as new offers are added from admin`,
  ];
  const customWhyItems = String(store.contentWhyItemsText || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  const fallbackFaqs = [
    {
      question: `How often are ${store.name} offers updated?`,
      answer: "Offers update whenever admins create, edit, or remove records from the shared Couponchy catalog.",
    },
    {
      question: `Are ${store.name} coupons verified?`,
      answer: "Couponchy shows trust status for the store and keeps manual plus network offers in one moderation flow.",
    },
    {
      question: `Can I find both coupons and deals here?`,
      answer: "Yes. This page mixes code-based coupons and direct deal links from the same backend source.",
    },
  ];
  const customFaqs = [
    { question: store.faq1Question, answer: store.faq1Answer },
    { question: store.faq2Question, answer: store.faq2Answer },
    { question: store.faq3Question, answer: store.faq3Answer },
  ].filter((item) => item.question?.trim() && item.answer?.trim());

  return {
    singleStore: {
      ...store,
      title: `${store.name} Coupons, Deals & Promo Codes`,
      partnerText: `${store.trustStatus} merchant in Couponchy catalog`,
      validatedText: `${offers.length} active offer${offers.length === 1 ? "" : "s"} currently available`,
      activeCoupons,
      activeDeals,
      introTitle: store.contentIntroTitle?.trim() || `More Information On ${store.name} Deals`,
      introParagraphs: [
        store.contentIntroParagraph1?.trim() || `${store.name} is listed on Couponchy with curated savings and regularly reviewed offer coverage.`,
        store.contentIntroParagraph2?.trim() || store.description,
      ],
      whyItems: customWhyItems.length ? customWhyItems : fallbackWhyItems,
      outro: store.contentOutro?.trim() || `Couponchy keeps ${store.name} inventory synced from the same source used by the admin dashboard.`,
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
    faqs: customFaqs.length ? customFaqs : fallbackFaqs,
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
  const scopedStores = filterStoresByCountry(stores, countryCode);
  const storeMap = new Map(scopedStores.map((store) => [store.slug, store]));
  const allowedStoreSlugs = new Set(scopedStores.map((store) => store.slug));
  const scopedOffers = offers.filter((offer) => allowedStoreSlugs.has(offer.storeSlug));
  const scopedProducts = products.filter((product) => allowedStoreSlugs.has(product.storeSlug));
  const homepageSections = settings.homepage.sections;

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
      ? orderItemsBySelection(scopedOffers, homepageSections.featuredCoupons.selectedOfferIds, (offer) => offer.id)
      : scopedOffers;

  const featuredProductsSource =
    homepageSections.featuredProducts.selectedProductIds?.length
      ? orderItemsBySelection(scopedProducts, homepageSections.featuredProducts.selectedProductIds, (product) => product.id)
      : scopedProducts;

  const rawTitle = homepageSections.latestStores.title || "";
  const categoriesTitle = rawTitle.toLowerCase().includes("store") ? "Browse Categories" : (rawTitle || "Browse Categories");

  return {
    hero: settings.homepage.hero,
    categoriesTitle,
    categories: categories.map((cat) => ({
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

  return {
    ...buildStoreDetail(store, offers, countryMatchedStores),
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

  return {
    singleStore: store,
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

export async function getStorePageMetadata(slug) {
  const [store, offers, settings] = await Promise.all([
    getStoreBySlug(slug),
    getOffersByStoreSlug(slug),
    getSettings(),
  ]);

  if (!store) {
    return null;
  }

  if (!settings.seo.autoGenerateStoreMetadata) {
    const year = new Date().getFullYear();
    return buildStoreMetadataFallback(
      store,
      offers,
      {
        offers: offers.length,
        coupons: offers.filter((offer) => offer.type === "Coupon").length,
        deals: offers.filter((offer) => offer.type === "Deal").length,
      },
      year
    );
  }

  return buildAutoStoreMetadata(settings, store, offers);
}
