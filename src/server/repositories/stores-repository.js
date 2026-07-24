import "server-only";

import { supabase } from "@/lib/supabase";
import { normalizeCountryCode } from "@/lib/countries";
import { connectToDatabase } from "@/lib/mongodb";
import Store from "@/server/models/Store";

function isMongoEnabled() {
  return process.env.USE_MONGODB === "true" || (process.env.USE_MONGODB !== "false" && Boolean(process.env.MONGODB_URI));
}

function mapDbStoreToJs(dbStore) {
  if (!dbStore) return null;
  const id = dbStore.id || dbStore._id;
  const category_slug = dbStore.category_slug || dbStore.categorySlug;
  const country_code = dbStore.country_code || dbStore.countryCode;
  const logo_image = dbStore.logo_image || dbStore.logoImage;
  const logo_text = dbStore.logo_text || dbStore.logoText;
  const affiliate_link = dbStore.affiliate_link || dbStore.affiliateLink;
  const logo_class_name = dbStore.logo_class_name || dbStore.logoClassName;
  const about_text = dbStore.about_text || dbStore.aboutText;
  const meta_title = dbStore.meta_title || dbStore.metaTitle;
  const meta_description = dbStore.meta_description || dbStore.metaDescription;
  const content_intro_title = dbStore.content_intro_title || dbStore.contentIntroTitle;
  const content_intro_paragraph_1 = dbStore.content_intro_paragraph_1 || dbStore.contentIntroParagraph1;
  const content_intro_paragraph_2 = dbStore.content_intro_paragraph_2 || dbStore.contentIntroParagraph2;
  const content_why_items_text = dbStore.content_why_items_text || dbStore.contentWhyItemsText;
  const content_outro = dbStore.content_outro || dbStore.contentOutro;
  const faq_1_question = dbStore.faq_1_question || dbStore.faq1Question;
  const faq_1_answer = dbStore.faq_1_answer || dbStore.faq1Answer;
  const faq_2_question = dbStore.faq_2_question || dbStore.faq2Question;
  const faq_2_answer = dbStore.faq_2_answer || dbStore.faq2Answer;
  const faq_3_question = dbStore.faq_3_question || dbStore.faq3Question;
  const faq_3_answer = dbStore.faq_3_answer || dbStore.faq3Answer;
  const faq_4_question = dbStore.faq_4_question || dbStore.faq4Question;
  const faq_4_answer = dbStore.faq_4_answer || dbStore.faq4Answer;
  const faq_5_question = dbStore.faq_5_question || dbStore.faq5Question;
  const faq_5_answer = dbStore.faq_5_answer || dbStore.faq5Answer;
  const trust_status = dbStore.trust_status || dbStore.trustStatus;
  const is_featured = dbStore.is_featured ?? dbStore.isFeatured;
  const hero_image = dbStore.hero_image || dbStore.heroImage;
  const offers_count = dbStore.offers_count ?? dbStore.offersCount;
  const sidebar_banner_image = dbStore.sidebar_banner_image || dbStore.sidebarBannerImage;
  const sidebar_banner_url = dbStore.sidebar_banner_url || dbStore.sidebarBannerUrl;
  const created_at = dbStore.created_at || dbStore.createdAt;
  const updated_at = dbStore.updated_at || dbStore.updatedAt;

  return {
    id,
    name: dbStore.name,
    slug: dbStore.slug,
    category: dbStore.category,
    categorySlug: category_slug,
    countryCode: normalizeCountryCode(country_code),
    logoImage: logo_image || "",
    logoText: logo_text || dbStore.name || "",
    affiliateLink: affiliate_link || "",
    logoClassName:
      logo_class_name ||
      "border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text)] text-[12px] font-black",
    description: dbStore.description || "",
    aboutText: about_text || "",
    metaTitle: meta_title || "",
    metaDescription: meta_description || "",
    contentIntroTitle: content_intro_title || "",
    contentIntroParagraph1: content_intro_paragraph_1 || "",
    contentIntroParagraph2: content_intro_paragraph_2 || "",
    contentWhyItemsText: content_why_items_text || "",
    contentOutro: content_outro || "",
    faq1Question: faq_1_question || "",
    faq1Answer: faq_1_answer || "",
    faq2Question: faq_2_question || "",
    faq2Answer: faq_2_answer || "",
    faq3Question: faq_3_question || "",
    faq3Answer: faq_3_answer || "",
    faq4Question: faq_4_question || "",
    faq4Answer: faq_4_answer || "",
    faq5Question: faq_5_question || "",
    faq5Answer: faq_5_answer || "",
    trustStatus: trust_status || "Active",
    isFeatured: Boolean(is_featured),
    heroImage:
      hero_image ||
      "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80",
    rating: dbStore.rating || "4.7 (0 reviews)",
    offersCount: Number(offers_count ?? 0),
    position: Number(dbStore.position ?? 0),
    sidebarBannerImage: sidebar_banner_image || "",
    sidebarBannerUrl: sidebar_banner_url || "",
    createdAt: created_at,
    updatedAt: updated_at,
  };
}

