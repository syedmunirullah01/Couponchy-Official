import "server-only";

import { supabase } from "@/lib/supabase";
import { connectToDatabase } from "@/lib/mongodb";
import Offer from "@/server/models/Offer";

function isMongoEnabled() {
  return process.env.USE_MONGODB === "true" || (process.env.USE_MONGODB !== "false" && Boolean(process.env.MONGODB_URI));
}

function mapDbOfferToJs(dbOffer) {
  if (!dbOffer) return null;
  const id = dbOffer.id || dbOffer._id;
  const store_slug = dbOffer.store_slug || dbOffer.storeSlug;
  const store_name = dbOffer.store_name || dbOffer.storeName;
  const expiry_date = dbOffer.expiry_date || dbOffer.expiryDate;
  const affiliate_link = dbOffer.affiliate_link || dbOffer.affiliateLink;
  const cta_label = dbOffer.cta_label || dbOffer.ctaLabel;
  const auto_renew = dbOffer.auto_renew ?? dbOffer.autoRenew;
  const created_at = dbOffer.created_at || dbOffer.createdAt;
  const updated_at = dbOffer.updated_at || dbOffer.updatedAt;

  return {
    id,
    title: dbOffer.title,
    description: dbOffer.description || "Fresh offer imported into Couponchy.",
    type: dbOffer.type || "Coupon",
    storeSlug: store_slug,
    storeName: store_name,
    source: dbOffer.source || "Manual",
    expiryDate: expiry_date,
    status: dbOffer.status || "Active",
    code: dbOffer.code || "",
    affiliateLink: affiliate_link || "",
    ctaLabel: cta_label || (dbOffer.type === "Deal" ? "Get Deal" : "Get Code"),
    position: Number(dbOffer.position || 0),
    autoRenew: auto_renew ?? false,
    createdAt: created_at,
    updatedAt: updated_at,
  };
}

function serializeOfferForDb(offer) {
  const now = new Date().toISOString();
  const rawStoreSlug = offer.storeSlug || offer.store_slug || "";
  const storeSlug = String(rawStoreSlug).trim().toLowerCase();
  const rawStoreName = offer.storeName || offer.store_name || "";
  const storeName = String(rawStoreName).trim();

  const rawExpiry = offer.expiryDate || offer.expiry_date;
  const hadManualExpiry = Boolean(rawExpiry && String(rawExpiry).trim());
  const expiryDate = hadManualExpiry ? String(rawExpiry).trim() : null;

  return {
    id: offer.id || `offer_${storeSlug}_${Math.random().toString(36).slice(2, 10)}`,
    title: String(offer.title || "").trim(),
    description: String(offer.description || "").trim() || "Fresh offer imported into Couponchy.",
    type: String(offer.type || "").trim() || "Coupon",
    store_slug: storeSlug,
    storeSlug: storeSlug,
    store_name: storeName,
    storeName: storeName,
    source: String(offer.source || "").trim() || "Manual",
    expiry_date: expiryDate,
    expiryDate: expiryDate,
    auto_renew: !hadManualExpiry,
    autoRenew: !hadManualExpiry,
    status: String(offer.status || "").trim() || "Active",
    code: String(offer.code || "").trim(),
    affiliate_link: String(offer.affiliateLink || offer.affiliate_link || "").trim(),
    affiliateLink: String(offer.affiliateLink || offer.affiliate_link || "").trim(),
    cta_label: String(offer.ctaLabel || offer.cta_label || "").trim() || (offer.type === "Deal" ? "Get Deal" : "Get Code"),
    ctaLabel: String(offer.ctaLabel || offer.cta_label || "").trim() || (offer.type === "Deal" ? "Get Deal" : "Get Code"),
    position: Number(offer.position || 0),
    created_at: offer.createdAt || offer.created_at || now,
    updated_at: now,
  };
}

