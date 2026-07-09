import { NextResponse } from "next/server";
import { createCategory, getAllCategories } from "@/server/repositories/categories-repository";
import { validateCategoryPayload } from "@/lib/validators";
import { requirePermission } from "@/server/auth";
import { revalidatePath } from "next/cache";
import { translateCategoryOnSave } from "@/server/services/translation-service";

export async function GET() {
  const categories = await getAllCategories();
  return NextResponse.json({ data: categories });
}

export async function POST(request) {
  const access = await requirePermission("categories");
  if (access.error) {
    return access.error;
  }

  try {
    const payload = await request.json();
    const validationError = validateCategoryPayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const category = await createCategory(payload);
    translateCategoryOnSave(category).catch((err) =>
      console.error("[POST /api/categories] Auto translation failed:", err)
    );
    revalidatePath("/", "layout");
    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to create category." }, { status: 400 });
  }
}

