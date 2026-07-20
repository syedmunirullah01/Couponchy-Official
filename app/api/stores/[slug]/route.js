import { NextResponse } from "next/server";
import { deleteStore, getStoreBySlug, updateStore } from "@/server/repositories/stores-repository";
import { deleteOffersByStoreSlug, getOffersByStoreSlug } from "@/server/repositories/offers-repository";
import { validateStorePayload } from "@/lib/validators";
import { requirePermission } from "@/server/auth";
import { revalidatePath } from "next/cache";
import { translateStoreOnSave } from "@/server/services/translation-service";
import { generateStoreContent, generateStoreAboutDescription } from "@/lib/store-seo-templates";
import { generateLocalizedStoreMetadata } from "@/server/services/catalog-service";
import { COUNTRY_TO_LANG } from "@/server/services/translation-service";

export async function GET(_request, { params }) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);

  if (!store) {
    return NextResponse.json({ error: "Store not found." }, { status: 404 });
  }

  const offers = await getOffersByStoreSlug(slug);
  const generatedContent = generateStoreContent(store, offers);
  const generatedAboutText = generateStoreAboutDescription(store, offers);

  const lang = COUNTRY_TO_LANG[String(store.countryCode || "").toUpperCase()] || "en";
  const generatedMetadata = generateLocalizedStoreMetadata(store, offers, lang, store.countryCode);

  return NextResponse.json({
    data: {
      ...store,
      generatedAboutText,
      generatedIntroTitle: generatedContent.introTitle,
      generatedIntroParagraph1: generatedContent.introParagraphs[0] || "",
      generatedIntroParagraph2: generatedContent.introParagraphs[1] || "",
      generatedWhyItemsText: generatedContent.whyItems.join("\n"),
      generatedOutro: generatedContent.outro || "",
      generatedFaqs: generatedContent.faqs,
      generatedMetaTitle: generatedMetadata.title || "",
      generatedMetaDescription: generatedMetadata.description || "",
    }
  });
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

    translateStoreOnSave(store).catch((err) =>
      console.error("[PUT /api/stores/[slug]] Auto translation failed:", err)
    );
    revalidatePath("/", "layout");
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
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true });
}
