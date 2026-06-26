import { NextResponse } from "next/server";
import { createProduct, getAllProducts } from "@/server/repositories/products-repository";
import { validateProductPayload } from "@/lib/validators";
import { requirePermission } from "@/server/auth";

export async function GET() {
  const products = await getAllProducts();
  return NextResponse.json({ data: products });
}

export async function POST(request) {
  const access = await requirePermission("products");
  if (access.error) {
    return access.error;
  }

  try {
    const payload = await request.json();
    const validationError = validateProductPayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const product = await createProduct(payload);
    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to create product." }, { status: 400 });
  }
}
