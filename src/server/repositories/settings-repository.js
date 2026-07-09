import "server-only";

import { readCollection, writeCollection } from "@/server/database/json-store";
import { sanitizeCountryList, SUPPORTED_COUNTRIES } from "@/lib/countries";

const SETTINGS_FILE = "settings.json";

export const defaultSettings = {
  general: {
    siteName: "Couponchy",
    tagline: "Smart shopping, better saving.",
    supportEmail: "support@couponchy.com",
    countries: SUPPORTED_COUNTRIES,
    customHeadScript: "",
    customBodyStartScript: "",
    customBodyEndScript: "",
  },
  affiliate: {
    cjEnabled: true,
    cjAccount: "",
    rakutenEnabled: true,
    rakutenAccount: "",
    impactEnabled: true,
    impactAccount: "",
    syncFrequency: "Every 6 hours",
  },
  social: {
    facebook: "",
    instagram: "",
    x: "",
    tiktok: "",
    youtube: "",
    discord: "",
    pinterest: "",
    defaultShareText: "Verified coupons and deals from Couponchy.",
  },
  seo: {
    titleTemplate: "%s | Couponchy",
    metaDescription: "Verified coupons, deals, and store offers updated daily.",
    ogTitle: "Couponchy",
    ogDescription: "Discover verified coupons and deals for top stores.",
    robots: "index,follow",
    autoGenerateStoreMetadata: true,
    storeMetaTitleTemplate: "%store% %best_discount%% Off Discount & Coupon Codes %year%",
    storeMetaDescriptionTemplate:
      "Save with %offers_count% verified %store% coupon codes and deals on Couponchy. Best current offer: %best_offer%. Updated for %year%.",
  },
  homepage: {
    hero: {
      eyebrow: "Exclusive Daily Deals",
      titleLineOne: "Smart Shopping,",
      titleAccent: "Better Saving",
      description: "Unlock verified discounts from the world's leading brands. The smarter way to checkout.",
      searchPlaceholder: "Search stores, coupons, deals",
      searchButtonLabel: "Search Offers",
      memberCountText: "Join 126k+ members saving daily",
      slides: [
        {
          id: "hero-slide-1",
          image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
          badge: "Curated Deal Pick",
          kicker: "Live Now",
          title: "Flash Sale: Nike Air",
          description: "Fresh markdowns on sneakers, apparel, and accessories.",
          discount: "-40%",
          accent: "linear-gradient(140deg, rgba(255,72,48,0.24), transparent 48%)",
        },
        {
          id: "hero-slide-2",
          image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
          badge: "Tech Spotlight",
          kicker: "Just Dropped",
          title: "Luxury Smartwatch Week",
          description: "Fast-moving discounts on statement watches and premium wearables.",
          discount: "-32%",
          accent: "linear-gradient(140deg, rgba(41,196,255,0.24), transparent 48%)",
        },
        {
          id: "hero-slide-3",
          image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
          badge: "Color Burst Edit",
          kicker: "Trending",
          title: "Streetwear Heat Check",
          description: "Graphic essentials, bold fits, and limited-run fashion savings.",
          discount: "-28%",
          accent: "linear-gradient(140deg, rgba(255,175,37,0.22), transparent 48%)",
        },
        {
          id: "hero-slide-4",
          image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80",
          badge: "Travel Moodboard",
          kicker: "Weekend Escape",
          title: "Resort Style Deals",
          description: "High-color luggage, vacation fashion, and getaway-ready accessories.",
          discount: "-35%",
          accent: "linear-gradient(140deg, rgba(255,80,174,0.22), transparent 48%)",
        },
      ],
      cards: [
        {
          id: "card-1",
          amount: "20% OFF",
          max: "MAX $20.00",
          category: "VAULT",
          title: "Christmas Week Discount",
          tag: "EXPIRES 03/17",
          verified: false,
          rotation: "rotate(-6deg) translate(0px, 0px)",
          mobileRotation: "rotate(-4deg)",
          zIndex: 1,
        },
        {
          id: "card-2",
          amount: "$50 OFF",
          max: "MAX $20.00",
          category: "TECH",
          title: "Premium Electronics Sitewide",
          tag: "VERIFIED TODAY",
          verified: true,
          rotation: "rotate(3deg) translate(40px, 60px)",
          mobileRotation: "rotate(2deg)",
          zIndex: 2,
        },
        {
          id: "card-3",
          amount: "15% OFF",
          max: "NO MINIMUM",
          category: "SNEAKS",
          title: "Exclusive Member Deal",
          tag: "EXPIRES 04/02",
          verified: false,
          rotation: "rotate(-2deg) translate(70px, 130px)",
          mobileRotation: "rotate(-1deg)",
          zIndex: 3,
        },
      ],
      stats: [
        {
          value: "612K+",
          label: "Stores Verified",
          icon: "package",
          accent: false,
        },
        {
          value: "98%",
          label: "Accuracy Rate",
          icon: "check",
          accent: true,
        },
        {
          value: "4.6M+",
          label: "Monthly Verifications",
          icon: "globe",
          accent: false,
        },
        {
          value: "$1B+",
          label: "Saved at Checkout",
          icon: "dollar",
          accent: false,
        },
      ],
    },
    sections: {
      trendingStores: {
        title: "Trending Stores",
        selectedStoreSlugs: [],
        limit: 5,
      },
      featuredCoupons: {
        title: "Featured Coupons",
        selectedOfferIds: [],
        limit: 4,
      },
      featuredProducts: {
        title: "Featured Products",
        selectedProductIds: [],
        limit: 4,
      },
      latestStores: {
        title: "Latest Stores",
        selectedStoreSlugs: [],
        limit: 10,
      },
    },
  },
};

