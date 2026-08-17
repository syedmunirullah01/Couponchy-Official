import { NextResponse } from "next/server";
import { createStore, getAllStores, getPaginatedStores } from "@/server/repositories/stores-repository";
import { validateStorePayload } from "@/lib/validators";
import { normalizeCountryCode } from "@/lib/countries";
import { requirePermission } from "@/server/auth";
import { revalidatePath } from "next/cache";
import { translateStoreOnSave } from "@/server/services/translation-service";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page");
  const limit = searchParams.get("limit");
  const search = searchParams.get("search") || "";
  const requestedCountryCode = searchParams.get("country");

  if (page) {
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 15;
    const countryFilter = requestedCountryCode || "all";
    const result = await getPaginatedStores({
      page: parsedPage,
      limit: parsedLimit,
      search,
      country: countryFilter
    });
    return NextResponse.json(result);
  }
  
  // Project only basic fields needed for lists and dropdowns to speed up load time
  const projection = "name slug category category_slug country_code logo_image logo_text affiliate_link logo_class_name trust_status offers_count position created_at";
  const stores = await getAllStores(projection);

  if (!requestedCountryCode) {
    return NextResponse.json({ data: stores });
  }

  const countryCode = normalizeCountryCode(requestedCountryCode);
  return NextResponse.json({ data: stores.filter((store) => store.countryCode === countryCode) });
}

export async function POST(request) {
  const access = await requirePermission("stores");
  if (access.error) {
    return access.error;
  }

  try {
    const payload = await request.json();
    const validationError = validateStorePayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const store = await createStore(payload);
    translateStoreOnSave(store).catch((err) =>
      console.error("[POST /api/stores] Auto translation failed:", err)
    );
    revalidatePath("/", "layout");
    return NextResponse.json({ data: store }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to create store." }, { status: 400 });
  }
}

