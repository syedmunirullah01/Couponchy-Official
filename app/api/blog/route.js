import { NextResponse } from "next/server";
import { createBlogPost, getAllBlogPosts } from "@/server/repositories/blog-repository";
import { validateBlogPostPayload } from "@/lib/validators";
import { requirePermission } from "@/server/auth";
import { translateBlogOnSave, getTranslatedBlogs, getTranslatedBlogUI, COUNTRY_TO_LANG } from "@/server/services/translation-service";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("raw") === "true";

  const posts = await getAllBlogPosts();

  if (raw) {
    return NextResponse.json({ data: posts });
  }

  const countryCode = await resolveRequestCountryCode();
  const lang = COUNTRY_TO_LANG[String(countryCode || "").toUpperCase()] || "en";
  const [translatedPosts, translatedUI] = await Promise.all([
    getTranslatedBlogs(posts, lang),
    getTranslatedBlogUI(lang)
  ]);
  return NextResponse.json({ data: translatedPosts, ui: translatedUI });
}

export async function POST(request) {
  const access = await requirePermission("blog");
  if (access.error) {
    return access.error;
  }

  try {
    const payload = await request.json();
    const validationError = validateBlogPostPayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const post = await createBlogPost(payload);
    await translateBlogOnSave(post).catch((err) =>
      console.error("[POST /api/blog] Auto translation failed:", err)
    );
    return NextResponse.json({ data: post }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to create blog post." }, { status: 400 });
  }
}

