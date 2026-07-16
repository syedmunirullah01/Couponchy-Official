import Image from "next/image";
import Link from "next/link";
import { buildCountryPath } from "@/lib/countries";

function StoreBadge({ size = "large", logoText, logoClassName, logoImage, name }) {
  const base = size === "large" ? "h-16 w-16 sm:h-20 sm:w-20" : "h-12 w-12 sm:h-14 sm:w-14";
  return (
    <div className={`grid ${base} place-items-center overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 bg-white shadow-[0_10px_30px_rgba(139,92,246,0.15)] sm:shadow-[0_15px_40px_rgba(139,92,246,0.25)] transition-all duration-300 hover:scale-[1.03] shrink-0 ${logoImage ? "p-0" : "p-1.5 sm:p-2"}`}>
      {logoImage ? (
        <div className="relative h-full w-full overflow-hidden rounded-xl sm:rounded-2xl bg-white p-0.5 sm:p-1">
          <Image src={logoImage} alt={`${name} logo`} fill className="object-contain" unoptimized />
        </div>
      ) : (
        <div className={`flex h-full w-full items-center justify-center rounded-lg sm:rounded-xl text-center text-black ${logoClassName}`}>
          <span className="text-[10px] sm:text-sm font-black uppercase">{logoText?.slice(0, 2)}</span>
        </div>
      )}
    </div>
  );
}

export function BrandMark(props) {
  return <StoreBadge {...props} />;
}

const COUNTRY_CURRENCY_MAP = {
  US: "$",
  GB: "£",
  CA: "$",
  AU: "$",
  IN: "₹",
  DE: "€",
  FR: "€",
  IT: "€",
  ES: "€",
  NL: "€",
  BE: "€",
  AE: "AED",
  SA: "SAR",
  PL: "zł",
  PK: "Rs",
};

function getOfferValue(offer, countryCode = "US") {
  const defaultSymbol = COUNTRY_CURRENCY_MAP[String(countryCode).toUpperCase()] || "$";
  const title = offer.title || "";
  const description = offer.description || "";
  const combined = `${title} ${description}`.toLowerCase();

  // Price decimals indicate pricing, not discount (e.g. $19.99, Rs. 499.00)
  const hasDecimals = /(?:\$|£|€|¥|₹|zł|د\.إ|SR|TL|Rs\.?)\s*\d+\.\d{2}|\d+\.\d{2}\s*(?:\$|£|€|¥|₹|zł|د\.إ|SR|TL|Rs\.?|usd|gbp|eur|pkr)/i.test(combined);

  // If the offer is an entry-level price point (e.g. "Starting from $50" or "As low as $1,950"),
  // do not show a discount badge. Show the store name instead.
  const isStartingPrice =
    combined.includes("as low as") ||
    combined.includes("starting for") ||
    combined.includes("starting at") ||
    combined.includes("starts at") ||
    combined.includes("starts from") ||
    combined.includes("low price") ||
    /\bfrom\s*(?:\$|£|€|¥|₹|zł|Rs)/i.test(combined) ||
    /\bstarting\s*(?:\$|£|€|¥|₹|zł|Rs)/i.test(combined) ||
    /\bfor\s*(?:\$|£|€|¥|₹|zł|Rs)\s*\d+/i.test(combined) ||
    /\bjust\s*(?:\$|£|€|¥|₹|zł|Rs)\s*\d+/i.test(combined) ||
    /\bonly\s*(?:\$|£|€|¥|₹|zł|Rs)\s*\d+/i.test(combined) ||
    /(?:\$|£|€|¥|₹|zł|Rs)\s*\d+\s+for\b/i.test(combined) ||
    hasDecimals;

  if (isStartingPrice) {
    return offer.storeName || "Deal";
  }

  if (combined.includes("free shipping")) {
    return "Free Shipping";
  }
  if (combined.includes("free delivery")) {
    return "Free Delivery";
  }

  const source = [offer.title, offer.description, offer.code].filter(Boolean).join(" ");
  const percentMatch = source.match(/(\d{1,3})\s*%/);
  if (percentMatch) return `${percentMatch[1]}% Off`;

  // Currency extraction (e.g. $10, £20, €5, Rs 500, etc. or 15$)
  const currencyRegex = /(?:\$|£|€|¥|₹|zł|د\.إ|SR|TL|Rs\.?)\s*(\d{1,4})|(\d{1,4})\s*(?:\$|£|€|¥|₹|zł|د\.إ|SR|TL|Rs\.?|\busd\b|\bgbp\b|\beur\b|\bpkr\b|\baed\b|\bsar\b|\bcad\b|\baud\b|\binr\b|\bpln\b|\btry\b)/i;
  const currencyMatch = source.match(currencyRegex);
  if (currencyMatch) {
    const matchedText = currencyMatch[0];
    if (currencyMatch[1]) {
      const symbol = matchedText.match(/(\$|£|€|¥|₹|zł|د\.إ|SR|TL|Rs\.?)/i)?.[1] || defaultSymbol;
      return `${symbol}${currencyMatch[1]} Off`;
    }
    if (currencyMatch[2]) {
      const symbol = matchedText.match(/(\$|£|€|¥|₹|zł|د\.إ|SR|TL|Rs\.?|\busd\b|\bgbp\b|\beur\b|\bpkr\b|\baed\b|\bsar\b|\bcad\b|\baud\b|\binr\b|\bpln\b|\btry\b)/i)?.[0] || defaultSymbol;
      return `${currencyMatch[2]}${symbol.toUpperCase()} Off`;
    }
  }

  // Digit flat off (e.g. "10 Off")
  const flatOffMatch = source.match(/(\d{1,3})\s*(?:off|discount)/i);
  if (flatOffMatch) {
    return `${defaultSymbol}${flatOffMatch[1]} Off`;
  }

  return offer.type === "Deal" ? "Deal" : "Code";
}

