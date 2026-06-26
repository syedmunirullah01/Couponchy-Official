import Link from "next/link";
import { getPublicSiteSettings } from "@/server/services/settings-service";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";
import { buildCountryPath } from "@/lib/countries";
import { getAllStores } from "@/server/repositories/stores-repository";

const topCategories = ["Fashion", "Food", "Footwear", "Travel", "Beauty", "Furniture", "Home & Garden", "E-Bike"];
const topStores = ["Waterdrop", "Dorothy Perkins", "Debenhams", "Gousto UK", "EcoFlow", "FlexShopper", "Vitality", "Beginning Boutique AU"];
const usefulLinks = ["Home", "Stores", "Categories", "Contact Us", "About Us", "Imprint", "Sitemap"];

function toTitleCase(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// SVG Icons for the footer sections
function SearchIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
    </svg>
  );
}

function TerminalIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
    </svg>
  );
}

// AwardIcon uses strokeWidth 2 to match Check Shield icon visual balance
function AwardIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.174-.467.866-.467 1.04 0l2.124 5.702 5.922.39c.504.033.706.666.326 1.02l-4.502 4.195 1.39 5.786c.118.492-.416.88-.857.604l-5.021-3.136-5.021 3.136c-.44.276-.975-.112-.857-.604l1.39-5.786-4.502-4.195c-.38-.354-.178-.987.326-1.02l5.922-.39 2.124-5.702Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-4.5 w-4.5 mr-2.5 inline-block text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.01 3.752.054 2.668.12 3.883 1.347 4.003 4.003.044.968.054 1.32.054 3.752 0 2.43-.01 2.784-.054 3.752-.12 2.668-1.347 3.883-4.003 4.003-.968.044-1.32.054-3.752.054-2.43 0-2.784-.01-3.752-.054-2.668-.12-3.883-1.347-4.003-4.003-.044-.968-.054-1.32-.054-3.752 0-2.43.01-2.784.054-3.752.12-2.668 1.347-3.883 4.003-4.003.968-.044 1.32-.054 3.752-.054L12.315 2zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" clipRule="evenodd" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.99-1.72-.04-.03-.07-.06-.11-.09-.03 2.12-.04 4.24-.05 6.36a9.02 9.02 0 01-1.51 4.97 8.96 8.96 0 01-8.15 3.96c-2.61-.17-5.07-1.42-6.52-3.62A8.99 8.99 0 014 9.47c1.07-2.45 3.17-4.32 5.73-4.88a9.06 9.06 0 014.29.3v4.11a5.06 5.06 0 00-2.52.88c-1.39.99-2.07 2.76-1.71 4.45.33 1.55 1.57 2.78 3.12 3.11 1.7.35 3.49-.33 4.46-1.72.39-.55.59-1.22.59-1.9-.01-2.91 0-5.82 0-8.73.91-.07 1.83-.02 2.75-.02z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" d="M23.498 6.163a3.003 3.003 0 00-2.11-2.108C19.524 3.545 12 3.545 12 3.545s-7.525 0-9.388.51a3.003 3.003 0 00-2.11 2.108C0 8.029 0 12 0 12s0 3.972.502 5.837a3.003 3.003 0 002.11 2.108c1.863.51 9.388.51 9.388.51s7.525 0 9.388-.51a3.003 3.003 0 002.11-2.108c.502-1.865.502-5.837.502-5.837s0-3.971-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" clipRule="evenodd" />
    </svg>
  );
}

const verifyItems = [
  {
    title: "Automatic Discovery",
    desc: "Scan 10+ community and aggregator networks daily.",
    icon: SearchIcon,
  },
  {
    title: "Official Presence",
    desc: "Confirm validity directly against merchant promo pages.",
    icon: CheckIcon,
  },
  {
    title: "Simulated Checkout",
    desc: "Deploy headless Playwright agents to verify discount application.",
    icon: TerminalIcon,
  },
  {
    title: "Badge Approval",
    desc: "Publish and prioritize coupons that pass checkout validation.",
    icon: AwardIcon,
  },
];

