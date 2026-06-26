import { NextResponse } from "next/server";
import { deleteOffer, getAllOffers, getOfferById, updateOffer } from "@/server/repositories/offers-repository";
import { getStoreBySlug, syncStoreOfferCount } from "@/server/repositories/stores-repository";
import { validateOfferPayload } from "@/lib/validators";
import { requirePermission } from "@/server/auth";

export async function GET(_request, { params }) {
  const { id } = await params;
  const offer = await getOfferById(id);

  if (!offer) {
    return NextResponse.json({ error: "Offer not found." }, { status: 404 });
  }

  return NextResponse.json({ data: offer });
}

export async function PUT(request, { params }) {
  const access = await requirePermission("offers");
  if (access.error) {
    return access.error;
  }

  try {
    const { id } = await params;
    const existingOffer = await getOfferById(id);
    const payload = await request.json();
    const validationError = validateOfferPayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const store = await getStoreBySlug(payload.storeSlug);
    if (!store) {
      return NextResponse.json({ error: "Selected store does not exist." }, { status: 400 });
    }

    const offer = await updateOffer(id, {
      ...payload,
      affiliateLink: payload.affiliateLink?.trim() || store.affiliateLink || "",
    });

    if (!offer) {
      return NextResponse.json({ error: "Offer not found." }, { status: 404 });
    }

    const offers = await getAllOffers();
    const nextStoreCount = offers.filter((item) => item.storeSlug === offer.storeSlug).length;
    await syncStoreOfferCount(offer.storeSlug, nextStoreCount);
    if (existingOffer?.storeSlug && existingOffer.storeSlug !== offer.storeSlug) {
      const previousStoreCount = offers.filter((item) => item.storeSlug === existingOffer.storeSlug).length;
      await syncStoreOfferCount(existingOffer.storeSlug, previousStoreCount);
    }

    return NextResponse.json({ data: offer });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to update offer." }, { status: 400 });
  }
}

export async function DELETE(_request, { params }) {
  const access = await requirePermission("offers");
  if (access.error) {
    return access.error;
  }

  const { id } = await params;
  const existingOffer = await getOfferById(id);
  const deleted = await deleteOffer(id);

  if (!deleted) {
    return NextResponse.json({ error: "Offer not found." }, { status: 404 });
  }

  if (existingOffer) {
    const offers = await getAllOffers();
    const storeOfferCount = offers.filter((item) => item.storeSlug === existingOffer.storeSlug).length;
    await syncStoreOfferCount(existingOffer.storeSlug, storeOfferCount);
  }

  return NextResponse.json({ success: true });
}
