
import "server-only";

import { supabase } from "@/lib/supabase";

function mapDbOfferToJs(dbOffer) {
  if (!dbOffer) return null;
  return {
    id: dbOffer.id,
    title: dbOffer.title,
    description: dbOffer.description || "Fresh offer imported into Couponchy.",
    type: dbOffer.type || "Coupon",
    storeSlug: dbOffer.store_slug,
    storeName: dbOffer.store_name,
    source: dbOffer.source || "Manual",
    expiryDate: dbOffer.expiry_date,
    status: dbOffer.status || "Active",
    code: dbOffer.code || "",
    affiliateLink: dbOffer.affiliate_link || "",
    ctaLabel: dbOffer.cta_label || (dbOffer.type === "Deal" ? "Get Deal" : "Get Code"),
    position: dbOffer.position || 0,
    autoRenew: dbOffer.auto_renew ?? false,
    createdAt: dbOffer.created_at,
    updatedAt: dbOffer.updated_at,
  };
}

function serializeOfferForDb(offer) {
  const now = new Date().toISOString();
  const storeSlug = offer.storeSlug.trim().toLowerCase();

  // If expiry date is provided manually, use it. Otherwise store NULL (auto_renew=true).
  const hadManualExpiry = Boolean(offer.expiryDate?.trim());
  const expiryDate = hadManualExpiry ? offer.expiryDate.trim() : null;

  return {
    id: offer.id || `offer_${storeSlug}_${Math.random().toString(36).slice(2, 10)}`,
    title: offer.title.trim(),
    description: offer.description?.trim() || "Fresh offer imported into Couponchy.",
    type: offer.type?.trim() || "Coupon",
    store_slug: storeSlug,
    store_name: offer.storeName.trim(),
    source: offer.source?.trim() || "Manual",
    expiry_date: expiryDate,
    // auto_renew: true means no manual expiry was given — cron will renew every 15 days
    auto_renew: !hadManualExpiry,
    status: offer.status?.trim() || "Active",
    code: offer.code?.trim() || "",
    affiliate_link: offer.affiliateLink?.trim() || "",
    cta_label: offer.ctaLabel?.trim() || (offer.type === "Deal" ? "Get Deal" : "Get Code"),
    position: Number(offer.position || 0),
    created_at: offer.createdAt || now,
    updated_at: now,
  };
}

export async function getAllOffers() {
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const today = new Date().toISOString().slice(0, 10);
  const jsOffers = (data || []).map(mapDbOfferToJs);

  const expiredIds = jsOffers
    .filter(o => !o.autoRenew && o.expiryDate && o.expiryDate < today)
    .map(o => o.id);

  if (expiredIds.length > 0) {
    supabase.from("offers").delete().in("id", expiredIds).then(({ error }) => {
      if (error) console.error("[offers-repository] Failed to delete expired offers:", error);
    });
  }

  return jsOffers.filter(o => o.autoRenew || !o.expiryDate || o.expiryDate >= today);
}

export async function getOfferById(id) {
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const offer = mapDbOfferToJs(data);
  if (!offer) return null;

  const today = new Date().toISOString().slice(0, 10);
  if (!offer.autoRenew && offer.expiryDate && offer.expiryDate < today) {
    supabase.from("offers").delete().eq("id", id).then(({ error }) => {
      if (error) console.error("[offers-repository] Failed to delete expired offer:", error);
    });
    return null;
  }

  return offer;
}

export async function getOffersByStoreSlug(storeSlug) {
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .eq("store_slug", storeSlug.trim().toLowerCase())
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const today = new Date().toISOString().slice(0, 10);
  const jsOffers = (data || []).map(mapDbOfferToJs);

  const expiredIds = jsOffers
    .filter(o => !o.autoRenew && o.expiryDate && o.expiryDate < today)
    .map(o => o.id);

  if (expiredIds.length > 0) {
    supabase.from("offers").delete().in("id", expiredIds).then(({ error }) => {
      if (error) console.error("[offers-repository] Failed to delete expired offers:", error);
    });
  }

  return jsOffers.filter(o => o.autoRenew || !o.expiryDate || o.expiryDate >= today);
}

export async function createOffer(payload) {
  const offer = serializeOfferForDb(payload);

  const { data, error } = await supabase
    .from("offers")
    .insert(offer)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return mapDbOfferToJs(data);
}

export async function createOffersBulk(payloads) {
  const offers = payloads.map((p) => serializeOfferForDb(p));

  const { data, error } = await supabase
    .from("offers")
    .insert(offers)
    .select();

  if (error) {
    throw error;
  }
  return (data || []).map(mapDbOfferToJs);
}

export async function updateOffer(id, payload) {
  const { data: currentOffer, error: fetchError } = await supabase
    .from("offers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !currentOffer) {
    return null;
  }

  const currentJs = mapDbOfferToJs(currentOffer);
  const merged = serializeOfferForDb({
    ...currentJs,
    ...payload,
    id: currentOffer.id,
    createdAt: currentOffer.created_at,
  });

  const { data, error } = await supabase
    .from("offers")
    .update(merged)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return mapDbOfferToJs(data);
}

export async function deleteOffer(id) {
  const { error } = await supabase
    .from("offers")
    .delete()
    .eq("id", id);

  return !error;
}

export async function deleteOffersByStoreSlug(storeSlug) {
  const { error } = await supabase
    .from("offers")
    .delete()
    .eq("store_slug", storeSlug.trim().toLowerCase());

  return !error;
}
