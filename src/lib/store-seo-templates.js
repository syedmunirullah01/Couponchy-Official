/**
 * store-seo-templates.js
 *
 * Deterministic 4-template SEO content generator for Couponchy store pages.
 *
 * Rules:
 * - Same brand/slug always gets the same template (hash-based, not random).
 * - 4 writing styles: Professional, Friendly, Shopping-focused, Savings-focused.
 * - Dynamic variables injected at runtime.
 * - SEO keyword density: primary 0.8–1.2%, secondary 0.3–0.7%.
 * - Content length per section: introTitle + introParagraphs + whyItems + outro ≈ 400–700 words total.
 * - Admin-entered content always takes priority over generated content (handled in catalog-service).
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Deterministic hash of a string → integer (djb2 variant).
 * Returns a non-negative integer.
 */
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash >>> 0);
}

/**
 * Pick template index 0–3 from store slug — always consistent.
 */
function selectTemplateIndex(slug) {
  return hashString(slug || "default") % 4;
}

/**
 * Extract best discount percentage from offers array.
 * Returns a string like "40%" or null.
 */
function getBestDiscount(offers) {
  let best = 0;
  for (const offer of offers) {
    const src = [offer.title, offer.description, offer.code].filter(Boolean).join(" ");
    const matches = [...src.matchAll(/(\d{1,3})\s*%/g)];
    for (const m of matches) {
      const val = Number(m[1]);
      if (val > best) best = val;
    }
  }
  return best > 0 ? `${best}%` : null;
}

/**
 * Count verified (non-expired) coupons.
 */
function countVerifiedCoupons(offers) {
  return offers.filter(
    (o) => o.type === "Coupon" && o.status?.toLowerCase() !== "expired"
  ).length;
}

/**
 * Build the full set of dynamic variables from store + offers.
 */
function buildVars(store, offers) {
  const now = new Date();
  const couponCount = offers.filter((o) => o.type === "Coupon").length;
  const dealCount = offers.filter((o) => o.type === "Deal").length;
  const verifiedCoupons = countVerifiedCoupons(offers);
  const bestDiscount = getBestDiscount(offers);
  const totalOffers = offers.length;

  return {
    brand: store.name || "this store",
    slug: store.slug || "",
    currentMonth: now.toLocaleString("en-US", { month: "long" }),
    currentYear: String(now.getFullYear()),
    couponCount: String(couponCount),
    dealCount: String(dealCount),
    totalOffers: String(totalOffers),
    verifiedCoupons: String(verifiedCoupons),
    bestDiscount: bestDiscount || "great",
    storeCategory: store.category || store.categorySlug || "shopping",
    website: store.website || store.affiliateLink || `${(store.name || "store").toLowerCase().replace(/\s+/g, "")}.com`,
  };
}

/**
 * Replace {variable} placeholders in a string.
 */