export async function getAllOffers() {
  if (isMongoEnabled()) {
    await connectToDatabase();
    const docs = await Offer.find({}).sort({ created_at: -1 }).lean();
    const today = new Date().toISOString().slice(0, 10);
    const jsOffers = docs.map(mapDbOfferToJs).filter(Boolean);
    const expiredIds = jsOffers
      .filter(o => o && !o.autoRenew && o.expiryDate && o.expiryDate < today)
      .map(o => o.id);

    if (expiredIds.length > 0) {
      Offer.deleteMany({ _id: { $in: expiredIds } }).catch(err =>
        console.error("[offers-repository] Failed to delete expired Mongo offers:", err)
      );
    }
    return jsOffers.filter(o => o && (o.autoRenew || !o.expiryDate || o.expiryDate >= today));
  }

  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const today = new Date().toISOString().slice(0, 10);
  const jsOffers = (data || []).map(mapDbOfferToJs).filter(Boolean);

  const expiredIds = jsOffers
    .filter(o => o && !o.autoRenew && o.expiryDate && o.expiryDate < today)
    .map(o => o.id);

  if (expiredIds.length > 0) {
    supabase.from("offers").delete().in("id", expiredIds).then(({ error }) => {
      if (error) console.error("[offers-repository] Failed to delete expired offers:", error);
    });
  }

  return jsOffers.filter(o => o && (o.autoRenew || !o.expiryDate || o.expiryDate >= today));
}

export async function getOfferById(id) {
  if (isMongoEnabled()) {
    await connectToDatabase();
    const doc = await Offer.findOne({ _id: id }).lean();
    const offer = mapDbOfferToJs(doc);
    if (!offer) return null;

    const today = new Date().toISOString().slice(0, 10);
    if (!offer.autoRenew && offer.expiryDate && offer.expiryDate < today) {
      Offer.deleteOne({ _id: id }).catch(err =>
        console.error("[offers-repository] Failed to delete expired Mongo offer:", err)
      );
      return null;
    }
    return offer;
  }

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
  const normalizedSlug = storeSlug.trim().toLowerCase();

  if (isMongoEnabled()) {
    await connectToDatabase();
    const docs = await Offer.find({ store_slug: normalizedSlug })
      .sort({ position: 1, created_at: -1 })
      .lean();
    const today = new Date().toISOString().slice(0, 10);
    const jsOffers = docs.map(mapDbOfferToJs);

    const expiredIds = jsOffers
      .filter(o => !o.autoRenew && o.expiryDate && o.expiryDate < today)
      .map(o => o.id);

    if (expiredIds.length > 0) {
      Offer.deleteMany({ _id: { $in: expiredIds } }).catch(err =>
        console.error("[offers-repository] Failed to delete expired Mongo offers:", err)
      );
    }
    return jsOffers.filter(o => o.autoRenew || !o.expiryDate || o.expiryDate >= today);
  }

  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .eq("store_slug", normalizedSlug)
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

  if (isMongoEnabled()) {
    await connectToDatabase();
    await Offer.create({ _id: offer.id, ...offer });
    return mapDbOfferToJs(offer);
  }

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

  if (isMongoEnabled()) {
    await connectToDatabase();
    const bulkOps = offers.map(o => ({
      updateOne: { filter: { _id: o.id }, update: { $set: { _id: o.id, ...o } }, upsert: true }
    }));
    if (bulkOps.length) {
      await Offer.bulkWrite(bulkOps);
    }
    return offers.map(mapDbOfferToJs);
  }

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
  if (isMongoEnabled()) {
    await connectToDatabase();
    const currentOffer = await Offer.findOne({ _id: id }).lean();
    if (!currentOffer) return null;

    const currentJs = mapDbOfferToJs(currentOffer);
    const merged = serializeOfferForDb({
      ...currentJs,
      ...payload,
      id: currentOffer._id,
      createdAt: currentOffer.created_at,
    });

    await Offer.updateOne({ _id: id }, { $set: merged });
    return mapDbOfferToJs(merged);
  }

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
  if (isMongoEnabled()) {
    await connectToDatabase();
    await Offer.deleteOne({ _id: id });
    return true;
  }

  const { error } = await supabase
    .from("offers")
    .delete()
    .eq("id", id);

  return !error;
}

export async function deleteOffersByStoreSlug(storeSlug) {
  const normalizedSlug = storeSlug.trim().toLowerCase();

  if (isMongoEnabled()) {
    await connectToDatabase();
    await Offer.deleteMany({ store_slug: normalizedSlug });
    return true;
  }

  const { error } = await supabase
    .from("offers")
    .delete()
    .eq("store_slug", normalizedSlug);

  return !error;
}
