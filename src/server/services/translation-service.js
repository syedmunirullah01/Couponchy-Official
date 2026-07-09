import "server-only";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

const LANGUAGE_NAMES = {
  de: "German",
  fr: "French",
  nl: "Dutch",
  pl: "Polish",
  it: "Italian",
  es: "Spanish",
  ar: "Arabic",
  ja: "Japanese",
  pt: "Portuguese",
  sv: "Swedish",
};

function getHash(text) {
  return crypto.createHash("md5").update(String(text).trim()).digest("hex");
}

async function callDeepSeek(text, langCode) {
  if (!DEEPSEEK_API_KEY) {
    console.warn("[callDeepSeek] DEEPSEEK_API_KEY is not defined in environments.");
    return text;
  }
  const langName = LANGUAGE_NAMES[langCode] || langCode;
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `You are an expert translator specializing in e-commerce, coupons, and SEO localization.
Translate the following text from English to ${langName}.

CRITICAL RULES:
1. Translate only human-readable descriptive text.
2. Keep the following technical terms and values EXACTLY as they are in the source text. Do NOT translate, modify, or transliterate them:
   - Brand names, store names (e.g., "Nike", "Apple", "Walmart", "Couponchy")
   - Coupon codes, promo codes (e.g., "SAVE20", "FREEFLOW")
   - Slugs, URLs, paths (e.g., "/store/nike", "https://nike.com")
   - HTML tags and their attributes (e.g., <span className="...">, <a>, etc.)
   - JSON keys and variable names/tokens (e.g., "%store%", "%best_discount%", "%year%")
   - Currency symbols ($ remains $, £ remains £, etc.)
   - Image/Logo URLs and filenames (e.g., "logo.png")
   - Product names
   - Email addresses and phone numbers
3. Ensure the tone is natural, professional, and SEO-friendly.
4. Retain all markdown formatting, paragraphs, list bullets, and structural spacing.
5. Provide ONLY the translated text in the output. Do not include any notes, explanations, or commentary.`,
        },
        { role: "user", content: text },
      ],
      temperature: 0.1,
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || text;
}

async function saveTranslation(entityType, entityId, fieldKey, language, translatedText, originalHash) {
  const { error } = await supabase.from("translations").upsert(
    { entity_type: entityType, entity_id: entityId, field_key: fieldKey, language, translated_text: translatedText, original_hash: originalHash, updated_at: new Date().toISOString() },
    { onConflict: "entity_type,entity_id,field_key,language" }
  );
  if (error) throw error;
}

export async function translateStoreOnSave(store) {
  if (!store || !store.countryCode) return;
  const country = String(store.countryCode).toUpperCase();
  const lang = COUNTRY_TO_LANG[country];
  if (!lang || lang === "en") return;

  try {
    const fields = [
      "description",
      "contentIntroTitle",
      "contentIntroParagraph1",
      "contentIntroParagraph2",
      "contentWhyItemsText",
      "contentOutro",
      "faq1Question",
      "faq1Answer",
      "faq2Question",
      "faq2Answer",
      "faq3Question",
      "faq3Answer",
    ];

    for (const field of fields) {
      const originalText = store[field];
      if (!originalText || typeof originalText !== "string" || !originalText.trim()) continue;

      const hash = getHash(originalText);

      // Check if up-to-date in DB
      const { data: existing } = await supabase
        .from("translations")
        .select("translated_text, original_hash")
        .eq("entity_type", "store")
        .eq("entity_id", String(store.id))
        .eq("field_key", field)
        .eq("language", lang)
        .single();

      if (!existing?.translated_text || existing.original_hash !== hash) {
        let translated = "";
        if (field === "contentWhyItemsText") {
          const lines = originalText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          const translatedLines = [];
          for (const line of lines) {
            const tLine = await callDeepSeek(line, lang);
            translatedLines.push(tLine);
          }
          translated = translatedLines.join("\n");
        } else {
          translated = await callDeepSeek(originalText, lang);
        }
        await saveTranslation("store", store.id, field, lang, translated, hash);
      }
    }
  } catch (err) {
    console.error(`[translateStoreOnSave] Failed to translate store ${store.slug}:`, err);
  }
}

export async function translateOfferOnSave(offer) {
  if (!offer || !offer.storeSlug) return;

  try {
    const { getStoreBySlug } = require("@/server/repositories/stores-repository");
    const store = await getStoreBySlug(offer.storeSlug);
    if (!store || !store.countryCode) return;

    const country = String(store.countryCode).toUpperCase();
    const lang = COUNTRY_TO_LANG[country];
    if (!lang || lang === "en") return;

    if (offer.title) {
      const titleHash = getHash(offer.title);
      const translatedTitle = await callDeepSeek(offer.title, lang);
      await saveTranslation("offer", offer.id, "title", lang, translatedTitle, titleHash);
    }

    if (offer.description && offer.description !== offer.title) {
      const descHash = getHash(offer.description);
      const translatedDesc = await callDeepSeek(offer.description, lang);
      await saveTranslation("offer", offer.id, "description", lang, translatedDesc, descHash);
    }
  } catch (err) {
    console.error(`[translateOfferOnSave] Failed to translate offer ${offer.id}:`, err);
  }
}


// Map countries/regions to their default languages
export const COUNTRY_TO_LANG = {
  US: "en",
  GB: "en",
  CA: "en",
  AU: "en",
  IN: "en",
  AE: "en", // UAE (English)
  CH: "en", // Switzerland (English)
  DE: "de", // German
  FR: "fr", // French
  NL: "nl", // Dutch
  PL: "pl", // Polish
  IT: "it", // Italian
  ES: "es", // Spanish
  SA: "ar", // Arabic (Saudi Arabia)
  JP: "ja", // Japanese
  PT: "pt", // Portuguese
  SE: "sv", // Swedish
};

// Fetch translations for a batch of entity IDs in a single database query (with 50-item chunking)
export async function getBatchTranslations(entityType, entityIds, language) {
  if (language === "en" || !entityIds || !entityIds.length) return {};

  const cleanIds = entityIds.filter(Boolean).map(String);
  if (!cleanIds.length) return {};

  // Chunk array into groups of 50 to avoid HTTP 431 / URI length limit errors
  const chunks = [];
  for (let i = 0; i < cleanIds.length; i += 50) {
    chunks.push(cleanIds.slice(i, i + 50));
  }

  try {
    const promises = chunks.map((chunk) =>
      supabase
        .from("translations")
        .select("entity_id, field_key, translated_text")
        .eq("entity_type", entityType)
        .eq("language", language)
        .in("entity_id", chunk)
    );

    const results = await Promise.all(promises);

    const mapping = {};
    for (const res of results) {
      if (res.error) {
        console.error(`[getBatchTranslations] Error in chunk query:`, res.error);
        continue;
      }
      if (res.data) {
        for (const item of res.data) {
          if (!mapping[item.entity_id]) {
            mapping[item.entity_id] = {};
          }
          mapping[item.entity_id][item.field_key] = item.translated_text;
        }
      }
    }
    return mapping;
  } catch (error) {
    console.error(`[getBatchTranslations] Exception:`, error);
    return {};
  }
}

// Fetch all translations for a single entity
export async function getEntityTranslations(entityType, entityId, language) {
  if (language === "en" || !entityId) return {};

  const { data, error } = await supabase
    .from("translations")
    .select("field_key, translated_text")
    .eq("entity_type", entityType)
    .eq("entity_id", String(entityId))
    .eq("language", language);

  if (error) {
    console.error(`[getEntityTranslations] Error loading translations:`, error);
    return {};
  }

  const translations = {};
  if (data) {
    for (const item of data) {
      translations[item.field_key] = item.translated_text;
    }
  }
  return translations;
}

export async function getEntityTranslationsWithHashes(entityType, entityId, language) {
  if (language === "en" || !entityId) return {};

  const { data, error } = await supabase
    .from("translations")
    .select("field_key, translated_text, original_hash")
    .eq("entity_type", entityType)
    .eq("entity_id", String(entityId))
    .eq("language", language);

  if (error) {
    console.error(`[getEntityTranslationsWithHashes] Error loading translations:`, error);
    return {};
  }

  const translations = {};
  if (data) {
    for (const item of data) {
      translations[item.field_key] = {
        text: item.translated_text,
        hash: item.original_hash
      };
    }
  }
  return translations;
}

// Utility to apply translations on a loaded object/entity
export function applyTranslations(entity, translations) {
  if (!entity || !translations) return entity;

  const result = { ...entity };
  for (const [key, val] of Object.entries(translations)) {
    if (val != null && val.trim()) {
      if (key.includes(".")) {
        const parts = key.split(".");
        let current = result;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) current[parts[i]] = {};
          current[parts[i]] = { ...current[parts[i]] };
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = val;
      } else {
        result[key] = val;
      }
    }
  }
  return result;
}

// Decorate a single store
export async function getTranslatedStore(store, lang) {
  if (!store || lang === "en") return store;
  const translations = await getEntityTranslations("store", store.id, lang);
  return applyTranslations(store, translations);
}

// Decorate a list of stores
export async function getTranslatedStores(stores, lang) {
  if (!stores || !stores.length || lang === "en") return stores;
  const storeIds = stores.map((s) => s.id);
  const translationsMap = await getBatchTranslations("store", storeIds, lang);
  return stores.map((s) => {
    const translations = translationsMap[s.id] || {};
    return applyTranslations(s, translations);
  });
}

export async function getBatchTranslationsWithHashes(entityType, entityIds, language) {
  if (language === "en" || !entityIds || !entityIds.length) return {};

  const cleanIds = entityIds.filter(Boolean).map(String);
  if (!cleanIds.length) return {};

  const chunks = [];
  for (let i = 0; i < cleanIds.length; i += 50) {
    chunks.push(cleanIds.slice(i, i + 50));
  }

  try {
    const promises = chunks.map((chunk) =>
      supabase
        .from("translations")
        .select("entity_id, field_key, translated_text, original_hash")
        .eq("entity_type", entityType)
        .eq("language", language)
        .in("entity_id", chunk)
    );

    const results = await Promise.all(promises);

    const mapping = {};
    for (const res of results) {
      if (res.error) {
        console.error(`[getBatchTranslationsWithHashes] Error in chunk query:`, res.error);
        continue;
      }
      if (res.data) {
        for (const item of res.data) {
          if (!mapping[item.entity_id]) {
            mapping[item.entity_id] = {};
          }
          mapping[item.entity_id][item.field_key] = {
            text: item.translated_text,
            hash: item.original_hash
          };
        }
      }
    }
    return mapping;
  } catch (error) {
    console.error(`[getBatchTranslationsWithHashes] Exception:`, error);
    return {};
  }
}

// Decorate a single offer with lazy translation
export async function getTranslatedOffer(offer, lang) {
  if (!offer || !lang || lang === "en") return offer;
  const decorated = await getTranslatedOffers([offer], lang);
  return decorated[0];
}

// Decorate a list of offers with lazy batch translation
export async function getTranslatedOffers(offers, lang) {
  if (!offers || !offers.length || !lang || lang === "en") return offers;

  const offerIds = offers.map((o) => String(o.id));
  const translationsMap = await getBatchTranslationsWithHashes("offer", offerIds, lang);

  const decorated = await Promise.all(
    offers.map(async (offer) => {
      const result = { ...offer };
      const offerId = String(offer.id);
      const offerTranslations = translationsMap[offerId] || {};

      const translateKey = async (fieldKey, originalText) => {
        if (!originalText || !originalText.trim()) return originalText;
        const currentHash = getHash(originalText);
        const dbEntry = offerTranslations[fieldKey];

        if (dbEntry && dbEntry.text && dbEntry.text.trim() && dbEntry.hash === currentHash) {
          return dbEntry.text;
        }

        callDeepSeek(originalText, lang)
          .then((translatedText) =>
            saveTranslation("offer", offerId, fieldKey, lang, translatedText, currentHash)
          )
          .catch((err) =>
            console.error(`[getTranslatedOffers] Background translation failed for ${fieldKey} in ${lang}:`, err)
          );

        return originalText;
      };

      if (offer.title) result.title = await translateKey("title", offer.title);
      if (offer.description && offer.description !== offer.title) {
        result.description = await translateKey("description", offer.description);
      } else if (offer.description) {
        result.description = result.title;
      }

      return result;
    })
  );

  return decorated;
}

