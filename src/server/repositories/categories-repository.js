import "server-only";

import { readCollection, writeCollection } from "@/server/database/json-store";
import { getAllStores, syncStoresForCategoryChange } from "@/server/repositories/stores-repository";

const FILE_NAME = "categories.json";

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

export async function getAllCategories() {
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

export async function getCategoryBySlug(slug) {
  const categories = await getAllCategories();
  return categories.find((category) => category.slug === slug) ?? null;
}

export async function createCategory(payload) {
  const categories = await getAllCategories();
  const category = normalizeCategory(payload);

  if (categories.some((item) => item.slug === category.slug)) {
    throw new Error("A category with this slug already exists.");
  }

  const nextCategories = [...categories, category].sort((a, b) => a.name.localeCompare(b.name));
  await writeCollection(FILE_NAME, nextCategories);
  return category;
}

export async function updateCategory(slug, payload) {
  const categories = await getAllCategories();
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
  const categories = await getAllCategories();
  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    return { deleted: false, linkedStores: 0 };
  }

  const stores = await getAllStores();
  const linkedStores = stores.filter((store) => store.categorySlug === slug || store.category === category.name).length;

  if (linkedStores > 0) {
    throw new Error(`Cannot delete category with ${linkedStores} linked store${linkedStores === 1 ? "" : "s"}.`);
  }

  const nextCategories = categories.filter((item) => item.id !== category.id);
  await writeCollection(FILE_NAME, nextCategories);

  return { deleted: true, linkedStores: 0 };
}
