import { NextResponse } from "next/server";
import { requirePermission } from "@/server/auth";
import { createOffersBulk, getAllOffers } from "@/server/repositories/offers-repository";
import { getAllStores, syncStoreOfferCount } from "@/server/repositories/stores-repository";

function normalizeCsvValue(value) {
  return String(value || "").trim();
}

function buildDuplicateKey({ storeSlug, title, type, description, expiryDate, status, affiliateLink }) {
  return [
    storeSlug.toLowerCase(),
    type.toLowerCase(),
    title.trim().toLowerCase(),
    normalizeCsvValue(description).toLowerCase(),
    normalizeCsvValue(expiryDate).toLowerCase(),
    normalizeCsvValue(status).toLowerCase(),
    normalizeCsvValue(affiliateLink).toLowerCase(),
  ].join("::");
}

function normalizeType(value) {
  const normalized = normalizeCsvValue(value).toLowerCase();
  return normalized === "deal" ? "Deal" : "Coupon";
}

function normalizeStatus(value) {
  const normalized = normalizeCsvValue(value).toLowerCase();
  if (normalized === "expired") {
    return "Expired";
  }

  return "Active";
}

function isValidDateString(value) {
  if (!value) {
    return true;
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
    const [month, day, year] = value.split("/").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function normalizeExpiryDate(value) {
  const normalized = normalizeCsvValue(value);

  if (!normalized) {
    return "";
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(normalized)) {
    const [month, day, year] = normalized.split("/").map(Number);
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return normalized;
}

export async function POST(request) {
  const access = await requirePermission("offers");
  if (access.error) {
    return access.error;
  }

  try {
    const payload = await request.json();
    const rows = Array.isArray(payload?.rows) ? payload.rows : [];

    if (!rows.length) {
      return NextResponse.json({ error: "No coupon rows were provided." }, { status: 400 });
    }

    const [stores, existingOffers] = await Promise.all([getAllStores(), getAllOffers()]);
    const storesBySlug = new Map(stores.map((store) => [store.slug, store]));
    const existingDuplicateKeys = new Set(
      existingOffers.map((offer) =>
        buildDuplicateKey({
          storeSlug: offer.storeSlug,
          title: offer.title,
          type: offer.type,
          description: offer.description,
          expiryDate: offer.expiryDate,
          status: offer.status,
          affiliateLink: offer.affiliateLink,
        })
      )
    );

    const validPayloads = [];
    const failedRows = [];
    let skippedDuplicates = 0;

    let fallbackStoreSlug = "";

    rows.forEach((row, index) => {
      const storeSlug = normalizeCsvValue(row.storeSlug).toLowerCase() || fallbackStoreSlug;
      const title = normalizeCsvValue(row.title);
      const description = normalizeCsvValue(row.description);
      const type = normalizeType(row.type);
      const code = normalizeCsvValue(row.code);
      const expiryDate = normalizeExpiryDate(row.expiryDate);
      const status = normalizeStatus(row.status);
      const source = normalizeCsvValue(row.source) || "Manual";
      const affiliateLink = normalizeCsvValue(row.affiliateLink);

      if (storeSlug) {
        fallbackStoreSlug = storeSlug;
      }

      if (!storeSlug || !title) {
        failedRows.push({
          rowNumber: index + 2,
          reason: "Missing one or more required fields.",
        });
        return;
      }

      if (type === "Coupon" && !code) {
        failedRows.push({
          rowNumber: index + 2,
          reason: "Coupon rows require a code.",
        });
        return;
      }

      if (!isValidDateString(expiryDate)) {
        failedRows.push({
          rowNumber: index + 2,
          reason: "Expiry date must use YYYY-MM-DD or MM/DD/YYYY format.",
        });
        return;
      }

      const store = storesBySlug.get(storeSlug);
      if (!store) {
        failedRows.push({
          rowNumber: index + 2,
          reason: `Store "${storeSlug}" does not exist.`,
        });
        return;
      }

      const resolvedAffiliateLink = affiliateLink || store.affiliateLink || "";
      const duplicateKey = buildDuplicateKey({
        storeSlug,
        title,
        type,
        description,
        expiryDate,
        status,
        affiliateLink: resolvedAffiliateLink,
      });
      if (existingDuplicateKeys.has(duplicateKey)) {
        skippedDuplicates += 1;
        return;
      }

      existingDuplicateKeys.add(duplicateKey);

      validPayloads.push({
        title,
        description,
        type,
        storeSlug,
        storeName: store.name,
        source,
        expiryDate,
        status,
        code,
        affiliateLink: resolvedAffiliateLink,
      });
    });

    if (validPayloads.length) {
      await createOffersBulk(validPayloads);

      const affectedStoreSlugs = [...new Set(validPayloads.map((item) => item.storeSlug))];
      const nextOffers = await getAllOffers();

      await Promise.all(
        affectedStoreSlugs.map((storeSlug) =>
          syncStoreOfferCount(
            storeSlug,
            nextOffers.filter((offer) => offer.storeSlug === storeSlug).length
          )
        )
      );
    }

    return NextResponse.json(
      {
        data: {
          totalRecords: rows.length,
          successfullyAdded: validPayloads.length,
          skippedDuplicates,
          failed: failedRows.length,
          errors: failedRows,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to process bulk coupon import." }, { status: 400 });
  }
}