// Decorate a single category
export async function getTranslatedCategory(category, lang) {
  if (!category || lang === "en") return category;
  const translations = await getEntityTranslations("category", category.id || category.slug, lang);
  return applyTranslations(category, translations);
}

// Decorate a list of categories
export async function getTranslatedCategories(categories, lang) {
  if (!categories || !categories.length || lang === "en") return categories;
  const categoryIds = categories.map((c) => c.id || c.slug);
  const translationsMap = await getBatchTranslations("category", categoryIds, lang);
  return categories.map((c) => {
    const translations = translationsMap[c.id || c.slug] || {};
    return applyTranslations(c, translations);
  });
}

// Decorate settings
export async function getTranslatedSettings(settings, lang) {
  if (!settings || lang === "en") return settings;

  const translations = await getEntityTranslationsWithHashes("settings", "global", lang);

  // For hero text fields: verify hash. If changed, fire background re-translation.
  const heroTextFields = ["eyebrow", "titleLineOne", "titleAccent", "titleLineTwo", "description", "searchPlaceholder", "searchButtonLabel", "memberCountText"];
  const hero = settings.homepage?.hero || {};

  for (const key of heroTextFields) {
    const originalText = hero[key];
    if (!originalText || !originalText.trim()) continue;

    const fieldKey = `homepage.hero.${key}`;
    const currentHash = getHash(originalText);
    const dbEntry = translations[fieldKey];

    if (!dbEntry || !dbEntry.text || !dbEntry.text.trim() || dbEntry.hash !== currentHash) {
      // Text changed or never translated — fire background re-translation
      callDeepSeek(originalText, lang)
        .then((translatedText) =>
          saveTranslation("settings", "global", fieldKey, lang, translatedText, currentHash)
        )
        .catch((err) =>
          console.error(`[getTranslatedSettings] Background re-translation failed for ${fieldKey} in ${lang}:`, err)
        );
    }
  }

  // Build a plain translations map (text only) for applyTranslations
  const plainTranslations = {};
  for (const [key, entry] of Object.entries(translations)) {
    if (entry && entry.text) plainTranslations[key] = entry.text;
  }

  return applyTranslations(settings, plainTranslations);
}


// Decorate a single event
export async function getTranslatedEvent(event, lang) {
  if (!event || lang === "en") return event;
  const translations = await getEntityTranslations("event", event.id || event.slug, lang);
  return applyTranslations(event, translations);
}

// Decorate a list of events
export async function getTranslatedEvents(events, lang) {
  if (!events || !events.length || lang === "en") return events;
  const eventIds = events.map((e) => e.id || e.slug);
  const translationsMap = await getBatchTranslations("event", eventIds, lang);
  return events.map((e) => {
    const translations = translationsMap[e.id || e.slug] || {};
    return applyTranslations(e, translations);
  });
}

// Bulk translation on save helpers
export async function translateStoresBulkOnSave(stores) {
  if (!stores || !stores.length) return;
  for (const store of stores) {
    translateStoreOnSave(store).catch((err) =>
      console.error(`[translateStoresBulkOnSave] Failed for ${store.slug}:`, err)
    );
  }
}

export async function translateOffersBulkOnSave(offers) {
  if (!offers || !offers.length) return;
  for (const offer of offers) {
    translateOfferOnSave(offer).catch((err) =>
      console.error(`[translateOffersBulkOnSave] Failed for ${offer.id}:`, err)
    );
  }
}

// Get all active target languages configured in the admin panel settings
export async function getActiveLanguages() {
  try {
    const { getSettings } = require("@/server/repositories/settings-repository");
    const settings = await getSettings();
    const countries = settings.general?.countries || [];
    return [...new Set(
      countries.map(c => COUNTRY_TO_LANG[c.code?.toUpperCase()]).filter(l => l && l !== "en")
    )];
  } catch (err) {
    console.error("[getActiveLanguages] Failed to load settings:", err);
    return [];
  }
}

// Background auto translation for Categories
export async function translateCategoryOnSave(category, passedLangs = null) {
  if (!category || (!category.name && !category.description)) return;
  try {
    const activeLangs = passedLangs || await getActiveLanguages();
    if (!activeLangs.length) return;

    const categoryId = category.id || category.slug;

    if (category.name) {
      const hash = getHash(category.name);
      for (const lang of activeLangs) {
        const translated = await callDeepSeek(category.name, lang);
        await saveTranslation("category", categoryId, "name", lang, translated, hash);
      }
    }

    if (category.description) {
      const hash = getHash(category.description);
      for (const lang of activeLangs) {
        const translated = await callDeepSeek(category.description, lang);
        await saveTranslation("category", categoryId, "description", lang, translated, hash);
      }
    }
  } catch (err) {
    console.error("[translateCategoryOnSave] Failed to translate category:", err);
  }
}

// Background auto translation for Events
export async function translateEventOnSave(event, passedLangs = null) {
  if (!event || (!event.name && !event.description)) return;
  try {
    const activeLangs = passedLangs || await getActiveLanguages();
    if (!activeLangs.length) return;

    const eventId = event.id || event.slug;

    if (event.name) {
      const hash = getHash(event.name);
      for (const lang of activeLangs) {
        const translated = await callDeepSeek(event.name, lang);
        await saveTranslation("event", eventId, "name", lang, translated, hash);
      }
    }

    if (event.description) {
      const hash = getHash(event.description);
      for (const lang of activeLangs) {
        const translated = await callDeepSeek(event.description, lang);
        await saveTranslation("event", eventId, "description", lang, translated, hash);
      }
    }
  } catch (err) {
    console.error("[translateEventOnSave] Failed to translate event:", err);
  }
}

// Background auto translation for Blog posts
export async function translateBlogOnSave(blog, passedLangs = null) {
  if (!blog || (!blog.title && !blog.excerpt && !blog.content)) return;
  try {
    const activeLangs = passedLangs || await getActiveLanguages();
    if (!activeLangs.length) return;

    const blogId = blog.id || blog.slug;

    if (blog.title) {
      const hash = getHash(blog.title);
      for (const lang of activeLangs) {
        const translated = await callDeepSeek(blog.title, lang);
        await saveTranslation("blog", blogId, "title", lang, translated, hash);
      }
    }

    if (blog.excerpt) {
      const hash = getHash(blog.excerpt);
      for (const lang of activeLangs) {
        const translated = await callDeepSeek(blog.excerpt, lang);
        await saveTranslation("blog", blogId, "excerpt", lang, translated, hash);
      }
    }

    if (blog.content) {
      const hash = getHash(blog.content);
      for (const lang of activeLangs) {
        const translated = await callDeepSeek(blog.content, lang);
        await saveTranslation("blog", blogId, "content", lang, translated, hash);
      }
    }
  } catch (err) {
    console.error("[translateBlogOnSave] Failed to translate blog:", err);
  }
}

// Bulk translate all categories for active languages
export async function translateAllCategoriesBulk(activeLangs) {
  try {
    const { getAllCategories } = require("@/server/repositories/categories-repository");
    const categories = await getAllCategories().catch(() => []);
    for (const category of categories) {
      await translateCategoryOnSave(category, activeLangs);
    }
  } catch (err) {
    console.error("[translateAllCategoriesBulk] Failed:", err);
  }
}

// Bulk translate all events for active languages
export async function translateAllEventsBulk(activeLangs) {
  try {
    const { getAllEvents } = require("@/server/repositories/events-repository");
    const events = await getAllEvents().catch(() => []);
    for (const event of events) {
      await translateEventOnSave(event, activeLangs);
    }
  } catch (err) {
    console.error("[translateAllEventsBulk] Failed:", err);
  }
}

// Bulk translate all blogs for active languages
export async function translateAllBlogsBulk(activeLangs) {
  try {
    const { getAllBlogPosts } = require("@/server/repositories/blog-repository");
    const blogs = await getAllBlogPosts().catch(() => []);
    for (const blog of blogs) {
      await translateBlogOnSave(blog, activeLangs);
    }
  } catch (err) {
    console.error("[translateAllBlogsBulk] Failed:", err);
  }
}

// Bulk translate existing stores matching new country codes
export async function translateAllStoresForLangs(activeLangs) {
  try {
    const { getAllStores } = require("@/server/repositories/stores-repository");
    const stores = await getAllStores().catch(() => []);
    for (const store of stores) {
      if (store.countryCode) {
        const lang = COUNTRY_TO_LANG[String(store.countryCode).toUpperCase()];
        if (lang && activeLangs.includes(lang)) {
          await translateStoreOnSave(store);
        }
      }
    }
  } catch (err) {
    console.error("[translateAllStoresForLangs] Failed:", err);
  }
}

// Background auto translation for Homepage settings
// Hash-check ensures API is called ONCE per unique text — already-translated content is skipped.
export async function translateSettingsOnSave(settings) {
  if (!settings) return;
  try {
    const activeLangs = await getActiveLanguages();
    if (!activeLangs.length) return;

    // Pre-fetch all existing homepage translations in one batch query
    const { data: existingRows } = await supabase
      .from("translations")
      .select("field_key, language, original_hash")
      .eq("entity_type", "settings")
      .eq("entity_id", "global");

    // Build a lookup: existingMap[lang][field_key] = original_hash
    const existingMap = {};
    for (const row of existingRows || []) {
      if (!existingMap[row.language]) existingMap[row.language] = {};
      existingMap[row.language][row.field_key] = row.original_hash;
    }

    // Helper: only call DeepSeek if text is new or changed
    const translateIfChanged = async (fieldKey, originalText, lang) => {
      if (!originalText || !originalText.trim()) return;
      const hash = getHash(originalText);
      const savedHash = existingMap[lang]?.[fieldKey];
      if (savedHash === hash) return; // Already up-to-date, skip API call
      const translated = await callDeepSeek(originalText, lang);
      await saveTranslation("settings", "global", fieldKey, lang, translated, hash);
    };

    const hero = settings.homepage?.hero || {};
    const heroTextFields = ["eyebrow", "titleLineOne", "titleAccent", "titleLineTwo", "description", "searchPlaceholder", "searchButtonLabel", "memberCountText"];
    for (const key of heroTextFields) {
      if (hero[key]) {
        for (const lang of activeLangs) {
          await translateIfChanged(`homepage.hero.${key}`, hero[key], lang);
        }
      }
    }

    const slides = hero.slides || [];
    for (let idx = 0; idx < slides.length; idx++) {
      const slide = slides[idx];
      for (const key of ["badge", "kicker", "title", "description"]) {
        if (slide[key]) {
          for (const lang of activeLangs) {
            await translateIfChanged(`homepage.hero.slides.${idx}.${key}`, slide[key], lang);
          }
        }
      }
    }

    const cards = hero.cards || [];
    for (let idx = 0; idx < cards.length; idx++) {
      const card = cards[idx];
      for (const key of ["title", "category", "tag"]) {
        if (card[key]) {
          for (const lang of activeLangs) {
            await translateIfChanged(`homepage.hero.cards.${idx}.${key}`, card[key], lang);
          }
        }
      }
    }

    const statsList = hero.stats || [];
    for (let idx = 0; idx < statsList.length; idx++) {
      const stat = statsList[idx];
      if (stat.label) {
        for (const lang of activeLangs) {
          await translateIfChanged(`homepage.hero.stats.${idx}.label`, stat.label, lang);
        }
      }
    }

    const sections = settings.homepage?.sections || {};
    for (const secKey of ["trendingStores", "featuredCoupons", "featuredProducts", "latestStores"]) {
      if (sections[secKey]?.title) {
        for (const lang of activeLangs) {
          await translateIfChanged(`homepage.sections.${secKey}.title`, sections[secKey].title, lang);
        }
      }
    }

    // Auto-trigger footer and navbar translations for the active languages
    translateFooterOnSave(activeLangs).catch((err) =>
      console.error("[translateSettingsOnSave] Footer auto-translation failed:", err)
    );
    translateNavbarOnSave(activeLangs).catch((err) =>
      console.error("[translateSettingsOnSave] Navbar auto-translation failed:", err)
    );
    translateBlogUIOnSave(activeLangs).catch((err) =>
      console.error("[translateSettingsOnSave] Blog UI auto-translation failed:", err)
    );
    translateExclusiveUIOnSave(activeLangs).catch((err) =>
      console.error("[translateSettingsOnSave] Exclusive UI auto-translation failed:", err)
    );

    // Dynamic metadata auto-translations (Categories, Events, Blogs, Stores)
    translateAllCategoriesBulk(activeLangs).catch((err) =>
      console.error("[translateSettingsOnSave] Categories bulk auto-translation failed:", err)
    );
    translateAllEventsBulk(activeLangs).catch((err) =>
      console.error("[translateSettingsOnSave] Events bulk auto-translation failed:", err)
    );
    translateAllBlogsBulk(activeLangs).catch((err) =>
      console.error("[translateSettingsOnSave] Blogs bulk auto-translation failed:", err)
    );
    translateAllStoresForLangs(activeLangs).catch((err) =>
      console.error("[translateSettingsOnSave] Stores bulk auto-translation failed:", err)
    );

    // Fetch company content to translate About, Contact, and Privacy pages automatically
    try {
      const { getCompanyContent } = require("@/server/repositories/company-repository");
      getCompanyContent()
        .then((company) => {
          if (company) {
            translateAboutOnSave(activeLangs, company.aboutUs || {}).catch((err) =>
              console.error("[translateSettingsOnSave] About auto-translation failed:", err)
            );
            translateContactOnSave(activeLangs, company.contactUs || {}).catch((err) =>
              console.error("[translateSettingsOnSave] Contact auto-translation failed:", err)
            );
            translatePrivacyOnSave(activeLangs, company.privacyPolicy || {}).catch((err) =>
              console.error("[translateSettingsOnSave] Privacy auto-translation failed:", err)
            );
          }
        })
        .catch((err) =>
          console.error("[translateSettingsOnSave] Failed to get company content for auto-translation:", err)
        );
    } catch (err) {
      console.error("[translateSettingsOnSave] Failed to require company-repository:", err);
    }

  } catch (err) {
    console.error("[translateSettingsOnSave] Failed to translate settings:", err);
  }
}
const DEFAULT_FOOTER = {
  howWeVerify: "How We Verify",
  topStores: "Top Stores",
  company: "Company",
  stayInLoop: "Stay In The Loop",
  joinElite: "Join The Elite",
  subscribeDesc: "Subscribe For Updates, Featured Drops, And Store Highlights. Never Miss A Deal.",
  allVerified: "All Coupons Verified By Our Automated System",
  allRightsReserved: "All Rights Reserved.",
  "About Us": "About Us",
  "Contact Us": "Contact Us",
  "Privacy Policy": "Privacy Policy",
  "Terms Of Service": "Terms Of Service",
  "Sitemap": "Sitemap",
  verify_title_0: "Automatic Discovery",
  verify_desc_0: "Scan 10+ community and aggregator networks daily.",
  verify_title_1: "Official Presence",
  verify_desc_1: "Confirm validity directly against merchant promo pages.",
  verify_title_2: "Simulated Checkout",
  verify_desc_2: "Deploy headless Playwright agents to verify discount application.",
  verify_title_3: "Badge Approval",
  verify_desc_3: "Publish and prioritize coupons that pass checkout validation."
};

