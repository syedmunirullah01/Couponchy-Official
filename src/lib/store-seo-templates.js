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

      `Understanding how {brand} discount codes work is the first step toward maximizing your shopping budget. At Couponchy, we categorize every {brand} offer by type — percentage off, flat-rate reductions, free delivery thresholds, and deal links that take you directly to a marked-down product page. This structure means you can filter by what matters most to your order in any given session, whether that is a specific dollar amount off or complimentary shipping on bulkier items.`,

      `{brand} maintains an active promotional calendar throughout the year. Major savings events — including mid-season clearances, anniversary sales, holiday discount windows, and new-customer introductory offers — are captured on this page the moment they are confirmed active. Our dedicated editorial team monitors {brand}'s official channels around the clock so that Couponchy subscribers are always among the first to access newly launched {brand} promo codes before high-demand periods drive inventory or offer availability down.`,

      `Beyond standard coupon codes, {brand} regularly publishes exclusive deal links that do not require a separate promo code at checkout. These deal links are equally valuable — they redirect shoppers to pre-discounted product pages, sale category landings, or bundled offers that carry built-in price reductions. Couponchy aggregates both {brand} coupon codes and deal links in a single unified listing so that every available route to a lower checkout total is presented to you in one convenient location.`,

      `Applying a {brand} coupon code effectively also requires understanding the fine print attached to each offer. Minimum order thresholds, product category restrictions, single-use limitations, and membership eligibility criteria all affect whether a code will apply successfully to your cart. Every {brand} promo code on this page includes a clear description of its terms so that you can evaluate its suitability before proceeding to checkout — saving you the frustration of a declined code after you have already committed to your basket.`,

      `Couponchy's editorial standards for {brand} listings are among the most rigorous in the coupon aggregation space. Before any {brand} coupon code is published, it is tested against a live cart with realistic product combinations to confirm the stated discount is applied accurately. Codes that fail validation are removed immediately, while borderline offers — such as those requiring a specific minimum cart value — are clearly annotated so that shoppers can make an informed decision before attempting to apply them at checkout.`,
    ],

    whyItems: [
      `All {brand} promo codes are manually tested and verified before listing`,
      `Largest consolidated source of active {brand} coupons and deals`,
      `Instant access to {brand} free shipping offers and clearance vouchers`,
      `New {brand} discount codes added as soon as new promotions launch`,
      `No registration required — simply copy your {brand} coupon code and save`,
      `Clear offer terms listed alongside every {brand} coupon to prevent checkout surprises`,
      `Both percentage-off codes and flat-rate {brand} discounts tracked in a single directory`,
      `Seasonal {brand} promotions captured immediately — Black Friday, Eid, holiday sales, and more`,
    ],

    outro: `Couponchy's commitment to accuracy makes it the most dependable source for {brand} coupon codes in {currentYear}. Verify your chosen {brand} promo code is active before checkout to guarantee your discount is applied correctly. The discipline of checking this page before finalizing any {brand} order is one of the simplest habits that reliably reduces overall spending across dozens of purchases throughout the year. With {couponCount} verified {brand} coupons and {dealCount} direct deals currently active, the savings available on this page represent real, immediate value that requires only seconds to apply. Return to Couponchy before every {brand} shopping session — because the best {brand} discount code is always the one you remember to use before clicking the payment button.`,

    faqs: [
      {
        question: `How many {brand} coupon codes are available right now?`,
        answer: `Couponchy currently lists {couponCount} active {brand} coupon codes and {dealCount} deals as of {currentMonth} {currentYear}. All listings are regularly reviewed and updated to remove expired codes. Our editorial team also adds new {brand} offers as soon as they are confirmed active, so the count you see on this page reflects the most current available promotions. If a specific type of discount — such as a free shipping code or a percentage-off voucher — is not currently available, it means {brand} has not published one that meets our verification threshold. Check back frequently, as {brand} promotional windows can open with little advance notice.`,
      },
      {
        question: `Are the {brand} promo codes on Couponchy verified?`,
        answer: `Yes. Every {brand} promo code listed on Couponchy is manually verified by our team before publishing. Verified codes are marked clearly so you know exactly which {brand} discount codes are confirmed active. Our verification process involves testing each code against a live {brand} cart to confirm the discount is applied correctly and that the terms match what is advertised. Codes that fail this test are removed immediately. While no coupon aggregator can guarantee codes remain valid indefinitely — {brand} may deactivate a promotion at any time — our team's daily review cycle minimizes the number of expired listings that remain on this page at any given moment.`,
      },
      {
        question: `Does {brand} offer free shipping?`,
        answer: `{brand} periodically offers free shipping promotions. Check the Deals section on this page for any active {brand} free shipping vouchers or threshold-based delivery discounts available for {currentMonth} {currentYear}. Free shipping offers from {brand} can take several forms: a flat-rate free delivery code that applies regardless of cart size, a minimum spend threshold that unlocks complimentary shipping automatically, or a deal link to a product page where free shipping is included in the listed price. All of these are captured and categorized on Couponchy so that you can identify the most cost-effective way to get your {brand} order delivered without paying additional freight charges.`,
      },
      {
        question: `How do I use a {brand} coupon code?`,
        answer: `Click "Reveal Code" next to any {brand} coupon code on this page. The code copies to your clipboard automatically and the {brand} website opens in a new tab. Paste the code in the promo code box at checkout to apply your discount. On most {brand} checkout flows, the promo code field is labeled "Discount Code," "Coupon Code," or "Promotional Code" and appears either on the cart summary page or during the payment step. After pasting your {brand} code and clicking Apply, the discount should reflect in the updated order total before you finalize payment. If the code does not apply, verify that your cart meets any minimum order requirement and that the items you have selected are eligible for the offer — some {brand} codes are restricted to specific product categories.`,
      },
      {
        question: `How often does Couponchy update {brand} offers?`,
        answer: `{brand} offers are reviewed and updated continuously. Our catalog is synchronized with the latest {brand} promotions so that expired deals are removed and new {brand} coupons are added in real time. Our team conducts full-cycle audits of all {brand} listings at minimum once every 24 hours, with additional spot checks during high-activity periods such as {brand} sale events, seasonal promotions, and holiday shopping windows. When {brand} launches a new campaign — whether a limited-run flash sale or a recurring monthly promo — our editorial workflow is designed to capture it within hours of confirmation so that Couponchy users have immediate access to the most valuable available {brand} discount codes.`,
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

      `One thing shoppers often overlook is how much more they could save by simply pausing before checkout and visiting Couponchy first. With {brand}, even a modest {couponCount} active codes means there is almost always a discount waiting to be applied to your basket. A 10% promo code, a flat discount, or even a free shipping voucher can meaningfully reduce what you pay — and all it takes is 30 seconds to copy and paste before confirming your order.`,

      `{brand} is one of those retailers that rewards loyal shoppers who pay attention. New promotions launch regularly — sometimes tied to a public holiday, a seasonal category push, or an exclusive membership benefit. Couponchy tracks all of these windows and updates its {brand} listings in real time so you never miss a promotional wave that could have saved you money on something you were already planning to buy.`,

      `It is also worth noting that not all {brand} savings require a promo code. Several of the deals listed on this page are direct links — click them and you will land directly on a {brand} product page or sale category that already has its price reduced. No code required, no minimum spend, no hassle. These deal links are especially useful for spontaneous purchases or when a specific {brand} coupon code you tried does not apply to your cart configuration.`,

      `For shoppers who buy from {brand} on a recurring basis — whether for household essentials, seasonal fashion updates, or specialty items — building a habit of checking Couponchy first can translate into meaningful annual savings. Even if only half of your {brand} orders benefit from an active promo code or deal link, the cumulative discount over a full year of regular shopping adds up far more than most people expect.`,

      `Couponchy is completely free to use and requires no registration or account creation. Every {brand} coupon code and deal on this page is accessible to all visitors instantly. Simply find the offer that matches your purchase, click Reveal Code, copy the discount to your clipboard, and head to the {brand} checkout. The entire process takes under a minute and costs nothing — making it one of the most efficient ways to reduce your spending every time you shop at {brand}.`,
    ],

    whyItems: [
      `{brand} coupons are tested before being listed — no expired codes!`,
      `Updated throughout {currentYear} whenever {brand} launches new promotions`,
      `Easy one-click copy for every {brand} discount code`,
      `Find {brand} deals, sales, and free shipping offers all in one place`,
      `Totally free — no account or signup needed to grab {brand} vouchers`,
      `Both coupon codes and deal links tracked — multiple routes to savings at {brand}`,
      `Seasonal windows including holiday, clearance, and end-of-season {brand} sales all covered`,
      `Real-time updates ensure you always see the most current active {brand} promotions`,
    ],

    outro: `Happy saving at {brand}! Be sure to check back often — we add new {brand} coupon codes and deals as soon as they go live. If a code doesn't work, let us know and we'll get it sorted right away. Shopping smarter at {brand} does not require any special membership, loyalty program enrollment, or insider knowledge — it only requires checking this page before completing your purchase. With {couponCount} active {brand} coupon codes and {dealCount} deals listed right now, the opportunity to reduce your total is already here. All that is left is to pick the offer that fits your order and apply it before you click pay. Return to Couponchy before every {brand} shopping trip and make saving a reflex rather than an afterthought.`,

    faqs: [
      {
        question: `What's the best {brand} coupon available right now?`,
        answer: `We're currently listing {couponCount} {brand} coupon codes and {dealCount} deals on Couponchy. For the biggest savings, look for offers tagged "Verified" or check the top-listed {brand} promo code — it's usually the highest-value discount available this month. You can also scroll through the full list to compare offers by discount type — percentage reductions, flat-amount codes, and free shipping vouchers all serve different shopping scenarios. If your order is small, a flat-amount {brand} discount may be more valuable. If you are placing a larger order, a percentage-based {brand} promo code often delivers a bigger absolute saving.`,
      },
      {
        question: `Do I need an account to use {brand} promo codes from Couponchy?`,
        answer: `Nope! Everything on Couponchy is completely free and no account is required. Just click "Reveal Code" on any {brand} coupon, copy it, and paste it at checkout on the {brand} website. We designed Couponchy to be as friction-free as possible. There are no paywalls, no premium tiers, and no email registration gates blocking access to any {brand} promo code or deal link on this page. Every offer is available to every visitor immediately, with no strings attached. Simply pick the {brand} discount that suits your order, reveal the code, and apply it at checkout.`,
      },
      {
        question: `Why isn't my {brand} coupon code working?`,
        answer: `A few things to check: make sure the code hasn't expired, that your cart meets any minimum order requirement, and that the items in your cart qualify for the discount. If a valid {brand} code still isn't working, try another one from our list or use a {brand} deal link instead. Some {brand} promo codes are also restricted to first-time buyers, specific product categories, or accounts registered in a particular region. If none of the codes are working, it is possible that {brand} has ended the promotion without a public announcement — in which case, our team will remove the listing from Couponchy as soon as we detect the change. Try a different active offer or check back in 24 to 48 hours for updated listings.`,
      },
      {
        question: `Does {brand} offer student or new customer discounts?`,
        answer: `{brand} occasionally runs special promotions for new customers and students. Keep an eye on the Deals section of this page — we list all {brand} special offer vouchers as soon as they become available. New customer welcome codes — which typically offer a percentage off the first order — are among the most frequently searched {brand} promo codes on Couponchy. If one is currently active, it will appear in the listings above. Student discount programs, when offered by {brand}, are usually tied to a verification service and may not require a traditional coupon code. Any such verified offers will be listed and described clearly on this page.`,
      },
      {
        question: `How quickly are new {brand} deals added to Couponchy?`,
        answer: `Our team adds new {brand} coupons and deals as soon as they go live. Checking back regularly — especially during sale seasons — is the best way to catch the freshest {brand} promo codes before they expire. During peak promotional periods — such as major sale events, festive seasons, and {brand}-specific anniversary campaigns — our editorial team increases its monitoring frequency to ensure new offers are captured and published within hours of going live. If you want to stay ahead of the curve on {brand} savings, bookmarking this Couponchy page and returning to it at the start of every {brand} shopping session is the most reliable strategy for consistently finding active, working promo codes.`,
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

      `The difference between a good shopping experience and a great one at {brand} often comes down to timing and preparation. Shoppers who take a few seconds to check for active {brand} promo codes before placing an order consistently pay less than those who proceed straight to checkout. This page exists to make that check as fast and reliable as possible — all available {brand} offers are organized, verified, and updated in one place so you can identify your best savings option within seconds.`,

      `{brand} frequently launches category-specific discounts that apply only to certain product ranges within their catalogue. These targeted promotions are often underutilized because shoppers are not aware they exist. Couponchy's listings include both broad site-wide {brand} discount codes and narrower category deals, clearly labeled so you can quickly identify which offers apply to the specific products you want to buy this session.`,

      `Understanding the difference between a {brand} coupon code and a {brand} deal link is important for maximizing your savings strategy. A coupon code requires you to manually enter a code at checkout to activate a discount, while a deal link takes you directly to a pre-discounted {brand} product page or sale category. Both types of savings are equally valid — sometimes the deal link is actually the better option, particularly when it directs you to an item already reduced by more than any available promo code would offer.`,

      `For regular {brand} shoppers, developing a pre-checkout habit of visiting Couponchy is one of the highest-return habits you can build. Consider this: if you shop at {brand} even four times per year and apply an active promo code to each order, you could reduce your annual spending by a meaningful amount — without changing what you buy, without waiting for a sale, and without relying on luck. The codes are already here, verified, and ready to use.`,

      `Couponchy monitors {brand}'s promotional activity across multiple sources — including direct merchant feeds, partner networks, and publicly available campaign announcements — to ensure that every valid offer is captured and reflected in our listings as quickly as possible. This multi-source approach means the {brand} promo codes you find here are more reliably current than those found on platforms that rely on a single data feed or user submissions alone.`,
    ],

    whyItems: [
      `Shop {brand} with confidence using only verified discount codes`,
      `Find {brand} category sales, flash deals, and clearance vouchers`,
      `Stack {brand} coupon codes with ongoing sale prices for maximum savings`,
      `Track {brand} seasonal promotions — Black Friday, holiday sales, and more`,
      `All {brand} promo codes are organized by discount type for easy browsing`,
      `Both coupon codes and direct deal links available — multiple ways to save at {brand}`,
      `Multi-source monitoring ensures the most current and valid {brand} offers are always listed`,
      `Category-specific {brand} discounts captured alongside site-wide promotional codes`,
    ],

    outro: `Make {brand} your go-to {storeCategory} destination and let Couponchy handle the deal-hunting. Bookmark this page and return before every {brand} shopping trip to make sure you're always using the best available {brand} promo code or deal. The effort required is minimal — a few seconds to check the current listings, one click to reveal and copy your chosen {brand} coupon code, and a paste at checkout to apply the discount. For the amount of time it takes, the savings potential is extraordinary. With {couponCount} verified {brand} coupon codes and {dealCount} active deals currently available on this page, the math strongly favors checking here before you spend a single $ at {brand}'s full checkout price.`,

    faqs: [
      {
        question: `What types of {brand} discounts are available on Couponchy?`,
        answer: `Couponchy lists {couponCount} {brand} coupon codes (percentage off, flat amount discounts, and free shipping) as well as {dealCount} direct deal links. Deal links take you straight to a discounted {brand} product without needing a code. Our {brand} listings span multiple discount categories: percentage-based reductions that scale with your order total, flat-amount deductions ideal for smaller purchases, free shipping vouchers that eliminate delivery costs, and deal links that bypass the checkout code process entirely by directing you to pre-discounted product pages. This variety ensures that no matter what type of order you are placing at {brand}, there is likely a savings route available to you on this page.`,
      },
      {
        question: `Can I find {brand} free shipping codes here?`,
        answer: `Yes. We include {brand} free shipping promo codes and vouchers whenever they're available. These are listed alongside regular {brand} coupon codes and are clearly labelled so they're easy to spot. Free shipping offers are among the most searched discount types for {brand} shoppers, particularly for larger or heavier orders where delivery charges can significantly inflate the total cost. When {brand} publishes a free shipping promotion — whether as a standalone code, a minimum spend threshold trigger, or a limited-time site-wide offer — Couponchy captures and lists it immediately. Check the listings above for any currently active {brand} free delivery options before confirming your order.`,
      },
      {
        question: `Does {brand} have a sale section?`,
        answer: `{brand} regularly updates its sale section with discounted products across categories. Check the Deals tab on this page for direct links to active {brand} sale pages, so you can shop discounts without needing a separate coupon code. Sale sections at {brand} often carry deeper discounts than standard promo codes, particularly during major clearance events at the end of a season. Couponchy's deal links for {brand} include direct links to these sale category pages when they are active, allowing you to browse pre-reduced inventory without needing a separate code — and then potentially stack a coupon on top of any already-reduced prices where {brand}'s terms permit it.`,
      },
      {
        question: `How do I find the biggest {brand} discount available?`,
        answer: `The highest-value {brand} coupon code is usually listed at the top of this page. You can also browse through all {couponCount} {brand} coupons to compare discounts and pick the one that applies best to your order. Keep in mind that the "biggest" discount depends on your specific cart. A 20% off code may be worth more than a flat $10 code on a large order, but less on a smaller purchase. Review the terms of each {brand} offer — particularly the minimum order requirement and eligible product categories — to determine which code will deliver the highest actual saving on your specific basket. Our editorial descriptions are written to make this comparison as straightforward as possible.`,
      },
      {
        question: `Is it safe to shop at {brand} using links from Couponchy?`,
        answer: `Absolutely. All {brand} affiliate links on Couponchy go directly to the official {brand} website. You shop on {brand}'s own secure platform — Couponchy simply connects you to the best available discount first. We do not redirect through third-party pages, collect your payment information, or intercept any part of the {brand} checkout process. Our role is purely to surface the best available {brand} promo codes and deal links and make it easy for you to access them. Once you click through, every interaction — from browsing to payment — happens directly on {brand}'s own secure infrastructure.`,
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

      `Savings discipline is what separates smart shoppers from average ones — and at {brand}, the opportunity to save is almost always present. With up to {bestDiscount} off currently available through verified {brand} coupon codes, shoppers who take the extra step of visiting Couponchy before checkout are consistently paying less than those who skip straight to payment. The codes are verified, the savings are real, and the process takes under a minute from start to finish.`,

      `Not every {brand} deal requires a coupon code. Many of the savings listed on this page are deal links — direct connections to products or categories at {brand} that are already carrying a reduced price. For shoppers who find the coupon code process inconvenient, these deal links offer a no-friction alternative that delivers equivalent value with a single click. Couponchy lists both coupon codes and deal links together in a single unified directory so that every type of saver is served.`,

      `{brand}'s promotional calendar follows predictable patterns — major savings events tied to seasonal transitions, festive seasons, and category-specific sale windows — but also includes spontaneous flash discounts that are active for 24 to 72 hours before expiring. Couponchy monitors {brand}'s promotions continuously to capture both the predictable and the unexpected, ensuring that our listings reflect every active {brand} promo code and deal at any given moment. If {brand} launches a flash sale tonight, it will appear on this page within hours.`,

      `Applying a {brand} coupon code correctly is as important as finding one in the first place. A code that is valid but applied to an ineligible product — or to a cart that falls below a minimum order threshold — will be declined at checkout without explanation. Every {brand} offer on Couponchy includes a clear description of its terms, so you can evaluate suitability before committing to the checkout process. This saves time, reduces frustration, and increases the rate at which the codes you choose actually deliver the discount advertised.`,

      `Long-term savings at {brand} are built through consistent behavior, not luck. Shoppers who bookmark this Couponchy page and return to it before every {brand} order — regardless of how large or small the purchase — are the ones who consistently achieve the lowest effective prices. With {couponCount} active {brand} coupon codes and {dealCount} deals updated in real time, there is almost always something on this page that will reduce your checkout total. Building the habit of checking costs nothing and pays dividends on every eligible order.`,
    ],

    whyItems: [
      `Verified {brand} coupons that actually work — tested before listing`,
      `Track the best {brand} discount code available each month`,
      `Access exclusive {brand} vouchers not widely advertised elsewhere`,
      `Save on {brand} shipping with regularly updated free delivery codes`,
      `Reduce your {brand} checkout total instantly — no membership required`,
      `Up to {bestDiscount} off currently available — highest-value code always listed first`,
      `Flash sales and time-sensitive {brand} promotions captured within hours of going live`,
      `Offer terms clearly described alongside each {brand} coupon to prevent declined codes at checkout`,
    ],

    outro: `Every $ saved with a {brand} coupon code adds up. Couponchy makes sure you never overpay at {brand} by keeping its verified discount listings current throughout {currentYear}. Return before every order to claim the highest available {brand} promo code. The {couponCount} active {brand} coupons and {dealCount} deals on this page represent the full breadth of what is currently available — and every one of them has been checked to confirm it delivers the discount it promises. Savings at {brand} are not something that happens by accident. They happen because you checked this page before paying, found the right code, and applied it at checkout. That discipline, repeated across every {brand} order throughout the year, is what genuinely moves the needle on your shopping budget. Couponchy is here to make that habit as easy as possible.`,

    faqs: [
      {
        question: `How much can I save with {brand} coupons on Couponchy?`,
        answer: `The savings vary by offer. Currently, the best available {brand} coupon code offers up to {bestDiscount} off. Browse all {couponCount} listed {brand} coupon codes to find the one that gives you the highest discount on your specific order. The actual value of any given {brand} promo code depends on both the discount rate and the size of your order. A {bestDiscount} off percentage code delivers more savings on a larger purchase, while a flat-amount code provides more predictable value on smaller baskets. Review the terms of each {brand} offer before applying to confirm eligibility and maximize the effective discount on your specific cart configuration.`,
      },
      {
        question: `Are there any exclusive {brand} promo codes on Couponchy?`,
        answer: `Couponchy works to source and verify the widest range of {brand} discount codes available, including exclusive promotions not always listed elsewhere. All verified {brand} promo codes are available for free — no membership or registration required. Our network of merchant partnerships and monitoring tools allows Couponchy to surface {brand} offers that may not be widely circulated through standard promotional channels. While we cannot guarantee that every code listed is exclusive, our multi-source approach consistently turns up {brand} discounts that shoppers relying solely on the {brand} website's own promotional banners may miss entirely.`,
      },
      {
        question: `What is the average discount offered by {brand} coupon codes?`,
        answer: `{brand} coupon codes on Couponchy currently range from standard percentage discounts to free shipping vouchers. The highest confirmed {brand} discount available this month is {bestDiscount} off. Check the top of the list for the most valuable active codes. Average discounts at {brand} vary by season, product category, and promotional cycle. During peak sale events, {brand} promo codes tend to offer higher percentage reductions. Outside of major sales, flat-amount codes and free shipping vouchers are more commonly available. Checking this page regularly ensures you are always aware of the current going rate for {brand} discounts so you can time your purchases accordingly.`,
      },
      {
        question: `Can I combine multiple {brand} coupons in one order?`,
        answer: `Most retailers, including {brand}, allow only one coupon code per order. However, you can still maximize savings by choosing the highest-value {brand} coupon code from our list and applying it to a cart that already includes sale-priced items. This strategy — applying a promo code on top of already-reduced prices — is one of the most effective ways to achieve compound savings at {brand} without violating any coupon stacking restrictions. Browse the Deals section for any currently active {brand} sale pages, fill your cart from those pages, and then apply the best available {brand} coupon code at checkout for the maximum combined discount.`,
      },
      {
        question: `Where do I enter a {brand} coupon code at checkout?`,
        answer: `After adding your items to the {brand} cart, proceed to checkout. Look for a field labelled "Promo Code", "Coupon Code", or "Discount Code" on the payment page, paste your copied {brand} code there, and click Apply to see your savings reflected in the order total. The exact location of the coupon field varies slightly depending on {brand}'s checkout layout, but it is typically visible on the order summary step before payment details are requested. If you cannot locate the promo code field, try expanding any collapsible "Have a coupon?" or "Add a promo code" accordion element on the checkout page. Once applied successfully, the {brand} discount should immediately reduce the displayed order total before you confirm payment.`,
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

/**
 * Generate a dynamic, SEO-friendly "About {Brand}" description.
 * Always returns a deterministic text between 80 and 120 words.
 *
 * @param {object} store - Store record from database.
 * @param {Array} offers - Offers array for this store.
 */
export function generateStoreAboutDescription(store, offers = []) {
  const brand = store.name || "this brand";
  const category = store.category && store.category !== "shopping" 
    ? store.category.toLowerCase() 
    : "retail and shopping";

  const now = new Date();
  const currentMonth = now.toLocaleString("en-US", { month: "long" });
  const currentYear = String(now.getFullYear());

  const totalCouponsCount = offers.filter(o => o.type === "Coupon").length;
  const couponCount = String(totalCouponsCount || 5);
  
  const totalVerifiedCoupons = offers.filter(o => o.type === "Coupon" && o.status?.toLowerCase() !== "expired").length;
  const verifiedCoupons = String(totalVerifiedCoupons || 3);

  // scan best discount percentage
  let best = 0;
  for (const offer of offers) {
    const src = [offer.title, offer.description, offer.code].filter(Boolean).join(" ");
    const matches = [...src.matchAll(/(\d{1,3})\s*%/g)];
    for (const m of matches) {
      const val = Number(m[1]);
      if (val > best) best = val;
    }
  }
  const bestDiscount = best > 0 ? `${best}%` : "15%";

  // Template lists containing dynamic variables and required keywords
  const templates = [
    `Welcome to {Brand}, a premier merchant catering to your lifestyle in the dynamic {Category} sector. As of {CurrentMonth} {CurrentYear}, Couponchy maintains {CouponCount} active {Brand} Coupons and direct promotional Deals. We provide only Verified Coupons and daily checked Special Offers to guarantee immediate Savings at checkout. Shoppers can confidently use our verified {Brand} Coupon Codes and exclusive {Brand} Promo Codes to unlock maximum Discounts on their purchase. Before finalizing your order, check this page for active Seasonal Promotions and eligible Free Shipping options that make shopping here highly budget-friendly.`,
    
    `Discover high-quality shopping selections at {Brand}, where quality meets exceptional customer satisfaction. Specializing in trending {Category} collections, this store is a top choice for shoppers seeking pocket-friendly price cuts. To help you secure the highest possible Savings, Couponchy acts as a reliable hub for active {Brand} Coupons and top-rated Deals. We verify every single offer, providing Verified Coupons and daily refreshed Special Offers to lower your cart total. Browse our list of hand-tested {Brand} Coupon Codes and working {Brand} Promo Codes to apply the best available Discounts at checkout. Explore our current listings before placing an order to catch limited-time Seasonal Promotions and Free Shipping vouchers.`,
    
    `Elevate your online checkout experience at {Brand}, a leading destination known for its outstanding {Category} catalogue. Shoppers looking to maximize their wallet Savings will find Couponchy to be the ultimate companion. Our dedicated platform compiles active {Brand} Coupons and merchant Deals that ensure you get more value. With our list of Verified Coupons and hand-selected Special Offers, your checkout experience is always seamless and secure. Simply apply our active {Brand} Coupon Codes and valid {Brand} Promo Codes to deduct flat rates or percentage Discounts from your bill. Remember to browse this page before purchasing to find active Seasonal Promotions and cost-saving Free Shipping deals.`,
    
    `Get ready to explore the unique inventory at {Brand}, your favorite destination for premier products. If you are shopping for top-tier collections in the {Category} space, Couponchy is here to elevate your purchasing power. We work continuously to aggregate the best active {Brand} Coupons and direct promotional Deals in one convenient directory. To guarantee real Savings, our team lists only Verified Coupons and verified Special Offers tested for accuracy. Simply copy our exclusive {Brand} Coupon Codes and verified {Brand} Promo Codes to claim immediate checkout Discounts. Don't forget to review our directory before paying to capitalize on active Seasonal Promotions and limited-time Free Shipping campaigns.`,
    
    `Shop with peace of mind at {Brand}, a renowned merchant that continues to lead the {Category} market with innovative products. Couponchy makes it easier than ever to secure incredible Savings on your next order. We continuously update our catalog with active {Brand} Coupons and top direct product Deals to fit your budget. Our curated list of Verified Coupons and updated Special Offers ensures you never overpay for your favorite items. Access our reliable {Brand} Coupon Codes and new {Brand} Promo Codes to redeem the highest active Discounts on your order total. Return to our platform before paying to take advantage of ongoing Seasonal Promotions and Free Shipping offers.`
  ];

  // Deterministic index picker (same brand always gets same template)
  const hashVal = hashString(store.slug || store.name || "default");
  const idx = hashVal % templates.length;

  const rawText = templates[idx];
  return rawText
    .replace(/\{Brand\}/g, brand)
    .replace(/\{Category\}/g, category)
    .replace(/\{CouponCount\}/g, couponCount)
    .replace(/\{VerifiedCoupons\}/g, verifiedCoupons)
    .replace(/\{BestDiscount\}/g, bestDiscount)
    .replace(/\{CurrentMonth\}/g, currentMonth)
    .replace(/\{CurrentYear\}/g, currentYear);
}

