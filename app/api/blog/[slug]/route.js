import { NextResponse } from "next/server";
import { deleteBlogPost, getBlogPostBySlug, updateBlogPost } from "@/server/repositories/blog-repository";
import { validateBlogPostPayload } from "@/lib/validators";
import { requirePermission } from "@/server/auth";
import { translateBlogOnSave, getTranslatedBlog, getTranslatedBlogUI, COUNTRY_TO_LANG } from "@/server/services/translation-service";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";

export async function GET(_request, { params }) {
  const { slug } = await params;
  const [post, countryCode] = await Promise.all([
    getBlogPostBySlug(slug),
    resolveRequestCountryCode()
  ]);

  if (!post) {
    return NextResponse.json({ error: "Blog post not found." }, { status: 404 });
  }

  const postCountry = String(post.countryCode || "GLOBAL").toUpperCase();
  const currentCountry = String(countryCode || "US").toUpperCase();
  if (postCountry !== "GLOBAL" && postCountry !== currentCountry) {
    return NextResponse.json({ error: "Blog post not found." }, { status: 404 });
  }

  const lang = COUNTRY_TO_LANG[String(countryCode || "").toUpperCase()] || "en";
  const [translatedPost, translatedUI] = await Promise.all([
    getTranslatedBlog(post, lang),
    getTranslatedBlogUI(lang)
  ]);
  return NextResponse.json({ data: translatedPost, ui: translatedUI });
}

export async function PUT(request, { params }) {
  const access = await requirePermission("blog");
  if (access.error) {
    return access.error;
  }

  try {
    const { slug } = await params;
    const payload = await request.json();
    const validationError = validateBlogPostPayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const post = await updateBlogPost(slug, payload);

    if (!post) {
      return NextResponse.json({ error: "Blog post not found." }, { status: 404 });
    }

    await translateBlogOnSave(post).catch((err) =>
      console.error("[PUT /api/blog/[slug]] Auto translation failed:", err)
    );
    return NextResponse.json({ data: post });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to update blog post." }, { status: 400 });
  }
}


export async function DELETE(_request, { params }) {
  const access = await requirePermission("blog");
  if (access.error) {
    return access.error;
  }

  try {
    const { slug } = await params;
    const result = await deleteBlogPost(slug);

    if (!result) {
      return NextResponse.json({ error: "Blog post not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to delete blog post." }, { status: 400 });
  }
}