const FALLBACK_FOOTERS = {
  de: {
    howWeVerify: "Wie wir verifizieren",
    topStores: "Top-Shops",
    company: "Unternehmen",
    stayInLoop: "Bleiben Sie auf dem Laufenden",
    joinElite: "Treten Sie der Elite bei",
    subscribeDesc: "Abonnieren Sie Updates, exklusive Angebote und Shop-Highlights. Verpassen Sie keinen Deal.",
    allVerified: "Alle Gutscheine von unserem automatisierten System verifiziert",
    allRightsReserved: "Alle Rechte vorbehalten.",
    "About Us": "Über uns",
    "Contact Us": "Kontaktieren Sie uns",
    "Privacy Policy": "Datenschutzrichtlinie",
    "Terms Of Service": "Nutzungsbedingungen",
    "Sitemap": "Sitemap",
    verify_title_0: "Automatische Erkennung",
    verify_desc_0: "Täglicher Scan von über 10 Community- und Aggregator-Netzwerken.",
    verify_title_1: "Offizielle Präsenz",
    verify_desc_1: "Gültigkeit direkt mit Händler-Promoseiten abgleichen.",
    verify_title_2: "Simulierter Checkout",
    verify_desc_2: "Einsatz von Headless-Playwright-Agents zur Überprüfung der Rabattanwendung.",
    verify_title_3: "Geprüfte Freigabe",
    verify_desc_3: "Gutscheine veröffentlichen und priorisieren, die die Checkout-Prüfung bestehen."
  },
  fr: {
    howWeVerify: "Comment nous vérifions",
    topStores: "Meilleurs magasins",
    company: "Entreprise",
    stayInLoop: "Restez informé",
    joinElite: "Rejoignez l'élite",
    subscribeDesc: "Abonnez-vous pour recevoir les mises à jour, les offres exclusives et les points forts des magasins. Ne manquez jamais une offre.",
    allVerified: "Tous les coupons sont vérifiés par notre système automatisé",
    allRightsReserved: "Tous droits réservés.",
    "About Us": "À propos de nous",
    "Contact Us": "Contactez-nous",
    "Privacy Policy": "Politique de confidentialité",
    "Terms Of Service": "Conditions d'utilisation",
    "Sitemap": "Plan du site",
    verify_title_0: "Découverte automatique",
    verify_desc_0: "Analyse quotidienne de plus de 10 réseaux communautaires et agrégateurs.",
    verify_title_1: "Présence officielle",
    verify_desc_1: "Vérifier la validité directement auprès des pages promotionnelles des commerçants.",
    verify_title_2: "Validation simulée",
    verify_desc_2: "Déployer des agents Playwright sans interface pour vérifier l'application de la réduction.",
    verify_title_3: "Validation du badge",
    verify_desc_3: "Publier et prioriser les coupons qui réussissent la validation de la commande."
  },
  nl: {
    howWeVerify: "Hoe wij verifiëren",
    topStores: "Beste winkels",
    company: "Bedrijf",
    stayInLoop: "Blijf op de hoogte",
    joinElite: "Sluit je aan bij de elite",
    subscribeDesc: "Meld je aan voor updates, exclusieve aanbiedingen en winkel-highlights. Mis nooit een deal.",
    allVerified: "Alle kortingsbonnen geverifieerd door ons geautomatiseerde systeem",
    allRightsReserved: "Alle rechten voorbehouden.",
    "About Us": "Over ons",
    "Contact Us": "Neem contact met ons op",
    "Privacy Policy": "Privacybeleid",
    "Terms Of Service": "Servicevoorwaarden",
    "Sitemap": "Sitemap",
    verify_title_0: "Automatische ontdekking",
    verify_desc_0: "Scant dagelijks meer dan 10 community- en aggregatornetwerken.",
    verify_title_1: "Officiële aanwezigheid",
    verify_desc_1: "Geldigheid direct verifiëren met promotiepagina's van winkels.",
    verify_title_2: "Gesimuleerde kassa",
    verify_desc_2: "Gebruikt headless Playwright-agents om de kortingstoepassing te controleren.",
    verify_title_3: "Badge goedkeuring",
    verify_desc_3: "Publiceert en prioriteert coupons die de kassavalidatie doorstaan."
  },
  pl: {
    howWeVerify: "Jak weryfikujemy",
    topStores: "Najlepsze sklepy",
    company: "Firma",
    stayInLoop: "Bądź na bieżąco",
    joinElite: "Dołącz do elity",
    subscribeDesc: "Zapisz się, aby otrzymywać aktualizacje, wybrane oferty i najważniejsze wydarzenia ze sklepów. Nie przegap żadnej okazji.",
    allVerified: "Wszystkie kupony zweryfikowane przez nasz zautomatyzowany system",
    allRightsReserved: "Wszelkie prawa zastrzeżone.",
    "About Us": "O nas",
    "Contact Us": "Kontakt z nami",
    "Privacy Policy": "Polityka prywatności",
    "Terms Of Service": "Warunki świadczenia usług",
    "Sitemap": "Mapa strony",
    verify_title_0: "Automatyczne wykrywanie",
    verify_desc_0: "Codzienne skanowanie ponad 10 sieci społecznościowych i agregatorów.",
    verify_title_1: "Oficjalna obecność",
    verify_desc_1: "Potwierdzaj ważność bezpośrednio na stronach promocyjnych sprzedawców.",
    verify_title_2: "Symulowana kasa",
    verify_desc_2: "Uruchamiaj bezgłowych agentów Playwright w celu weryfikacji zastosowania rabatu.",
    verify_title_3: "Zatwierdzenie odznaki",
    verify_desc_3: "Publikuj i priorytetuj kupony, które przejdą weryfikację przy kasie."
  },
  it: {
    howWeVerify: "Come verifichiamo",
    topStores: "I migliori negozi",
    company: "Azienda",
    stayInLoop: "Rimani aggiornato",
    joinElite: "Unisciti all'élite",
    subscribeDesc: "Iscriviti per aggiornamenti, offerte esclusive e novità dai negozi. Non perdere mai un affare.",
    allVerified: "Tutti i coupon sono verificati dal nostro sistema automatizzato",
    allRightsReserved: "Tutti i diritti riservati.",
    "About Us": "Chi siamo",
    "Contact Us": "Contattaci",
    "Privacy Policy": "Informativa sulla privacy",
    "Terms Of Service": "Termini di servizio",
    "Sitemap": "Mappa del sito",
    verify_title_0: "Rilevamento automatico",
    verify_desc_0: "Scansione quotidiana di oltre 10 reti comunitarie e aggregatori.",
    verify_title_1: "Presenza ufficiale",
    verify_desc_1: "Conferma la validità direttamente sulle pagine promozionali dei venditori.",
    verify_title_2: "Checkout simulato",
    verify_desc_2: "Distribuisci agenti Playwright headless per verificare l'applicazione dello sconto.",
    verify_title_3: "Approvazione del badge",
    verify_desc_3: "Pubblica e dai la priorità ai coupon che superano la convalida del checkout."
  },
  es: {
    howWeVerify: "Cómo verificamos",
    topStores: "Mejores tiendas",
    company: "Compañía",
    stayInLoop: "Mantente informado",
    joinElite: "Únete a la élite",
    subscribeDesc: "Suscríbete para recibir actualizaciones, ofertas destacadas e información sobre tiendas. No te pierdas ninguna oferta.",
    allVerified: "Todos los cupones están verificados por nuestro sistema automatizado",
    allRightsReserved: "Todos los derechos reservados.",
    "About Us": "Sobre nosotros",
    "Contact Us": "Contáctenos",
    "Privacy Policy": "Política de privacidad",
    "Terms Of Service": "Términos de servicio",
    "Sitemap": "Mapa del sitio",
    verify_title_0: "Descubrimiento automático",
    verify_desc_0: "Escaneo diario de más de 10 redes comunitarias y agregadoras.",
    verify_title_1: "Presencia oficial",
    verify_desc_1: "Confirma la validez directamente en las páginas de promoción de los comercios.",
    verify_title_2: "Pago simulado",
    verify_desc_2: "Despliega agentes Playwright sin cabezal para verificar la aplicación de descuentos.",
    verify_title_3: "Aprobación de la insignia",
    verify_desc_3: "Publica y prioriza cupones que superan la validación del proceso de pago."
  },
  ar: {
    howWeVerify: "كيف نتحقق",
    topStores: "أفضل المتاجر",
    company: "الشركة",
    stayInLoop: "كن في الصورة",
    joinElite: "انضم إلى النخبة",
    subscribeDesc: "اشترك للحصول على التحديثات، العروض الحصرية، وأبرز المتاجر. لا تفوت أي صفقة.",
    allVerified: "تم التحقق من جميع الكوبونات بواسطة نظامنا الآلي",
    allRightsReserved: "جميع الحقوق محفوظة.",
    "About Us": "من نحن",
    "Contact Us": "اتصل بنا",
    "Privacy Policy": "سياسة الخصوصية",
    "Terms Of Service": "شروط الخدمة",
    "Sitemap": "خريطة الموقع",
    verify_title_0: "الاكتشاف التلقائي",
    verify_desc_0: "فحص أكثر من 10 شبكات مجتمعية وتجميعية يوميًا.",
    verify_title_1: "التواجد الرسمي",
    verify_desc_1: "تأكيد الصلاحية مباشرة من الصفحات الترويجية للتجار.",
    verify_title_2: "المحاكاة الكاملة للدفع",
    verify_desc_2: "نشر وكلاء Playwright للتحقق من تطبيق الخصم تلقائياً.",
    verify_title_3: "اعتماد الشارة",
    verify_desc_3: "نشر الكوبونات التي تجتاز عملية التحقق من الدفع وإعطائها الأولوية."
  }
};

