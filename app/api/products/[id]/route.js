import { NextResponse } from "next/server";
import { deleteProduct, getProductById, updateProduct } from "@/server/repositories/products-repository";
import { validateProductPayload } from "@/lib/validators";
import { requirePermission } from "@/server/auth";

export async function GET(_request, { params }) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  return NextResponse.json({ data: product });
}

export async function PUT(request, { params }) {
  const access = await requirePermission("products");
  if (access.error) {
    return access.error;
  }

  try {
    const { id } = await params;
    const payload = await request.json();
    const validationError = validateProductPayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const product = await updateProduct(id, payload);

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ data: product });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to update product." }, { status: 400 });
  }
}

export async function DELETE(_request, { params }) {
  const access = await requirePermission("products");
  if (access.error) {
    return access.error;
  }

  const { id } = await params;
  const deleted = await deleteProduct(id);

  if (!deleted) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
