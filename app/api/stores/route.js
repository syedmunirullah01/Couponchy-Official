import { NextResponse } from "next/server";
import { createStore, getAllStores } from "@/server/repositories/stores-repository";
import { validateStorePayload } from "@/lib/validators";
import { normalizeCountryCode } from "@/lib/countries";
import { requirePermission } from "@/server/auth";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const requestedCountryCode = searchParams.get("country");
  const stores = await getAllStores();

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
    return NextResponse.json({ data: store }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to create store." }, { status: 400 });
  }
}
