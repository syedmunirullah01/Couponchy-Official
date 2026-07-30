import "server-only";

import { readCollection, writeCollection } from "@/server/database/json-store";
import { getStoreBySlug } from "./stores-repository";
import { unstable_cache, revalidateTag } from "next/cache";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/server/models/Product";

const FILE_NAME = "products.json";

function isMongoEnabled() {
  return process.env.USE_MONGODB === "true" || (process.env.USE_MONGODB !== "false" && Boolean(process.env.MONGODB_URI));
}

function mapDbProductToJs(doc) {
  if (!doc) return null;
  return {
    id: doc.id || doc._id,
    slug: doc.slug,
    storeSlug: doc.storeSlug,
    storeName: doc.storeName,
    title: doc.title,
    description: doc.description || "",
    image: doc.image || "",
    price: doc.price || 0,
    originalPrice: doc.originalPrice === "" || doc.originalPrice == null ? null : doc.originalPrice,
    currency: doc.currency || "$",
    ctaLabel: doc.ctaLabel || "View Product",
    productUrl: doc.productUrl || "",
    status: doc.status || "Active",
    createdAt: doc.createdAt || doc.created_at,
    updatedAt: doc.updatedAt || doc.updated_at,
  };
}

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

async function normalizeProduct(input) {
  const now = new Date().toISOString();
  const storeSlug = input.storeSlug.trim().toLowerCase();
  const slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.title);

  let defaultUrl = `/stores/${input.categorySlug || "store"}/${storeSlug}/products/${slug}`;
  if (!input.productUrl?.trim()) {
    try {
      const store = await getStoreBySlug(storeSlug);
      if (store?.affiliateLink) {
        defaultUrl = store.affiliateLink;
      }
    } catch {
      // fallback
    }
  }

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
    currency: input.currency?.trim() || "$",
    ctaLabel: input.ctaLabel?.trim() || "View Product",
    productUrl: input.productUrl?.trim() || defaultUrl,
    status: input.status?.trim() || "Active",
    createdAt: input.createdAt || now,
    updatedAt: now,
  };
}

async function fetchAllProducts() {
  if (isMongoEnabled()) {
    await connectToDatabase();
    const docs = await Product.find({}).lean();
    return docs.map(mapDbProductToJs).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const products = await readCollection(FILE_NAME);
  return [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getAllProducts() {
  return unstable_cache(
    async () => fetchAllProducts(),
    ["products"],
    { revalidate: 1800, tags: ["products"] }
  )();
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
  const product = await normalizeProduct(payload);

  if (isMongoEnabled()) {
    await connectToDatabase();
    await Product.create({ _id: product.id, ...product });
    revalidateTag("products");
    return product;
  }

  const products = await fetchAllProducts();
  const nextProducts = [product, ...products];
  await writeCollection(FILE_NAME, nextProducts);
  revalidateTag("products");
  return product;
}

export async function updateProduct(id, payload) {
  if (isMongoEnabled()) {
    await connectToDatabase();
    const currentProduct = await Product.findOne({ _id: id }).lean();
    if (!currentProduct) {
      return null;
    }
    const currentJs = mapDbProductToJs(currentProduct);
    const merged = await normalizeProduct({
      ...currentJs,
      ...payload,
      id: currentProduct._id,
      createdAt: currentProduct.created_at || currentProduct.createdAt,
    });

    await Product.updateOne({ _id: id }, { $set: merged });
    revalidateTag("products");
    return merged;
  }

  const products = await fetchAllProducts();
  const currentProduct = products.find((product) => product.id === id);

  if (!currentProduct) {
    return null;
  }

  const merged = await normalizeProduct({
    ...currentProduct,
    ...payload,
    id: currentProduct.id,
    createdAt: currentProduct.createdAt,
  });

  const nextProducts = products.map((product) => (product.id === id ? merged : product));
  await writeCollection(FILE_NAME, nextProducts);
  revalidateTag("products");
  return merged;
}

export async function deleteProduct(id) {
  if (isMongoEnabled()) {
    await connectToDatabase();
    const res = await Product.deleteOne({ _id: id });
    if (res.deletedCount === 0) {
      return false;
    }
    revalidateTag("products");
    return true;
  }

  const products = await fetchAllProducts();
  const nextProducts = products.filter((product) => product.id !== id);

  if (nextProducts.length === products.length) {
    return false;
  }

  await writeCollection(FILE_NAME, nextProducts);
  revalidateTag("products");
  return true;
}