export async function getTranslatedFooter(lang) {
  if (!lang || lang === "en") {
    return DEFAULT_FOOTER;
  }

  try {
    const translations = await getEntityTranslationsWithHashes("settings", "footer", lang);
    const result = { ...DEFAULT_FOOTER, ...(FALLBACK_FOOTERS[lang] || {}) };

    // Use DB translation if it exists and hash matches, otherwise queue background DeepSeek translation
    for (const key of Object.keys(DEFAULT_FOOTER)) {
      const originalText = DEFAULT_FOOTER[key];
      const currentHash = getHash(originalText);
      const dbEntry = translations[key];

      if (dbEntry && dbEntry.text && dbEntry.text.trim() && dbEntry.hash === currentHash) {
        result[key] = dbEntry.text;
      } else {
        callDeepSeek(originalText, lang)
          .then((translatedText) =>
            saveTranslation("settings", "footer", key, lang, translatedText, currentHash)
          )
          .catch((err) =>
            console.error(`[getTranslatedFooter] Background translation failed for ${key} in ${lang}:`, err)
          );
      }
    }

    return result;
  } catch (err) {
    console.error(`[getTranslatedFooter] Translation failed for ${lang}:`, err);
    return { ...DEFAULT_FOOTER, ...(FALLBACK_FOOTERS[lang] || {}) };
  }
}
const DEFAULT_NAVBAR = {
  findMerchants: "Find Merchants",
  events: "Events",
  exclusive: "Exclusive",
  blog: "Blog",
  countryLabel: "Country",
  searchPlaceholder: "Search stores, coupons, deals",
  allCategories: "All Categories",
  browseCatalog: "Browse the full catalog",
  allLabel: "All",
  storesLabel: "stores",
  noStoresAvailable: "No stores available yet.",
  noStoresInCategory: "No stores in this category yet.",
  noOffersYet: "No offers yet.",
  noPostsYet: "No posts yet.",
  seeMore: "See More",
  usedLabel: "Used",
  timesLabel: "times",
  codesLabel: "Codes",
  codeLabel: "Code",
  offersLabel: "offers",
  newLabel: "New",
  exploreStoreLabel: "Explore",
  searchMerchantsPlaceholder: "Search Merchants..."
};


const FALLBACK_NAVBARS = {
  de: {
    findMerchants: "Händler finden",
    events: "Events",
    exclusive: "Exklusiv",
    blog: "Blog",
    countryLabel: "Land",
    searchPlaceholder: "Nach Shop suchen (z.B. nike.com)",
    popularStores: "Beliebte Shops",
    allCategories: "Alle Kategorien",
    recentDeals: "Neueste Deals",
    liveDeals: "Aktive Deals",
    noDealsYet: "Noch keine Deals",
    oneLiveDeal: "1 aktiver Deal",
    liveDealsCountText: "aktive Deals",
    recentlyAdded: "Kürzlich hinzugefügt",
    today: "Heute",
    oneDayAgo: "Vor 1 Tag",
    daysAgo: "Tage vor",
    moAgo: "Monate vor",
    usedRecently: "Kürzlich verwendet",
    usedKTimes: "K Mal verwendet",
    usedTimes: "Mal verwendet",
    noStoresFound: "Keine Shops gefunden.",
    searchMerchantsPlaceholder: "Händler suchen..."
  },
  fr: {
    findMerchants: "Trouver des marchands",
    events: "Événements",
    exclusive: "Exclusif",
    blog: "Blog",
    countryLabel: "Pays",
    searchPlaceholder: "Rechercher un magasin (ex. nike.com)",
    popularStores: "Magasins populaires",
    allCategories: "Toutes les catégories",
    recentDeals: "Offres récentes",
    liveDeals: "Offres en cours",
    noDealsYet: "Pas encore d'offres",
    oneLiveDeal: "1 offre en cours",
    liveDealsCountText: "offres en cours",
    recentlyAdded: "Récemment ajouté",
    today: "Aujourd'hui",
    oneDayAgo: "Il y a 1 jour",
    daysAgo: "jours",
    moAgo: "mois",
    usedRecently: "Utilisé récemment",
    usedKTimes: "Utilisé K fois",
    usedTimes: "Utilisé fois",
    noStoresFound: "Aucun magasin trouvé.",
    searchMerchantsPlaceholder: "Rechercher des marchands..."
  },
  nl: {
    findMerchants: "Winkels zoeken",
    events: "Evenementen",
    exclusive: "Exclusief",
    blog: "Blog",
    countryLabel: "Land",
    searchPlaceholder: "Zoek een winkel (bijv. nike.com)",
    popularStores: "Populaire winkels",
    allCategories: "Alle categorieën",
    recentDeals: "Recente aanbiedingen",
    liveDeals: "Live aanbiedingen",
    noDealsYet: "Nog geen aanbiedingen",
    oneLiveDeal: "1 live aanbieding",
    liveDealsCountText: "live aanbiedingen",
    recentlyAdded: "Onlangs toegevoegd",
    today: "Vandaag",
    oneDayAgo: "1 dag geleden",
    daysAgo: "dagen geleden",
    moAgo: "maanden geleden",
    usedRecently: "Onlangs gebruikt",
    usedKTimes: "K keer gebruikt",
    usedTimes: "keer gebruikt",
    noStoresFound: "Geen winkels gevonden.",
    searchMerchantsPlaceholder: "Zoek winkels..."
  },
  pl: {
    findMerchants: "Znajdź sklepy",
    events: "Wydarzenia",
    exclusive: "Ekskluzywne",
    blog: "Blog",
    countryLabel: "Kraj",
    searchPlaceholder: "Wyszukaj sklep (np. nike.com)",
    popularStores: "Popularne sklepy",
    allCategories: "Wszystkie kategorie",
    recentDeals: "Ostatnie oferty",
    liveDeals: "Aktualne oferty",
    noDealsYet: "Brak ofert",
    oneLiveDeal: "1 aktualna oferta",
    liveDealsCountText: "aktualne oferty",
    recentlyAdded: "Ostatnio dodane",
    today: "Dzisiaj",
    oneDayAgo: "1 dzień temu",
    daysAgo: "dni temu",
    moAgo: "mies. temu",
    usedRecently: "Użyte niedawno",
    usedKTimes: "Użyte K tys. razy",
    usedTimes: "Użyte razy",
    noStoresFound: "Nie znaleziono sklepów.",
    searchMerchantsPlaceholder: "Szukaj sklepów..."
  },
  it: {
    findMerchants: "Trova negozi",
    events: "Eventi",
    exclusive: "Esclusivo",
    blog: "Blog",
    countryLabel: "Paese",
    searchPlaceholder: "Cerca un negozio (es. nike.com)",
    popularStores: "Negozi popolari",
    allCategories: "Tutte le categorie",
    recentDeals: "Offerte recenti",
    liveDeals: "Offerte attive",
    noDealsYet: "Nessuna offerta",
    oneLiveDeal: "1 offerta attiva",
    liveDealsCountText: "offerte attive",
    recentlyAdded: "Aggiunto di recente",
    today: "Oggi",
    oneDayAgo: "1 giorno fa",
    daysAgo: "giorni fa",
    moAgo: "mesi fa",
    usedRecently: "Usato di recente",
    usedKTimes: "Usato K volte",
    usedTimes: "Usato volte",
    noStoresFound: "Nessun negozio trovato.",
    searchMerchantsPlaceholder: "Cerca negozi..."
  },
  es: {
    findMerchants: "Buscar tiendas",
    events: "Eventos",
    exclusive: "Exclusivo",
    blog: "Blog",
    countryLabel: "País",
    searchPlaceholder: "Buscar tienda (ej. nike.com)",
    popularStores: "Tiendas populares",
    allCategories: "Todas las categorías",
    recentDeals: "Ofertas recientes",
    liveDeals: "Ofertas activas",
    noDealsYet: "Aún no hay ofertas",
    oneLiveDeal: "1 oferta activa",
    liveDealsCountText: "ofertas activas",
    recentlyAdded: "Agregado recientemente",
    today: "Hoy",
    oneDayAgo: "Hace 1 día",
    daysAgo: "días atrás",
    moAgo: "meses atrás",
    usedRecently: "Usado recientemente",
    usedKTimes: "Usado K veces",
    usedTimes: "Usado veces",
    noStoresFound: "No se encontraron tiendas.",
    searchMerchantsPlaceholder: "Buscar tiendas..."
  },
  ar: {
    findMerchants: "البحث عن المتاجر",
    events: "الفعاليات",
    exclusive: "حصري",
    blog: "المدونة",
    countryLabel: "البلد",
    searchPlaceholder: "ابحث عن أي متجر (مثال: nike.com)",
    popularStores: "المتاجر الشائعة",
    allCategories: "جميع الفئات",
    recentDeals: "العروض الأخيرة",
    liveDeals: "العروض المتاحة",
    noDealsYet: "لا توجد عروض بعد",
    oneLiveDeal: "عرض واحد متاح",
    liveDealsCountText: "عروض متاحة",
    recentlyAdded: "أضيف حديثاً",
    today: "اليوم",
    oneDayAgo: "منذ يوم واحد",
    daysAgo: "أيام مضت",
    moAgo: "أشهر مضت",
    usedRecently: "استخدم مؤخراً",
    usedKTimes: "استخدم K مرة",
    usedTimes: "استخدم مرة",
    noStoresFound: "لم يتم العثور على متاجر.",
    searchMerchantsPlaceholder: "البحث عن المتاجر..."
  }
};

export async function getTranslatedNavbar(lang) {
  if (!lang || lang === "en") {
    return DEFAULT_NAVBAR;
  }

  try {
    const translations = await getEntityTranslationsWithHashes("settings", "navbar", lang);
    const result = { ...DEFAULT_NAVBAR, ...(FALLBACK_NAVBARS[lang] || {}) };

    // Use DB translation if it exists and hash matches, otherwise queue background DeepSeek translation
    for (const key of Object.keys(DEFAULT_NAVBAR)) {
      const originalText = DEFAULT_NAVBAR[key];
      const currentHash = getHash(originalText);
      const dbEntry = translations[key];

      if (dbEntry && dbEntry.text && dbEntry.text.trim() && dbEntry.hash === currentHash) {
        result[key] = dbEntry.text;
      } else {
        callDeepSeek(originalText, lang)
          .then((translatedText) =>
            saveTranslation("settings", "navbar", key, lang, translatedText, currentHash)
          )
          .catch((err) =>
            console.error(`[getTranslatedNavbar] Background translation failed for ${key} in ${lang}:`, err)
          );
      }
    }

    return result;
  } catch (err) {
    console.error(`[getTranslatedNavbar] Translation failed for ${lang}:`, err);
    return { ...DEFAULT_NAVBAR, ...(FALLBACK_NAVBARS[lang] || {}) };
  }
}

export async function translateFooterOnSave(activeLangs) {
  for (const lang of activeLangs) {
    if (lang === "en") continue;
    for (const key of Object.keys(DEFAULT_FOOTER)) {
      const originalText = DEFAULT_FOOTER[key];
      const hash = getHash(originalText);

      const { data: existing } = await supabase
        .from("translations")
        .select("translated_text")
        .eq("entity_type", "settings")
        .eq("entity_id", "footer")
        .eq("field_key", key)
        .eq("language", lang)
        .single();

      if (!existing?.translated_text) {
        const translated = await callDeepSeek(originalText, lang);
        await saveTranslation("settings", "footer", key, lang, translated, hash);
      }
    }
  }
}

export async function translateNavbarOnSave(activeLangs) {
  for (const lang of activeLangs) {
    if (lang === "en") continue;
    for (const key of Object.keys(DEFAULT_NAVBAR)) {
      const originalText = DEFAULT_NAVBAR[key];
      const hash = getHash(originalText);

      const { data: existing } = await supabase
        .from("translations")
        .select("translated_text")
        .eq("entity_type", "settings")
        .eq("entity_id", "navbar")
        .eq("field_key", key)
        .eq("language", lang)
        .single();

      if (!existing?.translated_text) {
        const translated = await callDeepSeek(originalText, lang);
        await saveTranslation("settings", "navbar", key, lang, translated, hash);
      }
    }
  }
}

// ─── About Us Page Translations ──────────────────────────────────────────────