function fill(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

/**
 * Apply fill to every item in an array.
 */
function fillAll(arr, vars) {
  return arr.map((item) => fill(item, vars));
}

// ---------------------------------------------------------------------------
// 4 Content Templates
// ---------------------------------------------------------------------------

const TEMPLATES = [
  // ─── Template 1: Professional ────────────────────────────────────────────
  {
    style: "Professional",
    introTitle: (vars) =>
      `{brand} Coupons & Promo Codes — {currentMonth} {currentYear}`,

    introParagraphs: [
      `{brand} is a reputable {storeCategory} destination trusted by millions of shoppers. As of {currentMonth} {currentYear}, Couponchy maintains a curated collection of {totalOffers} active {brand} offers — including {couponCount} verified coupon codes and {dealCount} exclusive deals — fully reviewed for accuracy and reliability before being listed.`,

      `Each {brand} coupon code and promo code listed on Couponchy undergoes a manual verification process to confirm it is functional and delivers the advertised discount. Our editorial team cross-references {brand} promotions directly against the merchant's active campaigns, so shoppers can apply any {brand} discount code with confidence during checkout.`,

      `Whether you are browsing for a percentage-based {brand} discount, a seasonal sale, or free shipping vouchers, our listings are organized clearly so you can identify the most valuable savings opportunity in seconds. {brand} frequently runs limited-time promotions — bookmarking this page ensures you never miss an active offer.`,
    ],

    whyItems: [
      `All {brand} promo codes are manually tested and verified before listing`,
      `Largest consolidated source of active {brand} coupons and deals`,
      `Instant access to {brand} free shipping offers and clearance vouchers`,
      `New {brand} discount codes added as soon as new promotions launch`,
      `No registration required — simply copy your {brand} coupon code and save`,
    ],

    outro: `Couponchy's commitment to accuracy makes it the most dependable source for {brand} coupon codes in {currentYear}. Verify your chosen {brand} promo code is active before checkout to guarantee your discount is applied correctly.`,

    faqs: [
      {
        question: `How many {brand} coupon codes are available right now?`,
        answer: `Couponchy currently lists {couponCount} active {brand} coupon codes and {dealCount} deals as of {currentMonth} {currentYear}. All listings are regularly reviewed and updated to remove expired codes.`,
      },
      {
        question: `Are the {brand} promo codes on Couponchy verified?`,
        answer: `Yes. Every {brand} promo code listed on Couponchy is manually verified by our team before publishing. Verified codes are marked clearly so you know exactly which {brand} discount codes are confirmed active.`,
      },
      {
        question: `Does {brand} offer free shipping?`,
        answer: `{brand} periodically offers free shipping promotions. Check the Deals section on this page for any active {brand} free shipping vouchers or threshold-based delivery discounts available for {currentMonth} {currentYear}.`,
      },
      {
        question: `How do I use a {brand} coupon code?`,
        answer: `Click "Reveal Code" next to any {brand} coupon code on this page. The code copies to your clipboard automatically and the {brand} website opens in a new tab. Paste the code in the promo code box at checkout to apply your discount.`,
      },
      {
        question: `How often does Couponchy update {brand} offers?`,
        answer: `{brand} offers are reviewed and updated continuously. Our catalog is synchronized with the latest {brand} promotions so that expired deals are removed and new {brand} coupons are added in real time.`,
      },
    ],
  },

  // ─── Template 2: Friendly ────────────────────────────────────────────────
  {
    style: "Friendly",
    introTitle: (vars) =>
      `Save More at {brand} — {couponCount} Coupons for {currentMonth} {currentYear}`,

    introParagraphs: [
      `Looking to save at {brand}? You're in the right place! Couponchy has rounded up {totalOffers} of the best {brand} offers available right now — {couponCount} coupon codes plus {dealCount} hand-picked deals — so you can grab what you love without paying full price.`,

      `We know how frustrating it is to paste a coupon code at checkout and find it's already expired. That's exactly why every single {brand} promo code you see here has been checked and verified by our team. No dead codes, no guessing — just real {brand} savings ready for you to use today.`,

      `Shopping at {brand} is even better when you know where to look for discounts. From seasonal sales to surprise flash deals and free shipping vouchers, we keep tabs on all {brand} promotions throughout {currentYear} so you always walk away with the best possible price on your purchase.`,
    ],

    whyItems: [
      `{brand} coupons are tested before being listed — no expired codes!`,
      `Updated throughout {currentYear} whenever {brand} launches new promotions`,
      `Easy one-click copy for every {brand} discount code`,
      `Find {brand} deals, sales, and free shipping offers all in one place`,
      `Totally free — no account or signup needed to grab {brand} vouchers`,
    ],

    outro: `Happy saving at {brand}! Be sure to check back often — we add new {brand} coupon codes and deals as soon as they go live. If a code doesn't work, let us know and we'll get it sorted right away.`,

    faqs: [
      {
        question: `What's the best {brand} coupon available right now?`,
        answer: `We're currently listing {couponCount} {brand} coupon codes and {dealCount} deals on Couponchy. For the biggest savings, look for offers tagged "Verified" or check the top-listed {brand} promo code — it's usually the highest-value discount available this month.`,
      },
      {
        question: `Do I need an account to use {brand} promo codes from Couponchy?`,
        answer: `Nope! Everything on Couponchy is completely free and no account is required. Just click "Reveal Code" on any {brand} coupon, copy it, and paste it at checkout on the {brand} website.`,
      },
      {
        question: `Why isn't my {brand} coupon code working?`,
        answer: `A few things to check: make sure the code hasn't expired, that your cart meets any minimum order requirement, and that the items in your cart qualify for the discount. If a valid {brand} code still isn't working, try another one from our list or use a {brand} deal link instead.`,
      },
      {
        question: `Does {brand} offer student or new customer discounts?`,
        answer: `{brand} occasionally runs special promotions for new customers and students. Keep an eye on the Deals section of this page — we list all {brand} special offer vouchers as soon as they become available.`,
      },
      {
        question: `How quickly are new {brand} deals added to Couponchy?`,
        answer: `Our team adds new {brand} coupons and deals as soon as they go live. Checking back regularly — especially during sale seasons — is the best way to catch the freshest {brand} promo codes before they expire.`,
      },
    ],
  },

  // ─── Template 3: Shopping-focused ────────────────────────────────────────
  {
    style: "Shopping-focused",
    introTitle: (vars) =>
      `{brand} Deals, Sales & Promo Codes — {currentMonth} {currentYear}`,

    introParagraphs: [
      `{brand} is one of the top {storeCategory} destinations you can shop smarter at — especially when you pair your purchase with the right coupon code or deal. This month, Couponchy has {totalOffers} live {brand} offers: {couponCount} coupon codes and {dealCount} direct deals, giving you multiple routes to a lower checkout total.`,

      `The smartest way to shop at {brand} is to check here first. Before you add anything to your cart, browse the verified {brand} promo codes on this page. Stack a percentage-off coupon code with a {brand} clearance sale item and you could be looking at serious savings on your total order value.`,

      `{brand} runs promotions throughout the year — seasonal sale events, category-specific discounts, and occasional site-wide {brand} vouchers that apply to nearly everything in their catalogue. We track all of them so your {currentMonth} shopping trips to {brand} are as affordable as possible.`,
    ],

    whyItems: [
      `Shop {brand} with confidence using only verified discount codes`,
      `Find {brand} category sales, flash deals, and clearance vouchers`,
      `Stack {brand} coupon codes with ongoing sale prices for maximum savings`,
      `Track {brand} seasonal promotions — Black Friday, holiday sales, and more`,
      `All {brand} promo codes are organized by discount type for easy browsing`,
    ],

    outro: `Make {brand} your go-to {storeCategory} destination and let Couponchy handle the deal-hunting. Bookmark this page and return before every {brand} shopping trip to make sure you're always using the best available {brand} promo code or deal.`,

    faqs: [
      {
        question: `What types of {brand} discounts are available on Couponchy?`,
        answer: `Couponchy lists {couponCount} {brand} coupon codes (percentage off, flat amount discounts, and free shipping) as well as {dealCount} direct deal links. Deal links take you straight to a discounted {brand} product without needing a code.`,
      },
      {
        question: `Can I find {brand} free shipping codes here?`,
        answer: `Yes. We include {brand} free shipping promo codes and vouchers whenever they're available. These are listed alongside regular {brand} coupon codes and are clearly labelled so they're easy to spot.`,
      },
      {
        question: `Does {brand} have a sale section?`,
        answer: `{brand} regularly updates its sale section with discounted products across categories. Check the Deals tab on this page for direct links to active {brand} sale pages, so you can shop discounts without needing a separate coupon code.`,
      },
      {
        question: `How do I find the biggest {brand} discount available?`,
        answer: `The highest-value {brand} coupon code is usually listed at the top of this page. You can also browse through all {couponCount} {brand} coupons to compare discounts and pick the one that applies best to your order.`,
      },
      {
        question: `Is it safe to shop at {brand} using links from Couponchy?`,
        answer: `Absolutely. All {brand} affiliate links on Couponchy go directly to the official {brand} website. You shop on {brand}'s own secure platform — Couponchy simply connects you to the best available discount first.`,
      },
    ],
  },

  // ─── Template 4: Savings-focused ─────────────────────────────────────────
  {
    style: "Savings-focused",
    introTitle: (vars) =>
      `{brand} Coupon Codes: Up to {bestDiscount} Off in {currentYear}`,

    introParagraphs: [
      `Maximizing your savings at {brand} starts here. Couponchy brings you {couponCount} active {brand} coupon codes and {dealCount} verified deals for {currentMonth} {currentYear} — all confirmed working so every discount code you copy is ready to use immediately at checkout.`,

      `The key to unlocking the best {brand} savings is knowing which {brand} promo codes are actually valid and which discounts apply to your purchase. Our verified listings cut through the noise: every {brand} coupon code on this page has been checked, so you spend less time searching and more time saving on your order.`,

      `From {bestDiscount} off coupon codes to free shipping vouchers and exclusive {brand} deal links, Couponchy aggregates every available {brand} discount in one place. Whether you're a first-time buyer or a returning {brand} customer, applying a promo code before checkout is the simplest way to reduce your spending without sacrificing quality.`,
    ],

    whyItems: [
      `Verified {brand} coupons that actually work — tested before listing`,
      `Track the best {brand} discount code available each month`,
      `Access exclusive {brand} vouchers not widely advertised elsewhere`,
      `Save on {brand} shipping with regularly updated free delivery codes`,
      `Reduce your {brand} checkout total instantly — no membership required`,
    ],

    outro: `Every rupee saved with a {brand} coupon code adds up. Couponchy makes sure you never overpay at {brand} by keeping its verified discount listings current throughout {currentYear}. Return before every order to claim the highest available {brand} promo code.`,

    faqs: [
      {
        question: `How much can I save with {brand} coupons on Couponchy?`,
        answer: `The savings vary by offer. Currently, the best available {brand} coupon code offers up to {bestDiscount} off. Browse all {couponCount} listed {brand} coupon codes to find the one that gives you the highest discount on your specific order.`,
      },
      {
        question: `Are there any exclusive {brand} promo codes on Couponchy?`,
        answer: `Couponchy works to source and verify the widest range of {brand} discount codes available, including exclusive promotions not always listed elsewhere. All verified {brand} promo codes are available for free — no membership or registration required.`,
      },
      {
        question: `What is the average discount offered by {brand} coupon codes?`,
        answer: `{brand} coupon codes on Couponchy currently range from standard percentage discounts to free shipping vouchers. The highest confirmed {brand} discount available this month is {bestDiscount} off. Check the top of the list for the most valuable active codes.`,
      },
      {
        question: `Can I combine multiple {brand} coupons in one order?`,
        answer: `Most retailers, including {brand}, allow only one coupon code per order. However, you can still maximize savings by choosing the highest-value {brand} coupon code from our list and applying it to a cart that already includes sale-priced items.`,
      },
      {
        question: `Where do I enter a {brand} coupon code at checkout?`,
        answer: `After adding your items to the {brand} cart, proceed to checkout. Look for a field labelled "Promo Code", "Coupon Code", or "Discount Code" on the payment page, paste your copied {brand} code there, and click Apply to see your savings reflected in the order total.`,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate SEO content for a store page.
 *
 * @param {object} store  - Store record from the database.
 * @param {Array}  offers - Offers array for this store.
 * @returns {{ introTitle, introParagraphs, whyItems, outro, faqs }}
 */
export function generateStoreContent(store, offers) {
  const idx = selectTemplateIndex(store.slug || store.name || "");
  const template = TEMPLATES[idx];
  const vars = buildVars(store, offers);

  const introTitle = fill(
    typeof template.introTitle === "function"
      ? template.introTitle(vars)
      : template.introTitle,
    vars
  );

  const introParagraphs = fillAll(template.introParagraphs, vars);
  const whyItems = fillAll(template.whyItems, vars);
  const outro = fill(template.outro, vars);
  const faqs = template.faqs.map((faq) => ({
    question: fill(faq.question, vars),
    answer: fill(faq.answer, vars),
  }));

  return { introTitle, introParagraphs, whyItems, outro, faqs };
}

/**
 * Return the template style name for a given store slug (for debugging).
 * e.g. "Professional", "Friendly", "Shopping-focused", "Savings-focused"
 */
export function getTemplateStyleForSlug(slug) {
  return TEMPLATES[selectTemplateIndex(slug)].style;
}
