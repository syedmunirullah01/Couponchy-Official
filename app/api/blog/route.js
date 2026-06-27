import { NextResponse } from "next/server";
import { createBlogPost, getAllBlogPosts } from "@/server/repositories/blog-repository";
import { validateBlogPostPayload } from "@/lib/validators";
import { requirePermission } from "@/server/auth";

export async function GET() {
  const posts = await getAllBlogPosts();
  return NextResponse.json({ data: posts });
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
    return NextResponse.json({ data: post }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to create blog post." }, { status: 400 });
  }
}