// All field keys that are translatable on the About Us page.
// Values here are the code-level fallbacks only (shown when admin hasn't set custom text).
const DEFAULT_ABOUT = {
  heroBadge: "Our Story",
  heroTitleLine1: "We killed the",
  heroTitleAccent: "expired code.",
  heroDescription: "Couponchy was built out of frustration. Every other coupon site was full of dead links and fake discounts. We built the infrastructure to verify every code — automatically, in real time, at scale.",
  statMonthlyUsersLabel: "Monthly Users",
  statCodeAccuracyLabel: "Code Accuracy",
  statVerifiedStoresLabel: "Verified Stores",
  statActiveDealsLabel: "Active Deals",
  missionLabel: "Our Mission",
  missionQuote: "Nobody should waste money on a coupon that doesn't work.",
  missionParagraph1: "We started Couponchy because we kept getting burned — coupon code after coupon code failing at checkout. The problem wasn't a lack of deals. The problem was a lack of honesty.",
  missionParagraph2: "So we built a real-time verification engine. Not just a database of codes — an automated system that actually tests them, removes the dead ones, and surfaces the ones that genuinely save you money.",
  promiseTitle: "The Promise",
  promiseDescription: "Every coupon you see on Couponchy has been verified by our automated system. If it stopped working — it's already gone.",
  promiseBullet1: "Real-time code verification",
  promiseBullet2: "Auto-removal of expired deals",
  promiseBullet3: "Zero fake or misleading discounts",
  howItWorksLabel: "How It Works",
  howItWorksTitleLine1: "From raw code to",
  howItWorksTitleAccent: "verified savings",
  step1Title: "Discover",
  step1Desc: "We scan thousands of sources — brand newsletters, affiliate networks, community forums — to catch every coupon at the moment it's issued.",
  step2Title: "Verify",
  step2Desc: "Automated agents simulate real checkouts to confirm the discount applies. Only codes that actually reduce your price pass through.",
  step3Title: "Publish",
  step3Desc: "Verified codes are published instantly with expiry tracking. Expired codes are pulled the moment they stop working.",
  step4Title: "Save",
  step4Desc: "You arrive, you see real savings, you save money. No hunting, no guessing, no expired codes.",
  valuesLabel: "What We Stand For",
  valuesTitleLine1: "Our",
  valuesTitleAccent: "core values",
  value1Title: "Radical Honesty",
  value1Desc: "We never publish a coupon we haven't tested. If a code doesn't work, it's gone — no padding the numbers.",
  value2Title: "Speed Over Everything",
  value2Desc: "Our automated systems verify coupon codes in seconds — so you get working deals before anyone else.",
  value3Title: "Zero Junk Policy",
  value3Desc: "No fake discounts, no misleading prices. Every listed offer is real, active, and saves you actual money.",
  value4Title: "Built for Everyone",
  value4Desc: "Whether you're a student on a budget or a deal-hunting pro — Couponchy gives everyone the same saving power.",
  value5Title: "Always Growing",
  value5Desc: "New stores, new categories, new countries — Couponchy expands constantly to bring savings wherever you shop.",
  value6Title: "Always Up-to-Date",
  value6Desc: "Our crawlers run 24/7. The moment a code expires, it's removed. Real-time is not a buzzword for us.",
  ctaEyebrow: "Start Saving Today",
  ctaTitleLine1: "Every code. Verified.",
  ctaTitleAccent: "Every time.",
  ctaDescription: "Browse our verified stores and start saving on every order — with codes that actually work.",
  browseStoresButton: "Browse Stores →",
  contactUsButton: "Contact Us",
  browseAllStoresButton: "Browse All Stores →",
};

/**
 * Returns translated strings for the About page.
 * sourceAboutData = company.aboutUs from company-repository (admin-set content).
 * We translate the ACTUAL admin content, so changes in admin panel are always reflected.
 */
export async function getTranslatedAbout(lang, sourceAboutData = {}) {
  if (!lang || lang === "en") return null; // null = use raw sourceAboutData in component

  // Build effective source: admin content takes priority over code defaults
  const source = { ...DEFAULT_ABOUT, ...sourceAboutData };

  try {
    const translations = await getEntityTranslationsWithHashes("settings", "about", lang);
    const result = {};

    for (const key of Object.keys(DEFAULT_ABOUT)) {
      const originalText = source[key];
      if (!originalText || typeof originalText !== "string" || !originalText.trim()) continue;

      const currentHash = getHash(originalText);
      const dbEntry = translations[key];

      if (dbEntry && dbEntry.text && dbEntry.text.trim() && dbEntry.hash === currentHash) {
        // DB translation exists and source text hasn't changed — use it
        result[key] = dbEntry.text;
      } else {
        // Missing or stale — serve source text now, queue background update
        result[key] = originalText;
        const capturedText = originalText;
        const capturedHash = currentHash;
        callDeepSeek(capturedText, lang)
          .then((translatedText) =>
            saveTranslation("settings", "about", key, lang, translatedText, capturedHash)
          )
          .catch((err) =>
            console.error(`[getTranslatedAbout] Background translation failed for ${key} in ${lang}:`, err)
          );
      }
    }

    return result;
  } catch (err) {
    console.error(`[getTranslatedAbout] Translation failed for ${lang}:`, err);
    return null;
  }
}

/**
 * Called on admin company settings save.
 * Translates all About Us fields for all active languages using the live admin content.
 */
export async function translateAboutOnSave(activeLangs, sourceAboutData = {}) {
  const source = { ...DEFAULT_ABOUT, ...sourceAboutData };

  for (const lang of activeLangs) {
    if (lang === "en") continue;
    for (const key of Object.keys(DEFAULT_ABOUT)) {
      const originalText = source[key];
      if (!originalText || typeof originalText !== "string" || !originalText.trim()) continue;

      const hash = getHash(originalText);

      const { data: existing } = await supabase
        .from("translations")
        .select("translated_text, original_hash")
        .eq("entity_type", "settings")
        .eq("entity_id", "about")
        .eq("field_key", key)
        .eq("language", lang)
        .single();

      // Re-translate if missing or source text changed
      if (!existing?.translated_text || existing.original_hash !== hash) {
        const translated = await callDeepSeek(originalText, lang);
        await saveTranslation("settings", "about", key, lang, translated, hash);
      }
    }
  }
}

/**
 * Translates all displayed texts for a single store detail page.
 * Includes both admin-customized content and template-generated fallbacks.
 */
export async function getTranslatedStoreDetail(detail, lang) {
  if (!lang || lang === "en" || !detail || !detail.singleStore) {
    return detail;
  }

  const store = detail.singleStore;
  const result = { ...detail };
  result.singleStore = { ...store };

  try {
    const translations = await getEntityTranslationsWithHashes("store_detail", store.id, lang);

    // Helper to translate a key
    const translateKey = async (fieldKey, originalText) => {
      if (!originalText || !originalText.trim()) return originalText;

      const currentHash = getHash(originalText);
      const dbEntry = translations[fieldKey];

      if (dbEntry && dbEntry.text && dbEntry.text.trim() && dbEntry.hash === currentHash) {
        return dbEntry.text;
      }

      // Stale or missing — return original now, translate in background
      const capturedText = originalText;
      const capturedHash = currentHash;
      callDeepSeek(capturedText, lang)
        .then((translatedText) =>
          saveTranslation("store_detail", store.id, fieldKey, lang, translatedText, capturedHash)
        )
        .catch((err) =>
          console.error(`[getTranslatedStoreDetail] Background translation failed for ${fieldKey} in ${lang}:`, err)
        );

      return originalText;
    };

    // Translate main fields
    if (store.introTitle) {
      result.singleStore.introTitle = await translateKey("introTitle", store.introTitle);
    }
    if (store.outro) {
      result.singleStore.outro = await translateKey("outro", store.outro);
    }
    if (store.description) {
      result.singleStore.description = await translateKey("description", store.description);
    }
    if (detail.aboutText) {
      result.aboutText = await translateKey("aboutText", detail.aboutText);
    }

    // Translate introParagraphs array
    if (store.introParagraphs && store.introParagraphs.length) {
      result.singleStore.introParagraphs = await Promise.all(
        store.introParagraphs.map((para, idx) => translateKey(`introParagraph_${idx}`, para))
      );
    }

    // Translate whyItems array
    if (store.whyItems && store.whyItems.length) {
      result.singleStore.whyItems = await Promise.all(
        store.whyItems.map((item, idx) => translateKey(`whyItem_${idx}`, item))
      );
    }

    // Translate FAQs questions and answers
    if (detail.faqs && detail.faqs.length) {
      result.faqs = await Promise.all(
        detail.faqs.map(async (faq, idx) => {
          return {
            question: await translateKey(`faq_q_${idx}`, faq.question),
            answer: await translateKey(`faq_a_${idx}`, faq.answer),
          };
        })
      );
    }

    // 2. Localize UI Tabs
    if (detail.storeTabs && detail.storeTabs.length) {
      result.storeTabs = detail.storeTabs.map(tab => {
        if (tab === "Coupons") {
          return lang === "pl" ? "Kupony" :
                 lang === "de" ? "Gutscheine" :
                 lang === "fr" ? "Coupons" :
                 lang === "nl" ? "Kortingscodes" :
                 lang === "it" ? "Coupon" :
                 lang === "es" ? "Cupones" :
                 lang === "sv" ? "Kuponger" :
                 lang === "ja" ? "クーポン" :
                 lang === "pt" ? "Cupons" :
                 lang === "ar" ? "الكوبونات" : tab;
        }
        if (tab === "Store Info") {
          return lang === "pl" ? "O sklepie" :
                 lang === "de" ? "Shop-Infos" :
                 lang === "fr" ? "Infos Magasin" :
                 lang === "nl" ? "Winkel Info" :
                 lang === "it" ? "Info Negozio" :
                 lang === "es" ? "Info Tienda" :
                 lang === "sv" ? "Butiksinfo" :
                 lang === "ja" ? "店舗情報" :
                 lang === "pt" ? "Informações da loja" :
                 lang === "ar" ? "معلومات المتجر" : tab;
        }
        if (tab === "FAQs") {
          return lang === "ar" ? "الأسئلة الشائعة" :
                 lang === "ja" ? "よくある質問" : "FAQs";
        }
        return tab;
      });
    }

    if (detail.offerTabs && detail.offerTabs.length) {
      result.offerTabs = detail.offerTabs.map(tab => {
        const match = tab.match(/(All|Coupons|Deals)\s*\((\d+)\)/);
        if (match) {
          const type = match[1];
          const count = match[2];
          if (type === "All") {
            const allLabel = lang === "pl" ? "Wszystkie" :
                             lang === "de" ? "Alle" :
                             lang === "fr" ? "Tout" :
                             lang === "nl" ? "Alle" :
                             lang === "it" ? "Tutto" :
                             lang === "es" ? "Todo" :
                             lang === "sv" ? "Alla" :
                             lang === "ja" ? "すべて" :
                             lang === "pt" ? "Todos" :
                             lang === "ar" ? "الكل" : "All";
            return `${allLabel} (${count})`;
          }
          if (type === "Coupons") {
            const couponsLabel = lang === "pl" ? "Kupony" :
                                 lang === "de" ? "Gutscheine" :
                                 lang === "fr" ? "Coupons" :
                                 lang === "nl" ? "Kortingscodes" :
                                 lang === "it" ? "Coupon" :
                                 lang === "es" ? "Cupones" :
                                 lang === "sv" ? "Kuponger" :
                                 lang === "ja" ? "クーポン" :
                                 lang === "pt" ? "Cupons" :
                                 lang === "ar" ? "الكوبونات" : "Coupons";
            return `${couponsLabel} (${count})`;
          }
          if (type === "Deals") {
            const dealsLabel = lang === "pl" ? "Oferty" :
                               lang === "de" ? "Angebote" :
                               lang === "fr" ? "Offres" :
                               lang === "nl" ? "Deals" :
                               lang === "it" ? "Offerte" :
                               lang === "es" ? "Ofertas" :
                               lang === "sv" ? "Erbjudanden" :
                               lang === "ja" ? "お得な情報" :
                               lang === "pt" ? "Ofertas" :
                               lang === "ar" ? "العروض" : "Deals";
            return `${dealsLabel} (${count})`;
          }
        }
        return tab;
      });
    }

    return result;
  } catch (e) {
    console.error("[getTranslatedStoreDetail] Error translating store details:", e);
    return detail;
  }
}

