import { NextResponse } from "next/server";
import { createOffer, getAllOffers } from "@/server/repositories/offers-repository";
import { getAllStores, getStoreBySlug, syncStoreOfferCount } from "@/server/repositories/stores-repository";
import { normalizeCountryCode } from "@/lib/countries";
import { validateOfferPayload } from "@/lib/validators";
import { requirePermission } from "@/server/auth";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const requestedCountryCode = searchParams.get("country");
  const offers = await getAllOffers();

  if (!requestedCountryCode) {
    return NextResponse.json({ data: offers });
  }

  const countryCode = normalizeCountryCode(requestedCountryCode);
  const stores = await getAllStores();
  const allowedStoreSlugs = new Set(
    stores.filter((store) => store.countryCode === countryCode).map((store) => store.slug)
  );

  return NextResponse.json({ data: offers.filter((offer) => allowedStoreSlugs.has(offer.storeSlug)) });
}

export async function POST(request) {
  const access = await requirePermission("offers");
  if (access.error) {
    return access.error;
  }

  try {
    const payload = await request.json();
    const validationError = validateOfferPayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const store = await getStoreBySlug(payload.storeSlug);
    if (!store) {
      return NextResponse.json({ error: "Selected store does not exist." }, { status: 400 });
    }

    const offer = await createOffer({
      ...payload,
      affiliateLink: payload.affiliateLink?.trim() || store.affiliateLink || "",
    });
    const offers = await getAllOffers();
    const storeOfferCount = offers.filter((item) => item.storeSlug === payload.storeSlug).length;
    await syncStoreOfferCount(payload.storeSlug, storeOfferCount);
    return NextResponse.json({ data: offer }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to create offer." }, { status: 400 });
  }
}