function serializeStoreForDb(store) {
  const now = new Date().toISOString();
  const slug = store.slug.trim().toLowerCase();
  const category = store.category.trim();
  const category_slug =
    store.categorySlug?.trim().toLowerCase() ||
    category
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  return {
    id: store.id || `store_${slug}`,
    name: store.name.trim(),
    slug,
    category,
    category_slug,
    country_code: normalizeCountryCode(store.countryCode),
    logo_image: store.logoImage?.trim() || "",
    logo_text: store.logoText?.trim() || store.name.trim(),
    affiliate_link: store.affiliateLink?.trim() || "",
    logo_class_name:
      store.logoClassName?.trim() ||
      "border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text)] text-[12px] font-black",
    description: store.description?.trim() || `${store.name.trim()} deals and coupons updated by Couponchy.`,
    about_text: store.aboutText?.trim() || "",
    meta_title: store.metaTitle?.trim() || "",
    meta_description: store.metaDescription?.trim() || "",
    content_intro_title: store.contentIntroTitle?.trim() || "",
    content_intro_paragraph_1: store.contentIntroParagraph1?.trim() || "",
    content_intro_paragraph_2: store.contentIntroParagraph2?.trim() || "",
    content_why_items_text: store.contentWhyItemsText?.trim() || "",
    content_outro: store.contentOutro?.trim() || "",
    faq_1_question: store.faq1Question?.trim() || "",
    faq_1_answer: store.faq1Answer?.trim() || "",
    faq_2_question: store.faq2Question?.trim() || "",
    faq_2_answer: store.faq2Answer?.trim() || "",
    faq_3_question: store.faq3Question?.trim() || "",
    faq_3_answer: store.faq3Answer?.trim() || "",
    faq_4_question: store.faq4Question?.trim() || "",
    faq_4_answer: store.faq4Answer?.trim() || "",
    faq_5_question: store.faq5Question?.trim() || "",
    faq_5_answer: store.faq5Answer?.trim() || "",
    trust_status: store.trustStatus?.trim() || "Active",
    is_featured: Boolean(store.isFeatured),
    hero_image:
      store.heroImage?.trim() ||
      "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80",
    rating: store.rating?.trim() || "4.7 (0 reviews)",
    offers_count: Number(store.offersCount ?? 0),
    position: Number(store.position ?? 0),
    sidebar_banner_image: store.sidebarBannerImage?.trim() || "",
    sidebar_banner_url: store.sidebarBannerUrl?.trim() || "",
    created_at: store.createdAt || now,
    updated_at: now,
  };
}

export async function getAllStores() {
  if (isMongoEnabled()) {
    await connectToDatabase();
    const docs = await Store.find({}).sort({ created_at: -1 }).lean();
    return docs.map(mapDbStoreToJs);
  }

  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }
  return (data || []).map(mapDbStoreToJs);
}

export async function getStoreBySlug(slug) {
  const normalizedSlug = slug.trim().toLowerCase();
  if (isMongoEnabled()) {
    await connectToDatabase();
    const doc = await Store.findOne({ slug: normalizedSlug }).lean();
    return mapDbStoreToJs(doc);
  }

  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return mapDbStoreToJs(data);
}

export async function createStore(payload) {
  const store = serializeStoreForDb(payload);

  if (isMongoEnabled()) {
    await connectToDatabase();
    const existing = await Store.findOne({ slug: store.slug }).lean();
    if (existing) {
      throw new Error("A store with this slug already exists.");
    }
    await Store.create({ _id: store.id, ...store });
    return mapDbStoreToJs(store);
  }

  const { data: existing } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", store.slug)
    .maybeSingle();

  if (existing) {
    throw new Error("A store with this slug already exists.");
  }

  const { data, error } = await supabase
    .from("stores")
    .insert(store)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return mapDbStoreToJs(data);
}

export async function createStoresBulk(payloads) {
  const stores = payloads.map((p) => serializeStoreForDb(p));

  if (isMongoEnabled()) {
    await connectToDatabase();
    const bulkOps = stores.map((s) => ({
      updateOne: { filter: { _id: s.id }, update: { $set: { _id: s.id, ...s } }, upsert: true },
    }));
    if (bulkOps.length) {
      await Store.bulkWrite(bulkOps);
    }
    return stores.map(mapDbStoreToJs);
  }

  const { data, error } = await supabase
    .from("stores")
    .insert(stores)
    .select();

  if (error) {
    throw error;
  }
  return (data || []).map(mapDbStoreToJs);
}

