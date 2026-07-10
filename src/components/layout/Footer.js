import Link from "next/link";
import { getPublicSiteSettings } from "@/server/services/settings-service";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";
import { buildCountryPath } from "@/lib/countries";
import { getAllStores } from "@/server/repositories/stores-repository";
import { COUNTRY_TO_LANG, getTranslatedFooter } from "@/server/services/translation-service";
import NewsletterForm from "./NewsletterForm";

const topCategories = ["Fashion", "Food", "Footwear", "Travel", "Beauty", "Furniture", "Home & Garden", "E-Bike"];
const topStores = ["Waterdrop", "Dorothy Perkins", "Debenhams", "Gousto UK", "EcoFlow", "FlexShopper", "Vitality", "Beginning Boutique AU"];
const usefulLinks = ["About Us", "Contact Us", "Privacy Policy", "Terms Of Service", "Sitemap"];


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

function DiscordIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
    </svg>
  );
}

function PinterestIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" d="M12.002 2C6.479 2 2 6.479 2 12.002c0 4.232 2.628 7.842 6.338 9.39-.086-.79-.163-2.003.034-2.868.178-.78.147-3.376.147-3.376s-.29-.58-.29-1.439c0-1.348.782-2.355 1.756-2.355.828 0 1.228.621 1.228 1.366 0 .832-.53 2.077-.803 3.23-.229.967.487 1.756 1.44 1.756 1.729 0 3.058-1.822 3.058-4.453 0-2.328-1.673-3.956-4.062-3.956-2.768 0-4.393 2.077-4.393 4.223 0 .836.322 1.733.724 2.221.08.097.09.183.067.28-.073.305-.236.962-.268 1.097-.043.178-.141.216-.327.13-1.228-.57-1.996-2.362-1.996-3.8 0-3.097 2.25-5.942 6.488-5.942 3.407 0 6.054 2.428 6.054 5.672 0 3.385-2.134 6.108-5.097 6.108-.996 0-1.933-.518-2.253-1.13l-.613 2.333c-.221.85-.82 1.916-1.222 2.572 1.127.348 2.32.535 3.559.535 5.523 0 10-4.477 10-12.002C22.002 6.479 17.525 2 12.002 2z" clipRule="evenodd" />
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
    "About Us": "/about",
    "Contact Us": "/contact",
    "Privacy Policy": "/privacy-policy",
    "Terms Of Service": "/terms-of-service",
    "Sitemap": "/sitemap",
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

  const activeCountry = (countryCode || "US").toUpperCase();
  const validStores = allStores.filter(
    (s) => s && s.name && s.slug && (s.countryCode || "US").toUpperCase() === activeCountry
  );

  const storesList =
    validStores.length > 0
      ? [...validStores]
        .sort((a, b) => (b.offersCount || 0) - (a.offersCount || 0))
        .slice(0, 8)
        .map((s) => ({
          name: s.name,
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
    { label: "Tiktok", href: getSocialHref("TikTok", settings.social?.tiktok), icon: <TikTokIcon /> },
    { label: "Youtube", href: getSocialHref("YouTube", settings.social?.youtube), icon: <YouTubeIcon /> },
    { label: "Pinterest", href: getSocialHref("Pinterest", settings.social?.pinterest), icon: <PinterestIcon /> },
  ];

  const lang = COUNTRY_TO_LANG[activeCountry] || "en";
  const t = await getTranslatedFooter(lang);

  const localVerifyItems = [
    { title: t.verify_title_0, desc: t.verify_desc_0, icon: verifyItems[0].icon },
    { title: t.verify_title_1, desc: t.verify_desc_1, icon: verifyItems[1].icon },
    { title: t.verify_title_2, desc: t.verify_desc_2, icon: verifyItems[2].icon },
    { title: t.verify_title_3, desc: t.verify_desc_3, icon: verifyItems[3].icon },
  ];

  const joinEliteText = t.joinElite || "Join The Elite";
  const match = joinEliteText.match(/(elite|élite|elity|النخبة)/i);
  let eliteElement;
  if (match) {
    const matchedWord = match[0];
    const index = joinEliteText.indexOf(matchedWord);
    const prefix = joinEliteText.slice(0, index);
    const suffix = joinEliteText.slice(index + matchedWord.length);
    eliteElement = (
      <>
        {prefix}
        <span className="text-[var(--color-primary)]">{matchedWord}</span>
        {suffix || null}
      </>
    );
  } else {
    eliteElement = (
      <>
        Join The <span className="text-[var(--color-primary)]">Elite</span>
      </>
    );
  }



  return (
    <footer className="relative mt-32 overflow-hidden bg-[#030305] border-t border-white/5 pt-24 pb-12">
      {/* Top glowing boundary elements */}
      <div className="absolute top-0 left-1/4 h-px w-1/2 bg-gradient-to-r from-transparent via-[var(--accent)]/20 to-transparent" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[800px] -translate-x-1/2 rounded-full bg-[var(--accent)]/5 blur-[120px]" />

      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">

        {/* Large Watermark Site Title and Centered Social Link Row */}
        <div className="relative mb-20 mt-8 flex flex-col items-center text-center">
          <div aria-hidden="true" className="select-none text-[13vw] font-black uppercase leading-none tracking-tighter text-white/[0.03] notranslate">
            {settings.siteName || "Couponchy"}
          </div>
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
              {t.howWeVerify}
            </h4>
            <div className="flex flex-col gap-4">
              {localVerifyItems.map((item, idx) => (
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
              {t.topStores}
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
              {t.company}
            </h4>
            <nav className="flex flex-col gap-4">
              {usefulLinks.map((link) => (
                <Link
                  key={link}
                  href={buildCountryPath(getUsefulLinkHref(link), countryCode)}
                  className="group flex items-center gap-1.5 text-sm font-bold text-white/50 transition-colors hover:text-white/90"
                >
                  <span className="text-[var(--color-primary)] text-[10px] select-none transition-transform duration-300 group-hover:scale-125 mr-1">♦</span>
                  {t[link] || link}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 4: STAY IN THE LOOP */}
          <div className="flex flex-col gap-6">
            <h4 className="flex items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.25em] text-[var(--color-primary)]">
              <span className="h-[2px] w-4 bg-[var(--color-primary)]" />
              {t.stayInLoop}
            </h4>
            <div className="rounded-[28px] border border-[var(--color-primary)]/10 bg-[#09090c] p-8">
              <h3 className="text-[22px] font-bold tracking-tight text-white/90">
                {eliteElement}
              </h3>
              <p className="mt-4 text-[13px] leading-[1.6] text-white/45 font-medium">
                {t.subscribeDesc}
              </p>
              <NewsletterForm />
            </div>
          </div>

        </div>

        {/* Footer Bottom Bar */}
        <div className="mt-20 border-t border-white/5 pt-10 flex flex-col gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center text-[var(--color-primary)] font-black">
            <ShieldIcon />
            <span className="text-white/50 cursor-default hover:text-white transition-colors">
              {t.allVerified}
            </span>
          </div>
          <p className="text-white/40">{`© 2026 ${settings.siteName || "Couponchy"}. ${t.allRightsReserved}`}</p>
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