export default function StoreHeader({ singleStore, storeTabs, offerTabs, offers = [], t }) {
  const storeTabTargets = {
    Coupons: "#coupons",
    "Store Info": "#store-info",
    FAQs: "#faqs",
  };

  const now = new Date();
  const country = String(singleStore.countryCode || "").toUpperCase();
  const monthLocaleMap = {
    PL: "pl-PL", DE: "de-DE", NL: "nl-NL", IT: "it-IT", FR: "fr-FR", ES: "es-ES"
  };
  const monthLocale = monthLocaleMap[country] || "en-US";
  const month = now.toLocaleString(monthLocale, { month: "long" });
  const year = now.getFullYear();
  const dynamicTitle = t.titleTemplate
    ? t.titleTemplate.replace("{name}", singleStore.name).replace("{month}", month).replace("{year}", year)
    : `${singleStore.name} Discount & Coupons Code ${month} ${year}`;

  const dynamicRating = (() => {
    let hash = 0;
    const seedString = `${singleStore.name}_${now.getMonth()}_${year}`;
    for (let i = 0; i < seedString.length; i++) {
      hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
    }
    const ratingIndex = Math.abs(hash) % 4; // 0, 1, 2, 3
    const ratingVal = (4.6 + ratingIndex * 0.1).toFixed(1); // 4.6, 4.7, 4.8, 4.9
    const reviewsVal = (Math.abs(hash) % 187) + 12; // 12 to 198 reviews
    const reviewsLabel = t.reviews || "reviews";
    return `${ratingVal} (${reviewsVal} ${reviewsLabel})`;
  })();

  const couponsCount = offers?.filter(o => o.type === "Coupon").length || 0;
  const topCoupon = offers?.find(o => o.type === "Coupon");
  const topCouponValue = topCoupon ? getOfferValue(topCoupon, singleStore?.countryCode) : "Active";

  const affiliateUrl = singleStore.affiliateLink || "#";
  const finalAffiliateUrl = affiliateUrl !== "#" && !/^https?:\/\//i.test(affiliateUrl) ? `https://${affiliateUrl}` : affiliateUrl;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-gradient-to-br from-[#0c0c12] to-[#050508] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] pointer-events-none" />

      {/* Dual Glow spots */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-[300px] w-[300px] rounded-full bg-[var(--color-primary)]/[0.08] blur-[90px]" />
      <div className="pointer-events-none absolute -right-20 -bottom-20 h-[250px] w-[250px] rounded-full bg-fuchsia-500/[0.04] blur-[80px]" />

      {/* Desktop Layout */}
      <div className="hidden sm:block relative p-8">
        {/* Breadcrumb */}
        <div className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30">
          <Link href="/stores" className="transition hover:text-white/60">{t.storesBreadcrumb}</Link>
          <span>/</span>
          {singleStore.categorySlug && (
            <>
              <Link href={`/stores?category=${singleStore.categorySlug}`} className="capitalize transition hover:text-white/60">
                {singleStore.categorySlug}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-white/55">{singleStore.name}</span>
        </div>

        {/* Store identity row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex flex-1 items-start gap-6 min-w-0">
            {/* Logo */}
            <div className="shrink-0">
              <StoreBadge
                size="large"
                logoText={singleStore.logoText}
                logoClassName={singleStore.logoClassName}
                logoImage={singleStore.logoImage}
                name={singleStore.name}
              />
            </div>

            {/* Title + Rating + Badges */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-black tracking-[-0.04em] text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/80 leading-[1.1]" suppressHydrationWarning>
                {dynamicTitle}
              </h1>

              {/* Rating and Verification Source Row */}
              <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs font-bold text-white/30">
                <span className="text-[var(--color-primary)] select-none">★★★★★</span>
                <span className="text-[var(--color-primary)] font-black text-sm" suppressHydrationWarning>{dynamicRating}</span>
                <span className="text-white/10 select-none">•</span>
                <span className="uppercase tracking-wider text-white/50">
                  {t.activeVerifiedSource.replace("{name}", singleStore.name)}
                </span>
              </div>

              {/* Trust Badges Row */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/5 px-3.5 py-1 text-xs font-bold text-violet-400 hover:border-violet-500/30 hover:bg-violet-500/10 transition-colors duration-200 cursor-default select-none shadow-[0_2px_10px_rgba(139,92,246,0.02)]">
                  ✓ {t.verifiedCodes}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1 text-xs font-bold text-white/80 hover:border-white/20 hover:bg-white/[0.07] transition-colors duration-200 cursor-default select-none shadow-[0_2px_10px_rgba(255,255,255,0.01)]">
                  🔥 {t.communityVerified}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1 text-xs font-bold text-white/80 hover:border-white/20 hover:bg-white/[0.07] transition-colors duration-200 cursor-default select-none shadow-[0_2px_10px_rgba(255,255,255,0.01)]">
                  🔒 {t.free100}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/5 px-3.5 py-1 text-xs font-bold text-violet-400 hover:border-violet-500/30 hover:bg-violet-500/10 transition-colors duration-200 cursor-default select-none shadow-[0_2px_10px_rgba(139,92,246,0.02)]">
                  ⚡ {t.instantSavings}
                </span>
              </div>
            </div>
          </div>

          {/* Visit Button on the right */}
          <div className="shrink-0">
            <Link
              href={finalAffiliateUrl}
              target={singleStore.affiliateLink ? "_blank" : undefined}
              rel={singleStore.affiliateLink ? "noreferrer" : undefined}
              className="group/visit relative flex items-center justify-center overflow-hidden rounded-2xl bg-[var(--color-primary)] px-7 py-4 text-xs font-black uppercase tracking-[0.16em] text-black transition-all duration-300 hover:shadow-[0_0_24px_rgba(139,92,246,0.45)] hover:scale-[1.03] active:scale-[0.98] shadow-lg shadow-violet-500/10 min-w-[170px]"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover/visit:translate-x-full" />
              <span className="relative flex items-center gap-2">
                {t.visitStore}
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 transition-transform duration-300 group-hover/visit:translate-x-1" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
                </svg>
              </span>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-7 flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-5">
          {storeTabs.map((tab, index) => (
            <Link
              key={tab}
              href={storeTabTargets[tab] || "#"}
              className={`rounded-full px-5 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${index === 0
                ? "bg-[var(--color-primary)] text-black hover:shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                : "border border-white/[0.07] bg-white/[0.03] text-white/45 hover:bg-white/[0.07] hover:border-white/[0.12] hover:text-white/75"
                }`}
            >
              {tab}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="block sm:hidden relative p-4">
        {/* Store identity block */}
        <div className="flex items-center gap-4">
          <StoreBadge
            size="large"
            logoText={singleStore.logoText}
            logoClassName={singleStore.logoClassName}
            logoImage={singleStore.logoImage}
            name={singleStore.name}
          />
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h1 className="text-[19px] font-black tracking-tight text-white leading-tight" suppressHydrationWarning>
              {dynamicTitle}
            </h1>
          </div>
        </div>

        {/* Metadata Row */}
        <div className="mt-4 flex flex-wrap items-center gap-2.5 text-[11px] font-bold text-white/35">
          {/* Promo Codes Count */}
          <div className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.5 1.5 0 0 0 2.122 0l4.318-4.318a1.5 1.5 0 0 0 0-2.122L11.159 3.659A1.5 1.5 0 0 0 9.568 3Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
            </svg>
            <span><strong className="text-white/80">{couponsCount}</strong> {t.promoCodesCount}</span>
          </div>
          <span className="text-white/10 select-none">•</span>
          {/* Top Verified Code */}
          <div className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.746 3.746 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
            <span>{t.topVerified}: <strong className="text-white/80">{topCouponValue}</strong></span>
          </div>
          <span className="text-white/10 select-none">•</span>
          {/* Health/Success */}
          <div className="flex items-center gap-1 text-[var(--color-primary)]">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
            </svg>
            <span>{t.verifiedPercent}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-3.5">
          {storeTabs.map((tab, index) => (
            <Link
              key={tab}
              href={storeTabTargets[tab] || "#"}
              className={`rounded-full px-4.5 py-2 text-xs font-black uppercase tracking-[0.14em] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${index === 0
                ? "bg-[var(--color-primary)] text-black hover:shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                : "border border-white/[0.07] bg-white/[0.03] text-white/45 hover:bg-white/[0.07] hover:border-white/[0.12] hover:text-white/75"
                }`}
            >
              {tab}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