export async function upsertStoresBulk(payloads) {
  const stores = payloads.map((p) => serializeStoreForDb(p));

  if (isMongoEnabled()) {
    await connectToDatabase();
    const bulkOps = stores.map((s) => ({
      updateOne: { filter: { slug: s.slug }, update: { $set: { _id: s.id, ...s } }, upsert: true },
    }));
    if (bulkOps.length) {
      await Store.bulkWrite(bulkOps);
    }
    return stores.map(mapDbStoreToJs);
  }

  const { data, error } = await supabase
    .from("stores")
    .upsert(stores, { onConflict: "slug" })
    .select();

  if (error) {
    throw error;
  }
  return (data || []).map(mapDbStoreToJs);
}

export async function updateStore(slug, payload) {
  if (isMongoEnabled()) {
    await connectToDatabase();
    const currentStore = await Store.findOne({ slug }).lean();
    if (!currentStore) return null;

    const currentJs = mapDbStoreToJs(currentStore);
    const merged = serializeStoreForDb({ ...currentJs, ...payload });

    const existing = await Store.findOne({ slug: merged.slug, _id: { $ne: currentStore._id } }).lean();
    if (existing) {
      throw new Error("Another store already uses this slug.");
    }

    await Store.updateOne({ _id: currentStore._id }, { $set: merged });

    if (merged.name !== currentStore.name) {
      const Offer = (await import("@/server/models/Offer")).default;
      await Offer.updateMany({ storeSlug: merged.slug }, { $set: { storeName: merged.name } });
    }

    return mapDbStoreToJs(merged);
  }

  const { data: currentStore, error: fetchError } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (fetchError || !currentStore) {
    return null;
  }

  const currentJs = mapDbStoreToJs(currentStore);
  const merged = serializeStoreForDb({
    ...currentJs,
    ...payload,
  });

  const { data: existing } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", merged.slug)
    .not("id", "eq", currentStore.id)
    .maybeSingle();

  if (existing) {
    throw new Error("Another store already uses this slug.");
  }

  const { data, error } = await supabase
    .from("stores")
    .update(merged)
    .eq("id", currentStore.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Keep store_name in offers table in sync if store name changed
  if (merged.name !== currentStore.name) {
    await supabase
      .from("offers")
      .update({ store_name: merged.name })
      .eq("store_slug", merged.slug);
  }

  return mapDbStoreToJs(data);
}

export async function deleteStore(slug) {
  const normalizedSlug = slug.trim().toLowerCase();

  if (isMongoEnabled()) {
    await connectToDatabase();
    const Offer = (await import("@/server/models/Offer")).default;
    await Offer.deleteMany({ storeSlug: normalizedSlug });
    await Store.deleteOne({ slug: normalizedSlug });
    return true;
  }

  // Delete associated offers first to prevent foreign key constraint violation
  await supabase
    .from("offers")
    .delete()
    .eq("store_slug", normalizedSlug);

  const { error } = await supabase
    .from("stores")
    .delete()
    .eq("slug", normalizedSlug);

  return !error;
}

export async function syncStoreOfferCount(slug, offersCount) {
  if (isMongoEnabled()) {
    await connectToDatabase();
    const updated = await Store.findOneAndUpdate(
      { slug },
      { $set: { offers_count: offersCount, updated_at: new Date().toISOString() } },
      { new: true }
    ).lean();
    return mapDbStoreToJs(updated);
  }

  const { data, error } = await supabase
    .from("stores")
    .update({ offers_count: offersCount, updated_at: new Date().toISOString() })
    .eq("slug", slug)
    .select()
    .single();

  if (error) {
    return null;
  }
  return mapDbStoreToJs(data);
}

export async function syncStoresForCategoryChange({ previousName, previousSlug, nextName, nextSlug }) {
  if (isMongoEnabled()) {
    await connectToDatabase();
    await Store.updateMany(
      { $or: [{ category_slug: previousSlug }, { category: previousName }] },
      { $set: { category: nextName, category_slug: nextSlug, updated_at: new Date().toISOString() } }
    );
    return;
  }

  const { error } = await supabase
    .from("stores")
    .update({ category: nextName, category_slug: nextSlug, updated_at: new Date().toISOString() })
    .or(`category_slug.eq.${previousSlug},category.eq.${previousName}`);

  if (error) {
    throw error;
  }
}
