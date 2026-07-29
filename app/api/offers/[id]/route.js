import { NextResponse } from "next/server";
import { deleteOffer, getAllOffers, getOfferById, getOffersByStoreSlug, updateOffer } from "@/server/repositories/offers-repository";
import { getStoreBySlug, syncStoreOfferCount } from "@/server/repositories/stores-repository";
import { validateOfferPayload } from "@/lib/validators";
import { requirePermission } from "@/server/auth";
import { revalidatePath } from "next/cache";
import { translateOfferOnSave } from "@/server/services/translation-service";

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

    const nextStoreOffers = await getOffersByStoreSlug(offer.storeSlug);
    await syncStoreOfferCount(offer.storeSlug, nextStoreOffers.length);
    if (existingOffer?.storeSlug && existingOffer.storeSlug !== offer.storeSlug) {
      const prevStoreOffers = await getOffersByStoreSlug(existingOffer.storeSlug);
      await syncStoreOfferCount(existingOffer.storeSlug, prevStoreOffers.length);
    }

    translateOfferOnSave(offer).catch((err) =>
      console.error("[PUT /api/offers/[id]] Auto translation failed:", err)
    );
    revalidatePath("/");
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
    const storeOffers = await getOffersByStoreSlug(existingOffer.storeSlug);
    await syncStoreOfferCount(existingOffer.storeSlug, storeOffers.length);
  }

  revalidatePath("/");
  return NextResponse.json({ success: true });
}
