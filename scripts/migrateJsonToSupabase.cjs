const dns = require('dns');
const fs = require('fs');
const path = require('path');

// Fix DNS SRV resolution on Windows
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
let envConfig = {};
try {
  envConfig = fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .reduce((acc, line) => {
      const match = line.match(/^([^=\s]+)=(.*)$/);
      if (match) acc[match[1].trim()] = match[2].trim();
      return acc;
    }, {});
} catch (e) {
  console.warn('Could not read .env.local file. Proceeding with system environment variables.');
}

process.env = { ...process.env, ...envConfig };

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function serializeStoreForDb(store) {
  const now = new Date().toISOString();
  const slug = store.slug.trim().toLowerCase();
  const category = store.category.trim();
  const category_slug =
    store.categorySlug?.trim().toLowerCase() ||
    category
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  return {
    id: store.id || `store_${slug}`,
    name: store.name.trim(),
    slug,
    category,
    category_slug,
    country_code: store.countryCode || "US",
    logo_image: store.logoImage?.trim() || "",
    logo_text: store.logoText?.trim() || store.name.trim(),
    affiliate_link: store.affiliateLink?.trim() || "",
    logo_class_name:
      store.logoClassName?.trim() ||
      "border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text)] text-[12px] font-black",
    description: store.description?.trim() || `${store.name.trim()} deals and coupons updated by Couponchy.`,
    content_intro_title: store.contentIntroTitle?.trim() || "",
    content_intro_paragraph_1: store.contentIntroParagraph1?.trim() || "",
    content_intro_paragraph_2: store.contentIntroParagraph2?.trim() || "",
    content_why_items_text: store.contentWhyItemsText?.trim() || "",
    content_outro: store.contentOutro?.trim() || "",
    faq_1_question: store.faq1Question?.trim() || "",
    faq_1_answer: store.faq1Answer?.trim() || "",
    faq_2_question: store.faq2Question?.trim() || "",
    faq_2_answer: store.faq2Answer?.trim() || "",
    faq_3_question: store.faq3Question?.trim() || "",
    faq_3_answer: store.faq3Answer?.trim() || "",
    trust_status: store.trustStatus?.trim() || "Active",
    is_featured: Boolean(store.isFeatured),
    hero_image:
      store.heroImage?.trim() ||
      "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80",
    rating: store.rating?.trim() || "4.7 (0 reviews)",
    offers_count: Number(store.offersCount ?? 0),
    created_at: store.createdAt || now,
    updated_at: now,
  };
}

function serializeOfferForDb(offer) {
  const now = new Date().toISOString();
  const storeSlug = offer.storeSlug.trim().toLowerCase();

  return {
    id: offer.id || `offer_${storeSlug}_${Math.random().toString(36).slice(2, 10)}`,
    title: offer.title.trim(),
    description: offer.description?.trim() || "Fresh offer imported into Couponchy.",
    type: offer.type?.trim() || "Coupon",
    store_slug: storeSlug,
    store_name: offer.storeName.trim(),
    source: offer.source?.trim() || "Manual",
    expiry_date: offer.expiryDate,
    status: offer.status?.trim() || "Active",
    code: offer.code?.trim() || "",
    affiliate_link: offer.affiliateLink?.trim() || "",
    cta_label: offer.ctaLabel?.trim() || (offer.type === "Deal" ? "Get Deal" : "Get Code"),
    created_at: offer.createdAt || now,
    updated_at: now,
  };
}

async function runMigration() {
  console.log('Starting data migration to Supabase...');

  // 1. Migrate Stores
  const storesPath = path.resolve(__dirname, '../data/database/stores.json');
  let stores = [];
  try {
    if (fs.existsSync(storesPath)) {
      stores = JSON.parse(fs.readFileSync(storesPath, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading stores.json:', e.message);
  }

  if (stores.length > 0) {
    console.log(`Found ${stores.length} stores in stores.json. Preparing to upload...`);
    const serializedStores = stores.map(serializeStoreForDb);

    const { error: storeError } = await supabase
      .from('stores')
      .upsert(serializedStores, { onConflict: 'slug' });

    if (storeError) {
      console.error('Failed to migrate stores:', storeError.message);
    } else {
      console.log('Stores migrated successfully!');
    }
  } else {
    console.log('No stores to migrate.');
  }

  // 2. Migrate Offers
  const offersPath = path.resolve(__dirname, '../data/database/offers.json');
  let offers = [];
  try {
    if (fs.existsSync(offersPath)) {
      offers = JSON.parse(fs.readFileSync(offersPath, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading offers.json:', e.message);
  }

  if (offers.length > 0) {
    console.log(`Found ${offers.length} offers in offers.json. Preparing to upload...`);
    const serializedOffers = offers.map(serializeOfferForDb);

    const { error: offerError } = await supabase
      .from('offers')
      .upsert(serializedOffers, { onConflict: 'id' });

    if (offerError) {
      console.error('Failed to migrate offers:', offerError.message);
    } else {
      console.log('Offers migrated successfully!');
    }
  } else {
    console.log('No offers to migrate.');
  }

  console.log('Data migration process completed.');
  process.exit(0);
}

runMigration();