export async function getSettings() {
  const settings = await readCollection(SETTINGS_FILE, defaultSettings);
  return {
    ...defaultSettings,
    ...settings,
    general: {
      ...defaultSettings.general,
      ...settings.general,
      countries: sanitizeCountryList(settings.general?.countries || defaultSettings.general.countries),
    },
    affiliate: { ...defaultSettings.affiliate, ...settings.affiliate },
    social: { ...defaultSettings.social, ...settings.social },
    seo: { ...defaultSettings.seo, ...settings.seo },
    homepage: {
      ...defaultSettings.homepage,
      ...settings.homepage,
      hero: {
        ...defaultSettings.homepage.hero,
        ...settings.homepage?.hero,
        slides: settings.homepage?.hero?.slides?.length ? settings.homepage.hero.slides : defaultSettings.homepage.hero.slides,
        cards: settings.homepage?.hero?.cards?.length ? settings.homepage.hero.cards : defaultSettings.homepage.hero.cards,
        stats: settings.homepage?.hero?.stats?.length ? settings.homepage.hero.stats : defaultSettings.homepage.hero.stats,
      },
      sections: {
        ...defaultSettings.homepage.sections,
        ...settings.homepage?.sections,
        trendingStores: {
          ...defaultSettings.homepage.sections.trendingStores,
          ...settings.homepage?.sections?.trendingStores,
        },
        featuredCoupons: {
          ...defaultSettings.homepage.sections.featuredCoupons,
          ...settings.homepage?.sections?.featuredCoupons,
        },
        featuredProducts: {
          ...defaultSettings.homepage.sections.featuredProducts,
          ...settings.homepage?.sections?.featuredProducts,
        },
        latestStores: {
          ...defaultSettings.homepage.sections.latestStores,
          ...settings.homepage?.sections?.latestStores,
        },
      },
    },
  };
}

export async function updateSettings(payload) {
  const currentSettings = await getSettings();
  const nextSettings = {
    ...currentSettings,
    ...payload,
    general: {
      ...currentSettings.general,
      ...payload.general,
      countries: sanitizeCountryList(payload.general?.countries || currentSettings.general.countries),
    },
    affiliate: { ...currentSettings.affiliate, ...payload.affiliate },
    social: { ...currentSettings.social, ...payload.social },
    seo: { ...currentSettings.seo, ...payload.seo },
    homepage: {
      ...currentSettings.homepage,
      ...payload.homepage,
      hero: { ...currentSettings.homepage.hero, ...payload.homepage?.hero },
      sections: {
        ...currentSettings.homepage.sections,
        ...payload.homepage?.sections,
        trendingStores: {
          ...currentSettings.homepage.sections.trendingStores,
          ...payload.homepage?.sections?.trendingStores,
        },
        featuredCoupons: {
          ...currentSettings.homepage.sections.featuredCoupons,
          ...payload.homepage?.sections?.featuredCoupons,
        },
        featuredProducts: {
          ...currentSettings.homepage.sections.featuredProducts,
          ...payload.homepage?.sections?.featuredProducts,
        },
        latestStores: {
          ...currentSettings.homepage.sections.latestStores,
          ...payload.homepage?.sections?.latestStores,
        },
      },
    },
  };

  await writeCollection(SETTINGS_FILE, nextSettings);
  return nextSettings;
}
