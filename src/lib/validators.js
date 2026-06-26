export function validateStorePayload(payload) {
  if (!payload?.name?.trim()) {
    return "Store name is required.";
  }

  if (!payload?.slug?.trim()) {
    return "Store slug is required.";
  }

  if (!payload?.category?.trim()) {
    return "Store category is required.";
  }

  if (!payload?.countryCode?.trim()) {
    return "Store country is required.";
  }

  return null;
}

export function validateCategoryPayload(payload) {
  if (!payload?.name?.trim()) {
    return "Category name is required.";
  }

  if (!payload?.slug?.trim()) {
    return "Category slug is required.";
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug.trim())) {
    return "Category slug must be lowercase and URL-friendly.";
  }

  return null;
}

export function validateOfferPayload(payload) {
  if (!payload?.title?.trim()) {
    return "Offer title is required.";
  }

  if (!payload?.storeSlug?.trim()) {
    return "Offer store slug is required.";
  }

  if (!payload?.storeName?.trim()) {
    return "Offer store name is required.";
  }

  if (!payload?.expiryDate?.trim()) {
    return "Offer expiry date is required.";
  }

  return null;
}

export function validateProductPayload(payload) {
  if (!payload?.title?.trim()) {
    return "Product title is required.";
  }

  if (!payload?.storeSlug?.trim()) {
    return "Product store is required.";
  }

  if (!payload?.storeName?.trim()) {
    return "Product store name is required.";
  }

  if (!payload?.description?.trim()) {
    return "Product description is required.";
  }

  if (!Number.isFinite(Number(payload?.price))) {
    return "Product price is required.";
  }

  return null;
}

export function validateEventPayload(payload) {
  if (!payload?.name?.trim()) {
    return "Event name is required.";
  }

  if (!payload?.slug?.trim()) {
    return "Event slug is required.";
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug.trim())) {
    return "Event slug must be lowercase and URL-friendly.";
  }

  if (!payload?.keyword?.trim()) {
    return "Event keyword is required.";
  }

  return null;
}
