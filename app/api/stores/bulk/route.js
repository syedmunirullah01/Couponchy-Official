import { NextResponse } from "next/server";
import JSZip from "jszip";
import { requirePermission } from "@/server/auth";
import { upsertStoresBulk, getAllStores } from "@/server/repositories/stores-repository";
import { getAllCategories } from "@/server/repositories/categories-repository";
import { getSettings } from "@/server/repositories/settings-repository";
import { uploadImageBuffer } from "@/server/cloudinary";
import { normalizeCountryCode } from "@/lib/countries";
import { revalidatePath } from "next/cache";

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeValue(value) {
  return String(value || "").trim();
}

const ALLOWED_TRUST_STATUSES = new Set(["Verified", "Trusted", "Pending", "Active"]);
const ALLOWED_LOGO_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);

function normalizeZipPath(fileName) {
  return normalizeValue(fileName).replace(/\\/g, "/").split("/").filter(Boolean).join("/").toLowerCase();
}

function getExtension(fileName) {
  const normalized = normalizeZipPath(fileName);
  const index = normalized.lastIndexOf(".");
  return index >= 0 ? normalized.slice(index) : "";
}

export async function POST(request) {
  const access = await requirePermission("stores");
  if (access.error) {
    return access.error;
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let rows = [];
    let logoZipFile = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      rows = JSON.parse(String(formData.get("rows") || "[]"));
      const uploadedZip = formData.get("logosZip");
      logoZipFile = uploadedZip instanceof File ? uploadedZip : null;
    } else {
      const payload = await request.json();
      rows = Array.isArray(payload?.rows) ? payload.rows : [];
    }

    if (!rows.length) {
      return NextResponse.json({ error: "No store rows were provided." }, { status: 400 });
    }

    const zipAssets = new Map();
    if (logoZipFile) {
      const zipBuffer = Buffer.from(await logoZipFile.arrayBuffer());
      const zip = await JSZip.loadAsync(zipBuffer);
      const fileEntries = Object.values(zip.files).filter((file) => !file.dir);

      for (const entry of fileEntries) {
        const normalizedPath = normalizeZipPath(entry.name);
        const fileBuffer = await entry.async("nodebuffer");
        zipAssets.set(normalizedPath, fileBuffer);
        zipAssets.set(normalizedPath.split("/").at(-1), fileBuffer);
      }
    }

    const [existingStores, categories, settings] = await Promise.all([
      getAllStores(),
      getAllCategories(),
      getSettings(),
    ]);
    const existingSlugs = new Set(existingStores.map((store) => store.slug));
    const categoryMap = new Map(categories.map((category) => [normalizeValue(category.name).toLowerCase(), category]));
    const allowedCountryCodes = new Set(
      (settings.general?.countries || []).map((country) => normalizeCountryCode(country.code))
    );
    const existingStoresMap = new Map(existingStores.map((store) => [store.slug, store]));
    const batchSlugs = new Set();
    const errors = [];
    let duplicatesSkipped = 0;
    let matchedLogos = 0;
    let missingLogos = 0;

    const validatedRows = [];
    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2;
      const name = normalizeValue(row.name);
      const category = normalizeValue(row.category) || "General";
      const description = normalizeValue(row.description);
      const trustStatusRaw = normalizeValue(row.trustStatus);
      const logoText = normalizeValue(row.logoText);
      const affiliateLink = normalizeValue(row.affiliateLink);
      const logoFile = normalizeValue(row.logoFile);
      const countryCode = normalizeCountryCode(row.countryCode || row.country);
      const slug = slugify(normalizeValue(row.slug) || name);
      const matchedCategory = categoryMap.get(category.toLowerCase());

      if (!name) {
        errors.push({ rowNumber, reason: "Store name is required." });
        continue;
      }

      if (!slug) {
        errors.push({ rowNumber, reason: "Slug could not be generated." });
        continue;
      }

      if (normalizeValue(row.slug) && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizeValue(row.slug))) {
        errors.push({ rowNumber, reason: "Slug contains illegal characters." });
        continue;
      }

      if (!matchedCategory) {
        errors.push({ rowNumber, reason: "Category must match an existing managed category." });
        continue;
      }

      if (!allowedCountryCodes.has(countryCode)) {
        errors.push({ rowNumber, reason: "Country code is not available in settings." });
        continue;
      }

      if (batchSlugs.has(slug)) {
        duplicatesSkipped += 1;
        continue;
      }

      batchSlugs.add(slug);

      validatedRows.push({
        rowNumber,
        name,
        slug,
        matchedCategory,
        description,
        trustStatusRaw,
        logoText,
        affiliateLink,
        logoFile,
        countryCode,
        row,
      });
    }

    const preparationResults = await Promise.all(
      validatedRows.map(async ({
        name,
        slug,
        matchedCategory,
        description,
        trustStatusRaw,
        logoText,
        affiliateLink,
        logoFile,
        countryCode,
        row,
      }) => {
        const existingStore = existingStoresMap.get(slug);
        let logoImage = existingStore ? existingStore.logoImage || "" : "";
        let logoMatched = false;
        let logoMissing = false;

        if (zipAssets.size) {
          const normalizedLogoPath = logoFile ? normalizeZipPath(logoFile) : "";
          const directMatch = normalizedLogoPath ? (zipAssets.get(normalizedLogoPath) || zipAssets.get(normalizedLogoPath.split("/").at(-1))) : null;
          const fallbackBySlug = [...zipAssets.entries()].find(([filePath]) => {
            const fileName = filePath.split("/").at(-1) || "";
            const baseName = fileName.replace(/\.[^.]+$/, "");
            return baseName === slug && ALLOWED_LOGO_EXTENSIONS.has(getExtension(fileName));
          })?.[1];
          const zipMatch = directMatch || fallbackBySlug;

          if (zipMatch) {
            let ext = ".png";
            if (directMatch) {
              ext = getExtension(logoFile) || ".png";
            } else {
              const matchedPath = [...zipAssets.keys()].find((filePath) => {
                const fileName = filePath.split("/").at(-1) || "";
                const baseName = fileName.replace(/\.[^.]+$/, "");
                return baseName === slug && ALLOWED_LOGO_EXTENSIONS.has(getExtension(fileName));
              });
              if (matchedPath) {
                ext = getExtension(matchedPath) || ".png";
              }
            }
            const cleanExt = ext.startsWith(".") ? ext.slice(1) : ext;
            const mimeType = cleanExt === "svg" ? "image/svg+xml" : `image/${cleanExt}`;

            try {
              const uploadResult = await uploadImageBuffer(zipMatch, {
                folder: "couponchy/stores",
                public_id: `${slug}.${cleanExt}`,
                contentType: mimeType,
                overwrite: true,
                resource_type: "image",
              });
              logoImage = uploadResult.secure_url;
              logoMatched = true;
            } catch (err) {
              console.error(`Failed to upload logo for ${name}:`, err);
              logoMissing = true;
            }
          } else if (logoFile) {
            logoMissing = true;
          }
        }

        const store = {
          name,
          slug,
          category: matchedCategory.name,
          categorySlug: matchedCategory.slug,
          description,
          trustStatus: ALLOWED_TRUST_STATUSES.has(trustStatusRaw) ? trustStatusRaw : "Active",
          countryCode,
          affiliateLink,
          logoText: logoText || name,
          logoImage,
          contentIntroTitle: normalizeValue(row.contentIntroTitle),
          contentIntroParagraph1: normalizeValue(row.contentIntroParagraph1),
          contentIntroParagraph2: normalizeValue(row.contentIntroParagraph2),
          contentWhyItemsText: normalizeValue(row.contentWhyItemsText).replace(/\\n/g, "\n"),
          contentOutro: normalizeValue(row.contentOutro),
          faq1Question: normalizeValue(row.faq1Question),
          faq1Answer: normalizeValue(row.faq1Answer),
          faq2Question: normalizeValue(row.faq2Question),
          faq2Answer: normalizeValue(row.faq2Answer),
          faq3Question: normalizeValue(row.faq3Question),
          faq3Answer: normalizeValue(row.faq3Answer),
          offersCount: existingStore ? existingStore.offersCount || 0 : 0,
          isFeatured: existingStore ? Boolean(existingStore.isFeatured) : false,
        };

        return { store, logoMatched, logoMissing };
      })
    );

    const preparedStores = preparationResults.map((r) => r.store);
    matchedLogos = preparationResults.filter((r) => r.logoMatched).length;
    missingLogos = preparationResults.filter((r) => r.logoMissing).length;

    if (preparedStores.length) {
      await upsertStoresBulk(preparedStores);
      revalidatePath("/", "layout");
    }

    return NextResponse.json(
      {
        data: {
          totalRecords: rows.length,
          successfullyImported: preparedStores.length,
          duplicatesSkipped,
          validationErrors: errors.length,
          matchedLogos,
          missingLogos,
          errors,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to import stores." }, { status: 400 });
  }
}