const DEFAULT_TRENDING_STORES = {
  storeDirectory: "STORE DIRECTORY",
  everyCodeVerified: "Every code verified.",
  browseAllStores: "Browse all stores →",
  browseByCategory: "Browse by category →",
  popular: "Popular",
  verified: "Verified",
  active: "Active",
  verifiedCode: "verified code",
  verifiedCodes: "verified codes",
  health: "health",
  noMerchants: "No merchants in this category yet",
  selectAnotherCategory: "Select another category or view all stores above.",
  exploreMoreStores: "Explore {count} more stores",
  storesPlural: "stores",
};

const DEFAULT_STORE_DIRECTORY = {
  verifiedPartner: "Verified Partner",
  verifiedCoupons: "Verified Coupons",
  updated24h: "UPDATED: 24H",
  totalCatalog: "Total Catalog",
  activeBrands: "ACTIVE BRANDS",
  topSavings: "Top Savings",
  brandsMerchants: "Brands & Merchants",
  browse: "Browse",
  ourStoreDirectory: "Our Store Directory",
  directoryDesc: "Browse through our fully verified list of retail stores and online brands. Choose a merchant to discover the latest active coupons, exclusive deals, and promo codes.",
  activeQuery: "Active Query",
  showingResultsFor: "Showing results for:",
  noStoresFound: 'No stores found for "{query}"',
  noStoresAdded: "No stores have been added yet",
  tryAnotherQuery: "Try another store name, category, or slug to find matching results.",
  addFirstStore: "Add your first store from the admin dashboard to start building the catalog.",
};

const SHORT_TRANSLATIONS = {
  de: {
    verified: "Verifiziert",
    active: "AKTIV",
    verifiedCode: "verifizierter Code",
    verifiedCodes: "verifizierte Codes",
    health: "Erfolgsrate",
    popular: "Beliebt",
    days: "TAGE",
    hrs: "STD",
    min: "MIN",
    sec: "SEK",
    deal: "ANGEBOT",
    code: "CODE",
    copied: "Kopiert!",
    redirecting: "Weiterleitung...",
    getDealNow: "Angebot sichern",
    copyCode: "Code kopieren",
  },
  fr: {
    verified: "Vérifié",
    active: "ACTIF",
    verifiedCode: "code vérifié",
    verifiedCodes: "codes vérifiés",
    health: "de fiabilité",
    popular: "Populaire",
    days: "JOURS",
    hrs: "H",
    min: "MIN",
    sec: "SEC",
    deal: "OFFRE",
    code: "CODE",
    copied: "Copié !",
    redirecting: "Redirection...",
    getDealNow: "Profiter de l'offre",
    copyCode: "Copier le code",
  },
  nl: {
    verified: "Geverifieerd",
    active: "ACTIEF",
    verifiedCode: "geverifieerde code",
    verifiedCodes: "geverifieerde codes",
    health: "succes",
    popular: "Populair",
    days: "DAGEN",
    hrs: "UUR",
    min: "MIN",
    sec: "SEC",
    deal: "AANBIEDING",
    code: "CODE",
    copied: "Gekopieerd!",
    redirecting: "Omleiden...",
    getDealNow: "Nu Aanbieding",
    copyCode: "Kopieer code",
  },
  pl: {
    verified: "Zweryfikowane",
    active: "AKTYWNY",
    verifiedCode: "zweryfikowany kod",
    verifiedCodes: "zweryfikowane kody",
    health: "skuteczności",
    popular: "Popularne",
    days: "DNI",
    hrs: "GODZ",
    min: "MIN",
    sec: "SEK",
    deal: "OKAZJA",
    code: "KOD",
    copied: "Skopiowano!",
    redirecting: "Przekierowanie...",
    getDealNow: "Zdobądź ofertę",
    copyCode: "Skopiuj kod",
  },
  it: {
    verified: "Verificato",
    active: "ATTIVO",
    verifiedCode: "codice verificato",
    verifiedCodes: "codici verificati",
    health: "di successo",
    popular: "Popolari",
    days: "GIORNI",
    hrs: "ORE",
    min: "MIN",
    sec: "SEC",
    deal: "OFFERTA",
    code: "CODICE",
    copied: "Copiato!",
    redirecting: "Reindirizzamento...",
    getDealNow: "Ottieni l'offerta",
    copyCode: "Copia il codice",
  },
  es: {
    verified: "Verificado",
    active: "ACTIVO",
    verifiedCode: "código verificado",
    verifiedCodes: "códigos verificados",
    health: "de éxito",
    popular: "Popular",
    days: "DÍAS",
    hrs: "HRS",
    min: "MIN",
    sec: "SEG",
    deal: "OFERTA",
    code: "CÓDIGO",
    copied: "¡Copiado!",
    redirecting: "Redirigiendo...",
    getDealNow: "Obtener oferta",
    copyCode: "Copiar código",
  }
};

export async function getTranslatedTrendingStores(lang) {
  if (!lang || lang === "en") {
    return DEFAULT_TRENDING_STORES;
  }

  try {
    const translations = await getEntityTranslationsWithHashes("settings", "trending_stores", lang);
    const result = { ...DEFAULT_TRENDING_STORES };

    for (const key of Object.keys(DEFAULT_TRENDING_STORES)) {
      const originalText = DEFAULT_TRENDING_STORES[key];
      const currentHash = getHash(originalText);
      const dbEntry = translations[key];

      if (SHORT_TRANSLATIONS[lang] && SHORT_TRANSLATIONS[lang][key]) {
        result[key] = SHORT_TRANSLATIONS[lang][key];
        saveTranslation("settings", "trending_stores", key, lang, result[key], currentHash).catch(() => { });
      } else if (dbEntry && dbEntry.text && dbEntry.text.trim() && dbEntry.hash === currentHash) {
        result[key] = dbEntry.text;
      } else {
        callDeepSeek(originalText, lang)
          .then((translatedText) =>
            saveTranslation("settings", "trending_stores", key, lang, translatedText, currentHash)
          )
          .catch((err) =>
            console.error(`[getTranslatedTrendingStores] Background translation failed for ${key} in ${lang}:`, err)
          );
      }
    }

    return result;
  } catch (err) {
    console.error(`[getTranslatedTrendingStores] Translation failed for ${lang}:`, err);
    return DEFAULT_TRENDING_STORES;
  }
}

export async function getTranslatedStoreDirectory(lang) {
  if (!lang || lang === "en") {
    return DEFAULT_STORE_DIRECTORY;
  }

  try {
    const translations = await getEntityTranslationsWithHashes("settings", "store_directory", lang);
    const result = { ...DEFAULT_STORE_DIRECTORY };

    for (const key of Object.keys(DEFAULT_STORE_DIRECTORY)) {
      const originalText = DEFAULT_STORE_DIRECTORY[key];
      const currentHash = getHash(originalText);
      const dbEntry = translations[key];

      if (SHORT_TRANSLATIONS[lang] && SHORT_TRANSLATIONS[lang][key]) {
        result[key] = SHORT_TRANSLATIONS[lang][key];
        saveTranslation("settings", "store_directory", key, lang, result[key], currentHash).catch(() => { });
      } else if (dbEntry && dbEntry.text && dbEntry.text.trim() && dbEntry.hash === currentHash) {
        result[key] = dbEntry.text;
      } else {
        callDeepSeek(originalText, lang)
          .then((translatedText) =>
            saveTranslation("settings", "store_directory", key, lang, translatedText, currentHash)
          )
          .catch((err) =>
            console.error(`[getTranslatedStoreDirectory] Background translation failed for ${key} in ${lang}:`, err)
          );
      }
    }

    return result;
  } catch (err) {
    console.error(`[getTranslatedStoreDirectory] Translation failed for ${lang}:`, err);
    return DEFAULT_STORE_DIRECTORY;
  }
}

const DEFAULT_HOW_IT_WORKS = {
  sectionTitle: "How Couponchy Works",
  step1Title: "1. Scan & Discover",
  step1Desc: "Our automated crawlers scan thousands of retail brands every minute to discover new coupons, promo codes, and special clearance events.",
  liveDiscoveryFeed: "Live Discovery Feed",
  logNike: "Scanning API endpoints...",
  logSephoraAction: "Checking checkout DOM...",
  logSephoraRes: "Found coupon field",
  logAdidasAction: "Found code 'ADISAVE'...",
  logAdidasRes: "Staged for verification",
  logAsosAction: "Extracting discount metadata...",
  logAsosRes: "Success",
  step2Title: "2. Test & Verify",
  step2Desc: "We simulate checkout carts on headless Chrome browsers, applying discount codes automatically. If a code fails or is expired, we throw it out instantly.",
  cartSimulation: "Cart Simulation",
  runningBot: "Running Bot...",
  validatingBasket: "Validating checkout basket...",
  verifiedActive: "Verified: 25% Off Active!",
  rejectedExpired: "Rejected: Code Expired",
  step3Title: "3. Copy & Save",
  step3Desc: "Only the working, highest-saving codes are published to the vaults. One click copies the code and routes you to the store for instant checkout savings.",
  verifiedCoupon: "Verified Coupon",
  getCode: "GET CODE",
  copied: "✓ COPIED!",
  redirecting: "REDIRECTING...",
};

export async function getTranslatedHowItWorks(lang) {
  if (!lang || lang === "en") {
    return DEFAULT_HOW_IT_WORKS;
  }

  try {
    const translations = await getEntityTranslationsWithHashes("settings", "how_it_works", lang);
    const result = { ...DEFAULT_HOW_IT_WORKS };

    for (const key of Object.keys(DEFAULT_HOW_IT_WORKS)) {
      const originalText = DEFAULT_HOW_IT_WORKS[key];
      const currentHash = getHash(originalText);
      const dbEntry = translations[key];

      if (SHORT_TRANSLATIONS[lang] && SHORT_TRANSLATIONS[lang][key]) {
        result[key] = SHORT_TRANSLATIONS[lang][key];
        saveTranslation("settings", "how_it_works", key, lang, result[key], currentHash).catch(() => { });
      } else if (dbEntry && dbEntry.text && dbEntry.text.trim() && dbEntry.hash === currentHash) {
        result[key] = dbEntry.text;
      } else {
        callDeepSeek(originalText, lang)
          .then((translatedText) =>
            saveTranslation("settings", "how_it_works", key, lang, translatedText, currentHash)
          )
          .catch((err) =>
            console.error(`[getTranslatedHowItWorks] Background translation failed for ${key} in ${lang}:`, err)
          );
      }
    }

    return result;
  } catch (err) {
    console.error(`[getTranslatedHowItWorks] Translation failed for ${lang}:`, err);
    return DEFAULT_HOW_IT_WORKS;
  }
}

const DEFAULT_FEATURED_COUPONS = {
  verified: "Verified",
  active: "ACTIVE",
  expiresIn: "Expires in:",
  days: "DAYS",
  hrs: "HRS",
  min: "MIN",
  sec: "SEC",
  redirecting: "Redirecting...",
  copied: "Copied!",
  getDealNow: "Get Deal Now",
  copyCode: "Copy Code",
  deal: "DEAL",
  code: "CODE",
  noActiveCoupons: "No Active Coupons Yet",
  scannedDesc: "We're currently scanning and verifying exclusive coupon codes. Create a deal in the admin dashboard to populate this slot.",
  manageCoupons: "Manage Coupons",
};

export async function getTranslatedFeaturedCoupons(lang) {
  if (!lang || lang === "en") {
    return DEFAULT_FEATURED_COUPONS;
  }

  try {
    const translations = await getEntityTranslationsWithHashes("settings", "featured_coupons", lang);
    const result = { ...DEFAULT_FEATURED_COUPONS };

    for (const key of Object.keys(DEFAULT_FEATURED_COUPONS)) {
      const originalText = DEFAULT_FEATURED_COUPONS[key];
      const currentHash = getHash(originalText);
      const dbEntry = translations[key];

      if (SHORT_TRANSLATIONS[lang] && SHORT_TRANSLATIONS[lang][key]) {
        result[key] = SHORT_TRANSLATIONS[lang][key];
        saveTranslation("settings", "featured_coupons", key, lang, result[key], currentHash).catch(() => { });
      } else if (dbEntry && dbEntry.text && dbEntry.text.trim() && dbEntry.hash === currentHash) {
        result[key] = dbEntry.text;
      } else {
        callDeepSeek(originalText, lang)
          .then((translatedText) =>
            saveTranslation("settings", "featured_coupons", key, lang, translatedText, currentHash)
          )
          .catch((err) =>
            console.error(`[getTranslatedFeaturedCoupons] Background translation failed for ${key} in ${lang}:`, err)
          );
      }
    }

    return result;
  } catch (err) {
    console.error(`[getTranslatedFeaturedCoupons] Translation failed for ${lang}:`, err);
    return DEFAULT_FEATURED_COUPONS;
  }
}

