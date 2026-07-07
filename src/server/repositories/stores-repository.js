import "server-only";

import { supabase } from "@/lib/supabase";
import { normalizeCountryCode } from "@/lib/countries";

function mapDbStoreToJs(dbStore) {
  if (!dbStore) return null;
  return {
    id: dbStore.id,
    name: dbStore.name,
    slug: dbStore.slug,
    category: dbStore.category,
    categorySlug: dbStore.category_slug,
    countryCode: normalizeCountryCode(dbStore.country_code),
    logoImage: dbStore.logo_image || "",
    logoText: dbStore.logo_text || dbStore.name || "",
    affiliateLink: dbStore.affiliate_link || "",
    logoClassName:
      dbStore.logo_class_name ||
      "border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text)] text-[12px] font-black",
    description: dbStore.description || "",
    contentIntroTitle: dbStore.content_intro_title || "",
    contentIntroParagraph1: dbStore.content_intro_paragraph_1 || "",
    contentIntroParagraph2: dbStore.content_intro_paragraph_2 || "",
    contentWhyItemsText: dbStore.content_why_items_text || "",
    contentOutro: dbStore.content_outro || "",
    faq1Question: dbStore.faq_1_question || "",
    faq1Answer: dbStore.faq_1_answer || "",
    faq2Question: dbStore.faq_2_question || "",
    faq2Answer: dbStore.faq_2_answer || "",
    faq3Question: dbStore.faq_3_question || "",
    faq3Answer: dbStore.faq_3_answer || "",
    trustStatus: dbStore.trust_status || "Active",
    isFeatured: Boolean(dbStore.is_featured),
    heroImage:
      dbStore.hero_image ||
      "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80",
    rating: dbStore.rating || "4.7 (0 reviews)",
    offersCount: Number(dbStore.offers_count ?? 0),
    createdAt: dbStore.created_at,
    updatedAt: dbStore.updated_at,
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
    trust_status: store.trustStatus?.trim() || "Active",
    is_featured: Boolean(store.isFeatured),
    hero_image:
      store.heroImage?.trim() ||
      "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80",
    rating: store.rating?.trim() || "4.7 (0 reviews)",
    offers_count: Number(store.offersCount ?? 0),
    created_at: store.createdAt || now,
    updated_at: now,
  };
}

export async function getAllStores() {
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
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug.trim().toLowerCase())
    .maybeSingle();

  if (error) {
    throw error;
  }
  return mapDbStoreToJs(data);
}

export async function createStore(payload) {
  const store = serializeStoreForDb(payload);

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
  return mapDbStoreToJs(data);
}

export async function deleteStore(slug) {
  const { error } = await supabase
    .from("stores")
    .delete()
    .eq("slug", slug);

  return !error;
}

export async function syncStoreOfferCount(slug, offersCount) {
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
  const { error } = await supabase
    .from("stores")
    .update({ category: nextName, category_slug: nextSlug, updated_at: new Date().toISOString() })
    .or(`category_slug.eq.${previousSlug},category.eq.${previousName}`);

  if (error) {
    throw error;
  }
}
