import "server-only";

import { supabase } from "@/lib/supabase";
import { unstable_cache, revalidateTag } from "next/cache";

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapDbBlogPostToJs(dbPost) {
  if (!dbPost) return null;
  return {
    id: dbPost.id,
    title: dbPost.title,
    slug: dbPost.slug,
    excerpt: dbPost.excerpt || "",
    category: dbPost.category || "Latest Data",
    date: dbPost.display_date || "",
    readTime: dbPost.read_time || "",
    author: dbPost.author || "Admin",
    authorRole: dbPost.author_role || "Editor",
    thumbnailType: dbPost.thumbnail_type || "wave",
    content: dbPost.content || "",
    featured: Boolean(dbPost.featured),
    countryCode: dbPost.country_code || "GLOBAL",
    createdAt: dbPost.created_at,
    updatedAt: dbPost.updated_at,
    selectedProductIds: dbPost.selected_product_ids || [],
    selectedCouponIds: dbPost.selected_coupon_ids || [],
  };
}

function serializeBlogPostForDb(input, currentPost) {
  const now = new Date();
  const options = { year: "numeric", month: "short", day: "numeric" };
  const formattedDate = now.toLocaleDateString("en-US", options); // e.g., "Jun 27, 2026"
  const title = String(input.title || "").trim();
  const slug = slugify(input.slug || title);

  // Auto-calculate read time if not provided
  let readTime = String(input.readTime || "").trim();
  if (!readTime) {
    const wordCount = String(input.content || "").split(/\s+/).length;
    const computedMinutes = Math.max(1, Math.ceil(wordCount / 200));
    readTime = `${computedMinutes} min read`;
  }

  const createdAt = currentPost?.createdAt || input.createdAt || now.toISOString();

  return {
    id: currentPost?.id || input.id || `post_${slug}`,
    title,
    slug,
    excerpt: String(input.excerpt || "").trim(),
    content: String(input.content || "").trim(),
    featured_image: null,
    author: String(input.author || "Admin").trim(),
    author_role: String(input.authorRole || "Editor").trim(),
    status: "published",
    meta_title: title,
    meta_description: String(input.excerpt || "").trim(),
    canonical_url: null,
    published_at: createdAt,
    created_at: createdAt,
    updated_at: now.toISOString(),
    category: String(input.category || "Latest Data").trim(),
    display_date: input.date || currentPost?.date || formattedDate,
    read_time: readTime,
    thumbnail_type: String(input.thumbnailType || "wave").trim(),
    featured: Boolean(input.featured),
    country_code: String(input.countryCode || "GLOBAL").trim().toUpperCase(),
    selected_product_ids: input.selectedProductIds || [],
    selected_coupon_ids: input.selectedCouponIds || [],
  };
}

async function fetchAllBlogPosts() {
  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map(mapDbBlogPostToJs);
}

export async function getAllBlogPosts() {
  return unstable_cache(
    async () => fetchAllBlogPosts(),
    ["blog-posts"],
    { revalidate: 1800, tags: ["blog-posts"] }
  )();
}

export async function getBlogPostBySlug(slug) {
  const posts = await getAllBlogPosts();
  return posts.find((post) => post.slug === slug) || null;
}

export async function createBlogPost(payload) {
  const post = serializeBlogPostForDb(payload);

  // Check if slug already exists
  const { data: existing, error: checkError } = await supabase
    .from("blogs")
    .select("id")
    .eq("slug", post.slug)
    .maybeSingle();

  if (checkError) {
    throw checkError;
  }
  if (existing) {
    throw new Error("A blog post with this slug already exists.");
  }

  const { data, error } = await supabase
    .from("blogs")
    .insert(post)
    .select()
    .single();

  if (error) {
    throw error;
  }

  revalidateTag("blog-posts");
  return mapDbBlogPostToJs(data);
}

export async function updateBlogPost(slug, payload) {
  // Fetch current post directly to avoid stale merges
  const { data: currentPost, error: fetchError } = await supabase
    .from("blogs")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }
  if (!currentPost) {
    return null;
  }

  const currentJs = mapDbBlogPostToJs(currentPost);
  const merged = serializeBlogPostForDb({ ...currentJs, ...payload }, currentJs);

  // Check if new slug is taken by another post
  const { data: existing, error: checkError } = await supabase
    .from("blogs")
    .select("id")
    .eq("slug", merged.slug)
    .not("id", "eq", currentPost.id)
    .maybeSingle();

  if (checkError) {
    throw checkError;
  }
  if (existing) {
    throw new Error("Another blog post already uses this slug.");
  }

  const { data, error } = await supabase
    .from("blogs")
    .update(merged)
    .eq("id", currentPost.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  revalidateTag("blog-posts");
  return mapDbBlogPostToJs(data);
}

export async function deleteBlogPost(slug) {
  const { data: existing, error: fetchError } = await supabase
    .from("blogs")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }
  if (!existing) {
    return false;
  }

  const { error } = await supabase
    .from("blogs")
    .delete()
    .eq("id", existing.id);

  if (error) {
    throw error;
  }

  revalidateTag("blog-posts");
  return true;
}
