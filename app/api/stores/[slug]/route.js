import { NextResponse } from "next/server";
import { deleteStore, getStoreBySlug, updateStore } from "@/server/repositories/stores-repository";
import { deleteOffersByStoreSlug } from "@/server/repositories/offers-repository";
import { validateStorePayload } from "@/lib/validators";
import { requirePermission } from "@/server/auth";

export async function GET(_request, { params }) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);

  if (!store) {
    return NextResponse.json({ error: "Store not found." }, { status: 404 });
  }

  return NextResponse.json({ data: store });
}

export async function PUT(request, { params }) {
  const access = await requirePermission("stores");
  if (access.error) {
    return access.error;
  }

  try {
    const { slug } = await params;
    const payload = await request.json();
    const validationError = validateStorePayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const store = await updateStore(slug, payload);

    if (!store) {
      return NextResponse.json({ error: "Store not found." }, { status: 404 });
    }

    return NextResponse.json({ data: store });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to update store." }, { status: 400 });
  }
}

export async function DELETE(_request, { params }) {
  const access = await requirePermission("stores");
  if (access.error) {
    return access.error;
  }

  const { slug } = await params;
  const deleted = await deleteStore(slug);

  if (!deleted) {
    return NextResponse.json({ error: "Store not found." }, { status: 404 });
  }

  await deleteOffersByStoreSlug(slug);

  return NextResponse.json({ success: true });
}
