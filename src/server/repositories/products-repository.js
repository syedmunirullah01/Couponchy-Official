import "server-only";

import { readCollection, writeCollection } from "@/server/database/json-store";

const FILE_NAME = "products.json";

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizePrice(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeProduct(input) {
  const now = new Date().toISOString();
  const storeSlug = input.storeSlug.trim().toLowerCase();
  const slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.title);

  return {
    id: input.id || `product_${storeSlug}_${Math.random().toString(36).slice(2, 10)}`,
    slug,
    storeSlug,
    storeName: input.storeName.trim(),
    title: input.title.trim(),
    description: input.description?.trim() || "",
    image: input.image?.trim() || "",
    price: normalizePrice(input.price),
    originalPrice: input.originalPrice === "" || input.originalPrice == null ? null : normalizePrice(input.originalPrice),
    ctaLabel: input.ctaLabel?.trim() || "View Product",
    productUrl: `/stores/${input.categorySlug || "store"}/${storeSlug}/products/${slug}`,
    status: input.status?.trim() || "Active",
    createdAt: input.createdAt || now,
    updatedAt: now,
  };
}

export async function getAllProducts() {
  const products = await readCollection(FILE_NAME);
  return [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getProductById(id) {
  const products = await getAllProducts();
  return products.find((product) => product.id === id) ?? null;
}

export async function getProductsByStoreSlug(storeSlug) {
  const products = await getAllProducts();
  return products.filter((product) => product.storeSlug === storeSlug);
}

export async function getProductByStoreAndSlug(storeSlug, slug) {
  const products = await getProductsByStoreSlug(storeSlug);
  return products.find((product) => product.slug === slug) ?? null;
}

export async function createProduct(payload) {
  const products = await getAllProducts();
  const product = normalizeProduct(payload);
  const nextProducts = [product, ...products];
  await writeCollection(FILE_NAME, nextProducts);
  return product;
}

export async function updateProduct(id, payload) {
  const products = await getAllProducts();
  const currentProduct = products.find((product) => product.id === id);

  if (!currentProduct) {
    return null;
  }

  const merged = normalizeProduct({
    ...currentProduct,
    ...payload,
    id: currentProduct.id,
    createdAt: currentProduct.createdAt,
  });

  const nextProducts = products.map((product) => (product.id === id ? merged : product));
  await writeCollection(FILE_NAME, nextProducts);
  return merged;
}

export async function deleteProduct(id) {
  const products = await getAllProducts();
  const nextProducts = products.filter((product) => product.id !== id);

  if (nextProducts.length === products.length) {
    return false;
  }

  await writeCollection(FILE_NAME, nextProducts);
  return true;
}