const DEFAULT_HERO = {
  searchPlaceholder: "Search any store (e.g. nike.com)",
  searchBrand: "Search Brand →",
  popularStores: "Popular Stores:",
  storesVerified: "Stores Verified",
  accuracyRate: "Accuracy Rate",
  monthlyVerifications: "Monthly Verifications",
  savedAtCheckout: "Saved at Checkout",
};

export async function getTranslatedHero(lang) {
  if (!lang || lang === "en") {
    return DEFAULT_HERO;
  }

  try {
    const translations = await getEntityTranslationsWithHashes("settings", "hero_stats", lang);
    const result = { ...DEFAULT_HERO };

    for (const key of Object.keys(DEFAULT_HERO)) {
      const originalText = DEFAULT_HERO[key];
      const currentHash = getHash(originalText);
      const dbEntry = translations[key];

      if (dbEntry && dbEntry.text && dbEntry.text.trim() && dbEntry.hash === currentHash) {
        result[key] = dbEntry.text;
      } else {
        callDeepSeek(originalText, lang)
          .then((translatedText) =>
            saveTranslation("settings", "hero_stats", key, lang, translatedText, currentHash)
          )
          .catch((err) =>
            console.error(`[getTranslatedHero] Background translation failed for ${key} in ${lang}:`, err)
          );
      }
    }

    return result;
  } catch (err) {
    console.error(`[getTranslatedHero] Translation failed for ${lang}:`, err);
    return DEFAULT_HERO;
  }
}

const DEFAULT_MARQUEE = {
  codeVerified: "Code verified",
  codeSubmitted: "Code submitted",
  dealActivated: "Deal activated",
  couponUpdated: "Coupon updated",
  verified: "Verified",
  newCode: "New code",
  pendingReview: "Pending review",
  liveDeal: "Live deal",
  freshUpdate: "Fresh update",
};

export async function getTranslatedMarquee(lang) {
  if (!lang || lang === "en") {
    return DEFAULT_MARQUEE;
  }

  try {
    const translations = await getEntityTranslationsWithHashes("settings", "marquee_stats", lang);
    const result = { ...DEFAULT_MARQUEE };

    for (const key of Object.keys(DEFAULT_MARQUEE)) {
      const originalText = DEFAULT_MARQUEE[key];
      const currentHash = getHash(originalText);
      const dbEntry = translations[key];

      if (dbEntry && dbEntry.text && dbEntry.text.trim() && dbEntry.hash === currentHash) {
        result[key] = dbEntry.text;
      } else {
        callDeepSeek(originalText, lang)
          .then((translatedText) =>
            saveTranslation("settings", "marquee_stats", key, lang, translatedText, currentHash)
          )
          .catch((err) =>
            console.error(`[getTranslatedMarquee] Background translation failed for ${key} in ${lang}:`, err)
          );
      }
    }

    return result;
  } catch (err) {
    console.error(`[getTranslatedMarquee] Translation failed for ${lang}:`, err);
    return DEFAULT_MARQUEE;
  }
}

// Decorate a single blog post with translation
export async function getTranslatedBlog(blog, lang) {
  if (!blog || !lang || lang === "en") return blog;
  const result = { ...blog };
  const blogId = blog.id || blog.slug;

  try {
    const translations = await getEntityTranslationsWithHashes("blog", blogId, lang);

    const translateKey = async (fieldKey, originalText) => {
      if (!originalText || !originalText.trim()) return originalText;

      const currentHash = getHash(originalText);
      const dbEntry = translations[fieldKey];

      if (dbEntry && dbEntry.text && dbEntry.text.trim() && dbEntry.hash === currentHash) {
        return dbEntry.text;
      }

      // Stale or missing — return original now, translate in background
      const capturedText = originalText;
      const capturedHash = currentHash;
      callDeepSeek(capturedText, lang)
        .then((translatedText) =>
          saveTranslation("blog", blogId, fieldKey, lang, translatedText, capturedHash)
        )
        .catch((err) =>
          console.error(`[getTranslatedBlog] Background translation failed for ${fieldKey} in ${lang}:`, err)
        );

      return originalText;
    };

    if (blog.title) result.title = await translateKey("title", blog.title);
    if (blog.excerpt) result.excerpt = await translateKey("excerpt", blog.excerpt);
    if (blog.content) result.content = await translateKey("content", blog.content);
    if (blog.authorRole) result.authorRole = await translateKey("authorRole", blog.authorRole);

  } catch (err) {
    console.error(`[getTranslatedBlog] Error translating blog ${blogId} in ${lang}:`, err);
  }

  return result;
}

// Decorate list of blog posts
export async function getTranslatedBlogs(blogs, lang) {
  if (!blogs || !blogs.length || !lang || lang === "en") return blogs;
  return Promise.all(blogs.map((blog) => getTranslatedBlog(blog, lang)));
}

// Blog Static UI Dictionary
export const DEFAULT_BLOG_UI = {
  ourJournal: "OUR JOURNAL",
  shoppingDecoded: "Shopping, Decoded.",
  searchPlaceholder: "Search articles...",
  loadMore: "Load More Articles",
  noArticlesFound: "No articles found",
  noArticlesDesc: "Try searching for other terms or selecting a different category.",
  stayUpdated: "STAY UPDATED",
  findOutWhenWePublish: "Find out when we publish.",
  subscribeDesc: "Subscribe to our newsletter to receive the latest e-commerce insights, discount code trends, and data reports directly in your inbox.",
  subscribePlaceholder: "Enter your email address...",
  subscribeButton: "SUBSCRIBE",
  insideOurPlatform: "INSIDE OUR PLATFORM",
  understandTheEngine: "Understand the engine.",
  validationSystem: "Validation System",
  howItWorks: "How It Works",
  validationDesc: "Our validation crawler runs 24/7 matching codes with simulated cart responses. We automatically test code stackability and record success rates to save you time.",
  goHome: "Go to Homepage →",
  couponAnatomy: "Coupon Anatomy",
  anatomyOfVoucher: "Anatomy of a Voucher",
  anatomyDesc: "Understanding discount logic is crucial. From sitewide tags to category exclusions and minimum spend values, we break down code parameters for transparency.",
  viewExclusiveDeals: "View Exclusive Deals →",
  blogBreadcrumb: "BLOG",
  tableOfContents: "Table of Contents",
  shareThisArticle: "Share this article",
  linkCopied: "Link Copied!",
  moreFromOurJournal: "MORE FROM OUR JOURNAL",
  relatedArticles: "Related Articles",
  intro: "Introduction",
  marketShift: "Market Insights",
  detailedAnalysis: "Analysis Detail",
  conclusion: "Conclusion",
  readArticle: "Read article",
  read: "READ",
  by: "By",
  journalSub: "Find our latest insights, data analyses, and shopping guides from the world of e-commerce, coupons, and retail trends.",
  successSub: "✓ Subscription Successful!",
  successSubDesc: "Thank you for subscribing. We will keep you updated.",
  catAll: "All",
  catLatestData: "Latest Data",
  catStoreGuides: "Store Guides",
  catBestLists: "Best Lists",
  catDeepDives: "Deep Dives",
};

export async function getTranslatedBlogUI(lang) {
  if (!lang || lang === "en") {
    return DEFAULT_BLOG_UI;
  }

  try {
    const translations = await getEntityTranslationsWithHashes("settings", "blog_ui", lang);
    const result = { ...DEFAULT_BLOG_UI };

    for (const key of Object.keys(DEFAULT_BLOG_UI)) {
      const originalText = DEFAULT_BLOG_UI[key];
      const currentHash = getHash(originalText);
      const dbEntry = translations[key];

      if (dbEntry && dbEntry.text && dbEntry.text.trim() && dbEntry.hash === currentHash) {
        result[key] = dbEntry.text;
      } else {
        callDeepSeek(originalText, lang)
          .then((translatedText) =>
            saveTranslation("settings", "blog_ui", key, lang, translatedText, currentHash)
          )
          .catch((err) =>
            console.error(`[getTranslatedBlogUI] Background translation failed for ${key} in ${lang}:`, err)
          );
      }
    }

    return result;
  } catch (err) {
    console.error(`[getTranslatedBlogUI] Translation failed for ${lang}:`, err);
    return DEFAULT_BLOG_UI;
  }
}

export async function translateBlogUIOnSave(activeLangs) {
  for (const lang of activeLangs) {
    if (lang === "en") continue;
    for (const key of Object.keys(DEFAULT_BLOG_UI)) {
      const originalText = DEFAULT_BLOG_UI[key];
      if (!originalText || typeof originalText !== "string" || !originalText.trim()) continue;

      const hash = getHash(originalText);

      const { data: existing } = await supabase
        .from("translations")
        .select("translated_text, original_hash")
        .eq("entity_type", "settings")
        .eq("entity_id", "blog_ui")
        .eq("field_key", key)
        .eq("language", lang)
        .single();

      if (!existing?.translated_text || existing.original_hash !== hash) {
        const translated = await callDeepSeek(originalText, lang);
        await saveTranslation("settings", "blog_ui", key, lang, translated, hash);
      }
    }
  }
}

// Exclusive Static UI Dictionary
export const DEFAULT_EXCLUSIVE_UI = {
  exclusivePageBadge: "Exclusive Page",
  verifiedExclusiveTitle: "Verified Exclusive",
  couponsAndDeals: "Coupons & Deals",
  exclusiveSub: "Browse limited-time exclusive offers, standout coupon codes, and featured savings from participating stores.",
  exclusiveOffers: "Exclusive Offers",
  relatedStoresBadge: "Related Stores",
  relatedStoresTitle: "Related Stores",
  relatedStoresDesc: "Stores currently featuring live exclusive offers.",
  noRelatedStores: "No related stores found.",
  discountLabel: "Discount",
  offLabel: "OFF",
  dealLabel: "DEAL",
  exclusiveBadge: "Exclusive",
  noDescYet: "No description added yet.",
  revealCode: "Reveal Code",
  getDeal: "Get Deal",
  noOffersYetTitle: "No exclusive offers yet",
  noOffersYetDesc: "New exclusive deals and coupon codes will appear here as soon as matching offers are available.",
};

export async function getTranslatedExclusiveUI(lang) {
  if (!lang || lang === "en") {
    return DEFAULT_EXCLUSIVE_UI;
  }

  try {
    const translations = await getEntityTranslationsWithHashes("settings", "exclusive_ui", lang);
    const result = { ...DEFAULT_EXCLUSIVE_UI };

    for (const key of Object.keys(DEFAULT_EXCLUSIVE_UI)) {
      const originalText = DEFAULT_EXCLUSIVE_UI[key];
      const currentHash = getHash(originalText);
      const dbEntry = translations[key];

      if (dbEntry && dbEntry.text && dbEntry.text.trim() && dbEntry.hash === currentHash) {
        result[key] = dbEntry.text;
      } else {
        // Fix for "READ" like issues: check if the text is very short/capitalized and handle it
        let textToTranslate = originalText;
        // If we are translating extremely short keywords, we can suffix them slightly to avoid LLM instruction confusion
        callDeepSeek(textToTranslate, lang)
          .then((translatedText) =>
            saveTranslation("settings", "exclusive_ui", key, lang, translatedText, currentHash)
          )
          .catch((err) =>
            console.error(`[getTranslatedExclusiveUI] Background translation failed for ${key} in ${lang}:`, err)
          );
      }
    }

    return result;
  } catch (err) {
    console.error(`[getTranslatedExclusiveUI] Translation failed for ${lang}:`, err);
    return DEFAULT_EXCLUSIVE_UI;
  }
}

