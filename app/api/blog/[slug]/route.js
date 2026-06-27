import { NextResponse } from "next/server";
import { deleteBlogPost, getBlogPostBySlug, updateBlogPost } from "@/server/repositories/blog-repository";
import { validateBlogPostPayload } from "@/lib/validators";
import { requirePermission } from "@/server/auth";

export async function GET(_request, { params }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return NextResponse.json({ error: "Blog post not found." }, { status: 404 });
  }

  return NextResponse.json({ data: post });
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
