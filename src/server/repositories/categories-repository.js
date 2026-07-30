import "server-only";

import { readCollection, writeCollection } from "@/server/database/json-store";
import { getAllStores, syncStoresForCategoryChange } from "@/server/repositories/stores-repository";
import { unstable_cache, revalidateTag } from "next/cache";
import { connectToDatabase } from "@/lib/mongodb";
import Category from "@/server/models/Category";

const FILE_NAME = "categories.json";

function isMongoEnabled() {
  return process.env.USE_MONGODB === "true" || (process.env.USE_MONGODB !== "false" && Boolean(process.env.MONGODB_URI));
}

function mapDbCategoryToJs(doc) {
  if (!doc) return null;
  return {
    id: doc.id || doc._id,
    name: doc.name,
    slug: doc.slug,
    description: doc.description || "",
    createdAt: doc.createdAt || doc.created_at,
    updatedAt: doc.updatedAt || doc.updated_at,
  };
}

function slugifyCategory(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCategory(input, currentCategory) {
  const now = new Date().toISOString();
  const name = input.name.trim();
  const slug = input.slug?.trim() ? slugifyCategory(input.slug) : slugifyCategory(name);

  return {
    id: currentCategory?.id || input.id || `category_${slug}`,
    name,
    slug,
    description: input.description?.trim() || "",
    createdAt: currentCategory?.createdAt || input.createdAt || now,
    updatedAt: now,
  };
}

async function getBootstrapCategoriesFromStores() {
  const stores = await getAllStores();
  const uniqueCategories = new Map();

  stores.forEach((store) => {
    if (!store.category?.trim()) {
      return;
    }

    const slug = store.categorySlug?.trim() || slugifyCategory(store.category);
    if (!uniqueCategories.has(slug)) {
      uniqueCategories.set(slug, {
        id: `category_${slug}`,
        name: store.category.trim(),
        slug,
        description: "",
        createdAt: store.createdAt || new Date().toISOString(),
        updatedAt: store.updatedAt || new Date().toISOString(),
      });
    }
  });

  return [...uniqueCategories.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchAllCategories() {
  if (isMongoEnabled()) {
    await connectToDatabase();
    const docs = await Category.find({}).lean();
    
    if (docs.length > 0) {
      return docs.map(mapDbCategoryToJs).sort((a, b) => a.name.localeCompare(b.name));
    }
    
    const bootstrapped = await getBootstrapCategoriesFromStores();
    if (bootstrapped.length > 0) {
      const ops = bootstrapped.map(c => ({
        updateOne: { filter: { _id: c.id }, update: { $set: { _id: c.id, ...c } }, upsert: true }
      }));
      await Category.bulkWrite(ops);
    }
    return bootstrapped;
  }

  const categories = await readCollection(FILE_NAME, []);

  if (categories.length > 0) {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }

  const bootstrapped = await getBootstrapCategoriesFromStores();

  if (bootstrapped.length > 0) {
    await writeCollection(FILE_NAME, bootstrapped);
  }

  return bootstrapped;
}

export async function getAllCategories() {
  return unstable_cache(
    async () => fetchAllCategories(),
    ["categories"],
    { revalidate: 1800, tags: ["categories"] }
  )();
}

export async function getCategoryBySlug(slug) {
  const categories = await getAllCategories();
  return categories.find((category) => category.slug === slug) ?? null;
}

export async function createCategory(payload) {
  const category = normalizeCategory(payload);

  if (isMongoEnabled()) {
    await connectToDatabase();
    const existing = await Category.findOne({ slug: category.slug }).lean();
    if (existing) {
      throw new Error("A category with this slug already exists.");
    }
    await Category.create({ _id: category.id, ...category });
    revalidateTag("categories");
    return category;
  }

  const categories = await fetchAllCategories();
  if (categories.some((item) => item.slug === category.slug)) {
    throw new Error("A category with this slug already exists.");
  }

  const nextCategories = [...categories, category].sort((a, b) => a.name.localeCompare(b.name));
  await writeCollection(FILE_NAME, nextCategories);
  revalidateTag("categories");
  return category;
}

export async function updateCategory(slug, payload) {
  if (isMongoEnabled()) {
    await connectToDatabase();
    const currentCategory = await Category.findOne({ slug }).lean();
    if (!currentCategory) {
      return null;
    }
    
    const currentJs = mapDbCategoryToJs(currentCategory);
    const merged = normalizeCategory({ ...currentJs, ...payload }, currentJs);

    const existing = await Category.findOne({ slug: merged.slug, _id: { $ne: currentCategory._id } }).lean();
    if (existing) {
      throw new Error("Another category already uses this slug.");
    }

    await Category.updateOne({ _id: currentCategory._id }, { $set: merged });
    revalidateTag("categories");

    if (currentCategory.name !== merged.name || currentCategory.slug !== merged.slug) {
      await syncStoresForCategoryChange({
        previousName: currentCategory.name,
        previousSlug: currentCategory.slug,
        nextName: merged.name,
        nextSlug: merged.slug,
      });
    }

    return merged;
  }

  const categories = await fetchAllCategories();
  const currentCategory = categories.find((item) => item.slug === slug);

  if (!currentCategory) {
    return null;
  }

  const merged = normalizeCategory({ ...currentCategory, ...payload }, currentCategory);

  if (categories.some((item) => item.slug === merged.slug && item.id !== currentCategory.id)) {
    throw new Error("Another category already uses this slug.");
  }

  const nextCategories = categories
    .map((item) => (item.id === currentCategory.id ? merged : item))
    .sort((a, b) => a.name.localeCompare(b.name));

  await writeCollection(FILE_NAME, nextCategories);
  revalidateTag("categories");

  if (currentCategory.name !== merged.name || currentCategory.slug !== merged.slug) {
    await syncStoresForCategoryChange({
      previousName: currentCategory.name,
      previousSlug: currentCategory.slug,
      nextName: merged.name,
      nextSlug: merged.slug,
    });
  }

  return merged;
}

export async function deleteCategory(slug) {
  let category;
  if (isMongoEnabled()) {
    await connectToDatabase();
    category = await Category.findOne({ slug }).lean();
  } else {
    const categories = await fetchAllCategories();
    category = categories.find((item) => item.slug === slug);
  }

  if (!category) {
    return { deleted: false, linkedStores: 0 };
  }

  const stores = await getAllStores();
  const linkedStores = stores.filter((store) => store.categorySlug === slug || store.category === category.name).length;

  if (linkedStores > 0) {
    throw new Error(`Cannot delete category with ${linkedStores} linked store${linkedStores === 1 ? "" : "s"}.`);
  }

  if (isMongoEnabled()) {
    await connectToDatabase();
    await Category.deleteOne({ _id: category._id || category.id });
  } else {
    const categories = await fetchAllCategories();
    const nextCategories = categories.filter((item) => item.id !== category.id);
    await writeCollection(FILE_NAME, nextCategories);
  }
  revalidateTag("categories");

  return { deleted: true, linkedStores: 0 };
}