export async function translateExclusiveUIOnSave(activeLangs) {
  for (const lang of activeLangs) {
    if (lang === "en") continue;
    for (const key of Object.keys(DEFAULT_EXCLUSIVE_UI)) {
      const originalText = DEFAULT_EXCLUSIVE_UI[key];
      if (!originalText || typeof originalText !== "string" || !originalText.trim()) continue;

      const hash = getHash(originalText);

      const { data: existing } = await supabase
        .from("translations")
        .select("translated_text, original_hash")
        .eq("entity_type", "settings")
        .eq("entity_id", "exclusive_ui")
        .eq("field_key", key)
        .eq("language", lang)
        .single();

      if (!existing?.translated_text || existing.original_hash !== hash) {
        const translated = await callDeepSeek(originalText, lang);
        await saveTranslation("settings", "exclusive_ui", key, lang, translated, hash);
      }
    }
  }
}


// ─── Contact Us Page Translations ─────────────────────────────────────────────

// All static UI strings on the Contact Us page that should be translated.
// These are code-level defaults; admin-set contactUs fields are also translated inline.
const DEFAULT_CONTACT = {
  // Header badge & labels
  getInTouchBadge: "Get In Touch",
  headerTitle: "Connect with",
  headerSubtitle: "Have a question, want to submit a coupon, or looking to partner? Reach out and we'll respond within 24 hours.",

  // Contact info cards
  emailUsLabel: "Email Us",
  partnershipsLabel: "Partnerships",
  followUpdatesLabel: "Follow Our Updates",
  globalNetworkTitle: "Global Automated Network",
  globalNetworkSubtitle: "Playwright validation running across 10 regions",

  // Form labels & placeholders
  yourNameLabel: "Your Name",
  emailAddressLabel: "Email Address",
  subjectLabel: "Subject",
  messageLabel: "Message",
  messagePlaceholder: "Describe your request in detail...",
  securityVerificationLabel: "Security Verification",
  captchaPlaceholder: "Enter code",

  // Subject chip labels
  subjectSupport: "Support",
  subjectCoupon: "Submit a Coupon",
  subjectPartnership: "Partnership",
  subjectOther: "Other",

  // Submit & states
  sendMessage: "Send Message →",
  processing: "Processing...",
  sendAnotherMessage: "Send another message",

  // Success state
  successTitle: "Message Received!",
  successSubtitle: "Thank you for reaching out to us. Our support crew will review your request and get back to you shortly.",

  // Validation errors
  nameRequired: "Name is required",
  emailRequired: "Email is required",
  emailInvalid: "Please enter a valid email address",
  messageRequired: "Message is required",
  messageTooShort: "Message must be at least 10 characters",
  captchaRequired: "Verification code is required",
  captchaIncorrect: "Incorrect verification code",
  submitError: "Something went wrong. Please try again.",

  // FAQ section
  faqTitle: "Frequently Asked Questions",
  faqSubtitle: "Quick answers to general inquiries about submissions, ads, and support.",

  // FAQ items
  faq1Question: "How do I submit a new coupon code?",
  faq1Answer: "You can submit a coupon directly using this contact form! Just select 'Submit a Coupon' as the subject, fill in the store name and the code details in the message, and our automated validation agents will verify and list it within a few hours.",
  faq2Question: "Are all coupon codes on Couponchy free to use?",
  faq2Answer: "Absolutely! Couponchy is 100% free for everyone. We do not require any registration, sign-ups, or subscriptions. Just copy the code and save instantly at checkout.",
  faq3Question: "How does the automated verification system work?",
  faq3Answer: "We deploy headless Playwright browser agents that automatically simulate checkouts for each merchant. If a coupon successfully reduces the price in our test environment, it is marked as verified and prioritized in our lists.",
  faq4Question: "Do you offer advertising or partnership options?",
  faq4Answer: "Yes, we collaborate with top-tier brands and affiliate networks. If you want to promote your store or showcase a featured offer, select 'Partnership / Advertising' in the contact form, and our partnerships lead will reach out to you.",
};

/**
 * Returns translated strings for the Contact Us page.
 * On cache miss/stale, serves source text immediately and queues a background DeepSeek update.
 */
export async function getTranslatedContact(lang, sourceContactData = {}) {
  if (!lang || lang === "en") return null;

  // Merge admin-set contact fields that are translatable
  const translatableAdminFields = {
    formNote: sourceContactData.formNote,
    businessHours: sourceContactData.businessHours,
  };

  const source = { ...DEFAULT_CONTACT, ...Object.fromEntries(Object.entries(translatableAdminFields).filter(([, v]) => v)) };

  try {
    const translations = await getEntityTranslationsWithHashes("settings", "contact", lang);
    const result = {};

    for (const key of Object.keys(source)) {
      const originalText = source[key];
      if (!originalText || typeof originalText !== "string" || !originalText.trim()) continue;

      const currentHash = getHash(originalText);
      const dbEntry = translations[key];

      if (dbEntry && dbEntry.text && dbEntry.text.trim() && dbEntry.hash === currentHash) {
        result[key] = dbEntry.text;
      } else {
        result[key] = originalText;
        const capturedText = originalText;
        const capturedHash = currentHash;
        callDeepSeek(capturedText, lang)
          .then((translatedText) =>
            saveTranslation("settings", "contact", key, lang, translatedText, capturedHash)
          )
          .catch((err) =>
            console.error(`[getTranslatedContact] Background translation failed for ${key} in ${lang}:`, err)
          );
      }
    }

    return result;
  } catch (err) {
    console.error(`[getTranslatedContact] Translation failed for ${lang}:`, err);
    return null;
  }
}

/**
 * Called on admin company settings save.
 * Translates all Contact Us fields for all active languages.
 */
export async function translateContactOnSave(activeLangs, sourceContactData = {}) {
  const translatableAdminFields = {
    formNote: sourceContactData.formNote,
    businessHours: sourceContactData.businessHours,
  };

  const source = { ...DEFAULT_CONTACT, ...Object.fromEntries(Object.entries(translatableAdminFields).filter(([, v]) => v)) };

  for (const lang of activeLangs) {
    if (lang === "en") continue;
    for (const key of Object.keys(source)) {
      const originalText = source[key];
      if (!originalText || typeof originalText !== "string" || !originalText.trim()) continue;

      const hash = getHash(originalText);

      const { data: existing } = await supabase
        .from("translations")
        .select("translated_text, original_hash")
        .eq("entity_type", "settings")
        .eq("entity_id", "contact")
        .eq("field_key", key)
        .eq("language", lang)
        .single();

      if (!existing?.translated_text || existing.original_hash !== hash) {
        const translated = await callDeepSeek(originalText, lang);
        await saveTranslation("settings", "contact", key, lang, translated, hash);
      }
    }
  }
}

// ─── Privacy Policy Page Translations ────────────────────────────────────────

const DEFAULT_PRIVACY = {
  // Static UI
  legalDocsBadge: "Legal Docs",
  contentsLabel: "Contents",
  lastUpdatedPrefix: "Last updated:",
  lastUpdatedSuffix: "Learn how we secure and handle your data.",
  questionsTitle: "Questions about our policies?",
  questionsSubtitle: "If you have questions about how your data is handled or want to exercise your legal rights, contact us directly.",
  supportCenterButton: "Support Center →",
  emailSupportButton: "Email Support",

  // Section titles (sidebar + headings)
  section1Title: "1. Introduction",
  section2Title: "2. Information We Collect",
  section3Title: "3. How We Use Information",
  section4Title: "4. Cookies and Tracking",
  section5Title: "5. Data Protection",
  section6Title: "6. Third-Party Merchants",
  section7Title: "7. Your Privacy Rights",
  section8Title: "8. Changes to this Policy",

  // Admin-editable content fields (defaults mirror company-repository)
  introText: "Welcome to Couponchy (\"we\", \"us\", or \"our\"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safe-keep the information when you visit our platform. By accessing or using our services, you consent to the practices described in this policy.",
  collectText: "We prioritize your privacy and minimize data collection. The only data we process is:",
  collectBullet1Title: "Voluntary Contact Info:",
  collectBullet1Desc: "Email address, name, or comments if you submit a coupon or use our contact form.",
  collectBullet2Title: "Usage and Device Data:",
  collectBullet2Desc: "IP address, country localization (to show relevant regional coupons), browser type, and anonymous interaction stats.",
  useText: "We use collected information solely to:",
  useGrid1: "Deliver regional storefront configurations and active coupon lists.",
  useGrid2: "Verify coupon submissions and validate them using simulated headless browser checkouts.",
  useGrid3: "Process and resolve support requests submitted through our contact channels.",
  useGrid4: "Prevent fraud, security breaches, and coordinate automated abuse prevention.",
  cookiesText: "We utilize cookies to remember your country preferences (e.g. storing your region preference in cookies) so that you do not need to select it again. These cookies do not track your browsing habits outside our domain. You can disable cookies in your browser settings, though some regional features may fall back to default configurations.",
  dataSecurityText: "We apply industry-standard security measures, including SSL encryption and secure database controls. We never lease, trade, or sell your personal details to outside marketing agencies or aggregators.",
  thirdPartyText: "Our site lists deals and links to third-party brand websites. Once you click a link and navigate away, we do not have authority over their privacy structures. We strongly advise checking the individual privacy policies of any site you visit.",
  userRightsText: "Depending on your localization, you possess rights under the GDPR or CCPA to view, modify, or erase any personal information we hold (e.g. deleting contact form requests). Reach out to us via email to request details.",
  policyUpdatesText: "We reserve the right to revise this Privacy Policy at any time. Any changes will be posted directly on this page with an updated modification date. We recommend checking back periodically to stay informed.",
};

const PRIVACY_ADMIN_KEYS = [
  "introText", "collectText", "collectBullet1Title", "collectBullet1Desc",
  "collectBullet2Title", "collectBullet2Desc", "useText", "useGrid1", "useGrid2",
  "useGrid3", "useGrid4", "cookiesText", "dataSecurityText", "thirdPartyText",
  "userRightsText", "policyUpdatesText",
];

function buildPrivacySource(sourcePolicyData = {}) {
  const adminOverrides = Object.fromEntries(
    PRIVACY_ADMIN_KEYS.map((k) => [k, sourcePolicyData[k]]).filter(([, v]) => v)
  );
  return { ...DEFAULT_PRIVACY, ...adminOverrides };
}

/**
 * Returns translated strings for the Privacy Policy page.
 * Admin-set privacyPolicy fields override code defaults before translation.
 * Cache miss/stale: serves source text, queues background DeepSeek update.
 */
export async function getTranslatedPrivacy(lang, sourcePolicyData = {}) {
  if (!lang || lang === "en") return null;

  const source = buildPrivacySource(sourcePolicyData);

  try {
    const translations = await getEntityTranslationsWithHashes("settings", "privacy", lang);
    const result = {};

    for (const key of Object.keys(source)) {
      const originalText = source[key];
      if (!originalText || typeof originalText !== "string" || !originalText.trim()) continue;

      const currentHash = getHash(originalText);
      const dbEntry = translations[key];

      if (dbEntry && dbEntry.text && dbEntry.text.trim() && dbEntry.hash === currentHash) {
        result[key] = dbEntry.text;
      } else {
        result[key] = originalText;
        const capturedText = originalText;
        const capturedHash = currentHash;
        callDeepSeek(capturedText, lang)
          .then((translatedText) =>
            saveTranslation("settings", "privacy", key, lang, translatedText, capturedHash)
          )
          .catch((err) =>
            console.error(`[getTranslatedPrivacy] Background translation failed for ${key} in ${lang}:`, err)
          );
      }
    }

    return result;
  } catch (err) {
    console.error(`[getTranslatedPrivacy] Translation failed for ${lang}:`, err);
    return null;
  }
}

/**
 * Called on admin company settings save.
 * Translates all Privacy Policy fields for all active languages.
 */
export async function translatePrivacyOnSave(activeLangs, sourcePolicyData = {}) {
  const source = buildPrivacySource(sourcePolicyData);

  for (const lang of activeLangs) {
    if (lang === "en") continue;
    for (const key of Object.keys(source)) {
      const originalText = source[key];
      if (!originalText || typeof originalText !== "string" || !originalText.trim()) continue;

      const hash = getHash(originalText);

      const { data: existing } = await supabase
        .from("translations")
        .select("translated_text, original_hash")
        .eq("entity_type", "settings")
        .eq("entity_id", "privacy")
        .eq("field_key", key)
        .eq("language", lang)
        .single();

      if (!existing?.translated_text || existing.original_hash !== hash) {
        const translated = await callDeepSeek(originalText, lang);
        await saveTranslation("settings", "privacy", key, lang, translated, hash);
      }
    }
  }
}
