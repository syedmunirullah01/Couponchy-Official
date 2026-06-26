import { NextResponse } from "next/server";
import { deleteCategory, getCategoryBySlug, updateCategory } from "@/server/repositories/categories-repository";
import { validateCategoryPayload } from "@/lib/validators";
import { requirePermission } from "@/server/auth";

export async function GET(_request, { params }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  return NextResponse.json({ data: category });
}

export async function PUT(request, { params }) {
  const access = await requirePermission("categories");
  if (access.error) {
    return access.error;
  }

  try {
    const { slug } = await params;
    const payload = await request.json();
    const validationError = validateCategoryPayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const category = await updateCategory(slug, payload);

    if (!category) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    return NextResponse.json({ data: category });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to update category." }, { status: 400 });
  }
}

export async function DELETE(_request, { params }) {
  const access = await requirePermission("categories");
  if (access.error) {
    return access.error;
  }

  try {
    const { slug } = await params;
    const result = await deleteCategory(slug);

    if (!result.deleted) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to delete category." }, { status: 400 });
  }
}
