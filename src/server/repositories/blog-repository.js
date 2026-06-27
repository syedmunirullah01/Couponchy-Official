import "server-only";

import { readCollection, writeCollection } from "@/server/database/json-store";

const FILE_NAME = "blog.json";

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeBlogPost(input, currentPost) {
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

  return {
    id: currentPost?.id || input.id || `post_${slug}`,
    title,
    slug,
    excerpt: String(input.excerpt || "").trim(),
    category: String(input.category || "Latest Data").trim(),
    date: currentPost?.date || input.date || formattedDate,
    readTime,
    author: String(input.author || "Admin").trim(),
    authorRole: String(input.authorRole || "Editor").trim(),
    thumbnailType: String(input.thumbnailType || "wave").trim(),
    content: String(input.content || "").trim(),
    featured: Boolean(input.featured),
    createdAt: currentPost?.createdAt || input.createdAt || now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export async function getAllBlogPosts() {
  const posts = await readCollection(FILE_NAME, []);
  // Sort posts by date or createdAt descending
  return [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getBlogPostBySlug(slug) {
  const posts = await getAllBlogPosts();
  return posts.find((post) => post.slug === slug) || null;
}

export async function createBlogPost(payload) {
  const posts = await getAllBlogPosts();
  const post = normalizeBlogPost(payload);

  if (posts.some((item) => item.slug === post.slug)) {
    throw new Error("A blog post with this slug already exists.");
  }

  const nextPosts = [...posts, post];
  await writeCollection(FILE_NAME, nextPosts);
  return post;
}

export async function updateBlogPost(slug, payload) {
  const posts = await getAllBlogPosts();
  const currentPost = posts.find((item) => item.slug === slug);

  if (!currentPost) {
    return null;
  }

  const merged = normalizeBlogPost({ ...currentPost, ...payload }, currentPost);

  if (posts.some((item) => item.slug === merged.slug && item.id !== currentPost.id)) {
    throw new Error("Another blog post already uses this slug.");
  }

  const nextPosts = posts.map((item) => (item.id === currentPost.id ? merged : item));
  await writeCollection(FILE_NAME, nextPosts);
  return merged;
}

export async function deleteBlogPost(slug) {
  const posts = await getAllBlogPosts();
  const nextPosts = posts.filter((item) => item.slug !== slug);

  if (nextPosts.length === posts.length) {
    return false;
  }

  await writeCollection(FILE_NAME, nextPosts);
  return true;
}