const getStoreSlug = (name) => {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

const getUsefulLinkHref = (name) => {
  const mapping = {
    "Home": "/",
    "Stores": "/stores",
    "Categories": "/stores",
    "Contact Us": "/contact",
    "About Us": "/about",
    "Imprint": "/imprint",
    "Sitemap": "/sitemap"
  };
  return mapping[name] || "/";
};

export default async function Footer() {
  const settings = await getPublicSiteSettings();
  const countryCode = await resolveRequestCountryCode();

  let allStores = [];
  try {
    allStores = await getAllStores();
  } catch (err) {
    console.error("Failed to fetch stores for footer:", err);
  }

  const validStores = allStores.filter((s) => s && s.name && s.slug);

  const storesList =
    validStores.length > 0
      ? [...validStores]
          .sort((a, b) => (b.offersCount || 0) - (a.offersCount || 0))
          .slice(0, 8)
          .map((s) => ({
            name: toTitleCase(s.name),
            categorySlug: s.categorySlug || "all",
            slug: s.slug,
          }))
      : topStores.map((store) => ({
          name: store,
          categorySlug: "all",
          slug: getStoreSlug(store),
        }));

  const getSocialHref = (platform, configUrl) => {
    if (configUrl && configUrl.trim()) return configUrl;
    return `https://${platform.toLowerCase()}.com`;
  };

  const socialLinks = [
    { label: "facebook", href: getSocialHref("Facebook", settings.social?.facebook), icon: <FacebookIcon /> },
    { label: "Instagram", href: getSocialHref("Instagram", settings.social?.instagram), icon: <InstagramIcon /> },
    { label: "X (twitter)", href: getSocialHref("X", settings.social?.x), icon: <XIcon /> },
    { label: "Tiktok", href: getSocialHref("TikTok", settings.social?.tiktok), icon: <TikTokIcon /> },
    { label: "Youtube", href: getSocialHref("YouTube", settings.social?.youtube), icon: <YouTubeIcon /> },
  ];

  return (
    <footer className="relative mt-32 overflow-hidden bg-[#030305] border-t border-white/5 pt-24 pb-12">
      {/* Top glowing boundary elements */}
      <div className="absolute top-0 left-1/4 h-px w-1/2 bg-gradient-to-r from-transparent via-[var(--accent)]/20 to-transparent" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[800px] -translate-x-1/2 rounded-full bg-[var(--accent)]/5 blur-[120px]" />

      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        
        {/* Large Watermark Site Title and Centered Social Link Row */}
        <div className="relative mb-20 mt-8 flex flex-col items-center text-center">
          <h2 className="select-none text-[13vw] font-black uppercase leading-none tracking-tighter text-white/[0.03] notranslate">
            {settings.siteName || "Couponchy"}
          </h2>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap z-10">
            {socialLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-[#09090c]/90 px-4 py-2 text-xs font-bold text-white/50 transition-all duration-300 hover:scale-105 hover:border-[var(--color-primary)]/20 hover:bg-white/[0.02] hover:text-white"
              >
                {link.icon}
                <span className="text-[11px]">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Separator line below social row */}
        <div className="mb-20 h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        {/* Main Columns Grid */}
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_0.8fr_0.8fr_1.2fr] lg:gap-8 lg:items-start">
          
          {/* Column 1: HOW WE VERIFY */}
          <div className="flex flex-col gap-6">
            <h4 className="flex items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.25em] text-[var(--color-primary)]">
              <span className="h-[2px] w-4 bg-[var(--color-primary)]" />
              HOW WE VERIFY
            </h4>
            <div className="flex flex-col gap-4">
              {verifyItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className="group/card flex items-start gap-4 rounded-2xl border border-white/5 bg-[#09090c]/90 p-4 transition-all duration-300 hover:border-[var(--color-primary)]/20 hover:bg-white/[0.02]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 text-[var(--color-primary)] transition-all duration-300 group-hover/card:border-[var(--color-primary)]/45 group-hover/card:bg-[var(--color-primary)]/15 group-hover/card:scale-105">
                    <item.icon />
                  </div>
                  <div>
                    <h5 className="text-sm font-extrabold text-white/80 transition-colors duration-300 group-hover/card:text-[var(--color-primary)]">
                      {item.title}
                    </h5>
                    <p className="mt-1 text-xs text-white/40 leading-relaxed font-medium">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: TOP STORES */}
          <div className="flex flex-col gap-6 sm:pl-4">
            <h4 className="flex items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.25em] text-[var(--color-primary)]">
              <span className="h-[2px] w-4 bg-[var(--color-primary)]" />
              TOP STORES
            </h4>
            <nav className="flex flex-col gap-4">
              {storesList.map((store) => (
                <Link
                  key={store.name}
                  href={buildCountryPath(`/stores/${store.categorySlug}/${store.slug}`, countryCode)}
                  className="group flex items-center gap-1.5 text-sm font-bold text-white/50 transition-colors hover:text-white/90"
                >
                  <span className="text-[var(--color-primary)] text-[10px] select-none transition-transform duration-300 group-hover:scale-125 mr-1">♦</span>
                  {store.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 3: COMPANY */}
          <div className="flex flex-col gap-6 sm:pl-4">
            <h4 className="flex items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.25em] text-[var(--color-primary)]">
              <span className="h-[2px] w-4 bg-[var(--color-primary)]" />
              COMPANY
            </h4>
            <nav className="flex flex-col gap-4">
              {usefulLinks.map((link) => (
                <Link
                  key={link}
                  href={buildCountryPath(getUsefulLinkHref(link), countryCode)}
                  className="group flex items-center gap-1.5 text-sm font-bold text-white/50 transition-colors hover:text-white/90"
                >
                  <span className="text-[var(--color-primary)] text-[10px] select-none transition-transform duration-300 group-hover:scale-125 mr-1">♦</span>
                  {link}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 4: STAY IN THE LOOP */}
          <div className="flex flex-col gap-6">
            <h4 className="flex items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.25em] text-[var(--color-primary)]">
              <span className="h-[2px] w-4 bg-[var(--color-primary)]" />
              STAY IN THE LOOP
            </h4>
            <div className="rounded-[28px] border border-[var(--color-primary)]/10 bg-[#09090c] p-8">
              <h3 className="text-[22px] font-bold tracking-tight text-white/90">
                Join The <span className="text-[var(--color-primary)]">Elite</span>
              </h3>
              <p className="mt-4 text-[13px] leading-[1.6] text-white/45 font-medium">
                Subscribe For Updates, Featured Drops, And Store Highlights. Never Miss A Deal.
              </p>
              <div className="mt-6 flex flex-col gap-4">
                <input
                  type="email"
                  placeholder="Your Email Address"
                  className="h-14 w-full rounded-2xl border border-white/10 bg-[#050507] px-5 text-sm font-medium text-white outline-none transition-all placeholder:text-white/20 focus:border-[var(--color-primary)]/30 focus:bg-[#07070a]"
                />
                <button 
                  type="button"
                  className="group/btn relative overflow-hidden flex flex-col items-center justify-center w-full h-16 rounded-2xl bg-[var(--color-primary)] text-black font-bold transition-all hover:scale-[1.01] hover:bg-[var(--color-primary-hover)] active:scale-[0.98] cursor-pointer"
                >
                  {/* Shimmer Light Sweep Hover Effect */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-1000 group-hover/btn:translate-x-full" />

                  <span className="relative z-10 text-[15px] font-bold">Subscribe Now</span>
                  <span className="relative z-10 text-[18px] leading-none mt-0.5">→</span>
                </button>
                <p className="text-[10px] text-center text-white/20 font-bold uppercase tracking-[0.05em] mt-2">
                  No Spam. Unsubscribe Anytime.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Bottom Bar */}
        <div className="mt-20 border-t border-white/5 pt-10 flex flex-col gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center text-[var(--color-primary)] font-black">
            <ShieldIcon />
            <span className="text-white/50 cursor-default hover:text-white transition-colors">
              All Coupons Verified By Our Automated System
            </span>
          </div>
          <p className="text-white/40">{`© 2026 ${settings.siteName || "Couponchy"}. All Rights Reserved.`}</p>
          <p className="text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors">
            <a href={`mailto:${settings.supportEmail || "contact@couponchy.com"}`}>
              {settings.supportEmail || "Contact@couponchy.com"}
            </a>
          </p>
        </div>
      </div>

      {/* Full-width bottom line with a primary color gradient highlight */}
      <div className="absolute bottom-0 left-0 w-full h-[4px] bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent" />
    </footer>
  );
}
