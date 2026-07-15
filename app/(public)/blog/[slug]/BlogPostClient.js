"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buildCountryPath } from "@/lib/countries";
import FeaturedCouponCard from "@/features/home/components/FeaturedCouponCard";
import FeaturedProductsSection from "@/features/home/components/FeaturedProductsSection";

// Reusable custom visual illustrations matching the articles (High-end Pinterest/Dribbble style)
function ContentVisual({ type }) {
  const gridStyle = {
    backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
    backgroundSize: "20px 20px"
  };

  if (type === "verification-ui") {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#121216] to-[#08080a] p-6 my-8 shadow-2xl" style={gridStyle}>
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-primary)]/40 to-transparent" />
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="text-[10px] font-mono font-bold tracking-wider text-white/50">VERIFIER_AGENT_ACTIVE</span>
          </div>
          <span className="rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-2.5 py-0.5 text-[9px] font-mono text-[var(--color-primary)]">STATUS: 200_OK</span>
        </div>
        <div className="mt-5 space-y-4">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-white/45">Target Merchant:</span>
            <span className="text-white font-bold">Waterdrop Store</span>
          </div>
          <div className="flex justify-between text-xs font-mono">
            <span className="text-white/45">Coupon Code Checked:</span>
            <span className="text-[var(--color-primary)] font-bold tracking-wider bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded px-2 py-0.5">SAVE15</span>
          </div>
          <div className="rounded-xl bg-black/60 border border-white/5 p-4 font-mono text-[10px] text-emerald-400 leading-relaxed shadow-inner">
            <span className="text-white/30 block mb-1">Agent Console Log:</span>
            <span>&gt;&gt; Simulating headless checkout...</span>
            <br />
            <span className="text-emerald-400 font-bold">&gt;&gt; Cart state verified. 15% discount applied successfully!</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === "phone-mockup") {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#14141a] to-[#08080a] p-8 my-8 flex justify-center shadow-2xl">
        <div className="w-[190px] rounded-[38px] border-[5px] border-white/10 bg-black p-3.5 shadow-2xl relative">
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-14 h-3 bg-black rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
          </div>
          <div className="rounded-[24px] bg-[#0c0c0e] p-3 text-center border border-white/5 mt-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-purple-600 mx-auto flex items-center justify-center text-white text-xs font-black shadow-lg">✓</div>
            <div className="text-xs font-bold text-white mt-3 leading-none">Coupon Applied!</div>
            <div className="text-[9px] text-white/40 mt-1">You saved $24.50</div>
            <div className="mt-4 border-t border-dashed border-white/10 pt-3">
              <span className="text-[8px] font-mono block text-white/30">DISCOUNT CODE</span>
              <span className="text-xs font-mono font-black text-[var(--color-primary)] tracking-widest block mt-1.5 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded py-1">EXTRA20</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function parseMarkdownToHTML(text) {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong class='text-white font-bold'>$1</strong>");
  html = html.replace(/__(.*?)__/g, "<strong class='text-white font-bold'>$1</strong>");

  // Italic
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.*?)_/g, "<em>$1</em>");

  // Images
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, "<div class='my-8 rounded-3xl overflow-hidden border border-white/10 bg-black/40 p-2 shadow-2xl max-w-2xl mx-auto'><img src='$2' alt='$1' class='w-full h-auto object-cover rounded-2xl' /></div>");

  // Headings
  html = html.replace(/^### (.*?)$/gm, "<h3 class='text-lg font-bold text-white mt-8 mb-4 tracking-tight'>$1</h3>");
  html = html.replace(/^## (.*?)$/gm, "<h2 class='text-2xl font-black text-white mt-12 mb-6 border-l-4 border-[var(--color-primary)] pl-4 tracking-tight scroll-mt-24'>$1</h2>");
  html = html.replace(/^# (.*?)$/gm, "<h1 class='text-3xl font-black text-white mt-14 mb-6 border-b border-white/5 pb-2.5 tracking-tight'>$1</h1>");

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2' target='_blank' class='text-[var(--color-primary)] hover:text-white transition-colors duration-200 underline font-bold'>$1</a>");

  // Lists (Custom Pinterest colored bullets)
  html = html.replace(/^\s*-\s+(.*?)$/gm, "<li class='list-none relative pl-6 my-3 text-white/75 before:content-[\"\"] before:absolute before:left-0 before:top-2.5 before:w-2 before:h-2 before:rounded-full before:bg-[var(--color-primary)]'>$1</li>");
  html = html.replace(/^\s*\*\s+(.*?)$/gm, "<li class='list-none relative pl-6 my-3 text-white/75 before:content-[\"\"] before:absolute before:left-0 before:top-2.5 before:w-2 before:h-2 before:rounded-full before:bg-[var(--color-primary)]'>$1</li>");

  // Convert line breaks to paragraphs
  const paragraphs = html.split(/\n\n+/);
  return paragraphs
    .map(p => {
      const trimmed = p.trim();
      if (trimmed.startsWith("<h") || trimmed.startsWith("<li") || trimmed.startsWith("<div")) {
        return p;
      }
      return `<p class="leading-8 text-white/70 mb-6 text-[16px]">${p.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");
}

const defaultUI = {
  ourJournal: "OUR JOURNAL",
  shoppingDecoded: "Shopping, Decoded.",
  searchPlaceholder: "Search articles...",
  loadMore: "Load More Articles",
  noArticlesFound: "No articles found",
  noArticlesDesc: "Try searching for other terms or selecting a different category.",
  stayUpdated: "STAY UPDATED",
  findOutWhenWePublish: "Find out when we publish.",
  subscribeDesc: "Subscribe to our newsletter to receive the latest e-commerce insights, discount code trends, and data reports directly in your inbox.",
  subscribePlaceholder: "Enter your email address...",
  subscribeButton: "SUBSCRIBE",
  insideOurPlatform: "INSIDE OUR PLATFORM",
  understandTheEngine: "Understand the engine.",
  validationSystem: "Validation System",
  howItWorks: "How It Works",
  validationDesc: "Our validation crawler runs 24/7 matching codes with simulated cart responses. We automatically test code stackability and record success rates to save you time.",
  goHome: "Go to Homepage →",
  couponAnatomy: "Coupon Anatomy",
  anatomyOfVoucher: "Anatomy of a Voucher",
  anatomyDesc: "Understanding discount logic is crucial. From sitewide tags to category exclusions and minimum spend values, we break down code parameters for transparency.",
  viewExclusiveDeals: "View Exclusive Deals →",
  blogBreadcrumb: "BLOG",
  tableOfContents: "Table of Contents",
  shareThisArticle: "Share this article",
  linkCopied: "Link Copied!",
  moreFromOurJournal: "MORE FROM OUR JOURNAL",
  relatedArticles: "Related Articles",
  intro: "Introduction",
  marketShift: "Market Insights",
  detailedAnalysis: "Analysis Detail",
  conclusion: "Conclusion",
  readArticle: "Read article",
  read: "READ",
  by: "By",
  journalSub: "Find our latest insights, data analyses, and shopping guides from the world of e-commerce, coupons, and retail trends.",
  successSub: "✓ Subscription Successful!",
  successSubDesc: "Thank you for subscribing. We will keep you updated.",
};

// Curated high-converting fallbacks for Apple, Nike, Bellroy, and Hydro Flask
const fallbackProducts = [
  {
    id: "p1",
    title: "AirPods Pro (2nd Generation)",
    storeName: "Apple Store",
    price: 199,
    originalPrice: 249,
    image: "https://images.unsplash.com/photo-1588449668365-d15e397f6787?auto=format&fit=crop&w=400&q=80",
    productUrl: "https://apple.com",
    currency: "$",
    ctaLabel: "Get Deal"
  },
  {
    id: "p2",
    title: "Ultra-Lightweight Running Shoes",
    storeName: "Nike",
    price: 85,
    originalPrice: 120,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80",
    productUrl: "https://nike.com",
    currency: "$",
    ctaLabel: "Get Deal"
  },
  {
    id: "p3",
    title: "Minimalist Leather Backpack",
    storeName: "Bellroy",
    price: 139,
    originalPrice: 180,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80",
    productUrl: "https://bellroy.com",
    currency: "$",
    ctaLabel: "Get Deal"
  },
  {
    id: "p4",
    title: "Stainless Steel Smart Thermos",
    storeName: "Hydro Flask",
    price: 32,
    originalPrice: 45,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=400&q=80",
    productUrl: "https://hydroflask.com",
    currency: "$",
    ctaLabel: "Get Deal"
  }
];

const fallbackCoupons = [
  {
    brand: "Nike",
    tag: "Exclusive",
    title: "20% Off All Orders + Free Shipping",
    value: "JUSTDOIT20",
    description: "Get 20% off sitewide on Nike.com. Includes sale items and free shipping for members.",
    affiliateLink: "https://nike.com"
  },
  {
    brand: "Hostinger",
    tag: "Hot Deal",
    title: "Up to 75% Off Premium Web Hosting",
    value: "GET DEAL",
    description: "Hostinger hosting starting at $2.99/mo. Includes free domain registration and SSL certificate.",
    affiliateLink: "https://hostinger.com"
  },
  {
    brand: "NordVPN",
    tag: "Verified",
    title: "Save 65% on the 2-Year Security Package",
    value: "NORDSECURE",
    description: "Enjoy 65% discount on NordVPN subscriptions with an extra 3 months free. Verified working.",
    affiliateLink: "https://nordvpn.com"
  }
];

export default function BlogPostClient({ slug, countryCode, initialArticle, initialUi, featuredProducts = [], featuredCoupons = [] }) {
  const pathname = usePathname();

  const [article, setArticle] = useState(initialArticle);
  const [ui, setUi] = useState(initialUi);
  const [loading, setLoading] = useState(!initialArticle);
  const [error, setError] = useState(null);

  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeHeading, setActiveHeading] = useState("");
  const [copiedCouponCode, setCopiedCouponCode] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldCollapse, setShouldCollapse] = useState(false);
  const contentRef = useRef(null);

  // Determine if the article is long enough to collapse
  useEffect(() => {
    if (article && contentRef.current) {
      const timer = setTimeout(() => {
        const height = contentRef.current?.scrollHeight || 0;
        if (height > 750) {
          setShouldCollapse(true);
        } else {
          setShouldCollapse(false);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [article, loading]);

  const t = ui || defaultUI;

  // Fetch article dynamically from API if not loaded or if slug changes
  useEffect(() => {
    if (initialArticle && initialArticle.slug === slug) {
      setArticle(initialArticle);
      setUi(initialUi);
      setLoading(false);
      return;
    }

    async function loadArticle() {
      try {
        setLoading(true);
        const res = await fetch(`/api/blog/${slug}`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Unable to load article parameters.");
        }
        const payload = await res.json();
        setArticle(payload.data);
        setUi(payload.ui || null);
      } catch (err) {
        setError(err.message || "Article not found.");
      } finally {
        setLoading(false);
      }
    }
    if (slug) {
      loadArticle();
    }
  }, [slug, initialArticle, initialUi]);

  // Table of Contents navigation helpers
  useEffect(() => {
    if (!article) return;
    const handleScroll = () => {
      const headings = document.querySelectorAll("article h2");
      let currentActive = "";
      headings.forEach((heading) => {
        const top = heading.getBoundingClientRect().top;
        if (top < 150) {
          currentActive = heading.id;
        }
      });
      setActiveHeading(currentActive);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [article]);

  const handleShareClick = (platform) => {
    if (!article) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (platform === "whatsapp") {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(article.title + " " + url)}`, "_blank");
    } else if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title + " " + url)}`, "_blank");
    } else if (platform === "copy") {
      navigator.clipboard?.writeText(url).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      });
    }
  };

  const handleCopyCoupon = (code) => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopiedCouponCode(code);
      setTimeout(() => setCopiedCouponCode(null), 2000);
    });
  };

  // Slice displayed items
  const displayProducts = featuredProducts.length > 0 ? featuredProducts.slice(0, 10) : fallbackProducts.slice(0, 10);
  const displayCoupons = featuredCoupons.length > 0 ? featuredCoupons.slice(0, 3) : fallbackCoupons;

  // Generate headings automatically from article content for table of contents
  const headings = article?.content
    ? [
      { id: "introduction", label: t.intro },
      ...(article.content.includes("Shift") || article.content.includes("E-commerce")
        ? [{ id: "market-shift", label: t.marketShift }]
        : []),
      { id: "detailed-analysis", label: t.detailedAnalysis },
      { id: "conclusion", label: t.conclusion }
    ]
    : [];

  const getTranslatedCategory = (category) => {
    if (!category) return "";
    const lower = category.toLowerCase().trim();
    if (lower === "latest data") return t.catLatestData || category;
    if (lower === "store guides") return t.catStoreGuides || category;
    if (lower === "best lists") return t.catBestLists || category;
    if (lower === "deep dives") return t.catDeepDives || category;
    return category;
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-[1240px] items-center justify-center">
        <svg viewBox="0 0 24 24" className="h-8 w-8 animate-spin text-[var(--color-primary)]" fill="none">
          <circle cx="12" cy="12" r="9" className="stroke-current opacity-25" strokeWidth="3" />
          <path d="M21 12a9 9 0 0 0-9-9" className="stroke-current" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-[1240px] flex-col items-center justify-center text-center px-6">
        <svg className="h-12 w-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
        <h3 className="mt-4 text-lg font-bold text-white">Article Not Found</h3>
        <p className="mt-2 text-sm text-white/40 max-w-sm">The article you are trying to view does not exist or has been removed.</p>
        <Link href={buildCountryPath("/blog", countryCode)} className="mt-6 rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-xs font-black uppercase text-black">
          Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-12 px-5 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">

      {/* Breadcrumbs */}
      <nav className="text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center gap-2">
        <Link href={buildCountryPath("/blog", countryCode)} className="hover:text-[var(--color-primary)] transition-colors">
          {t.blogBreadcrumb}
        </Link>
        <span>/</span>
        <span className="text-white/60 truncate">{article.title}</span>
      </nav>

      {/* Centered Editorial Hero Section */}
      <section className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[#0e0e12] p-8 sm:p-12 lg:p-16 flex flex-col items-center text-center w-full shadow-2xl">
        <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-[var(--color-primary)]/5 blur-[120px] pointer-events-none" />
        <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center max-w-3xl w-full">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/20 bg-gradient-to-r from-purple-500/10 to-[var(--color-primary)]/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--color-primary)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
            {getTranslatedCategory(article.category)}
          </div>

          <h1 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
            {article.title}
          </h1>

          {/* Premium Meta Row */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 border-t border-b border-white/5 py-4 w-full max-w-2xl">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-600 to-violet-600 p-[1.5px] shadow-lg">
                <div className="h-full w-full rounded-full bg-black flex items-center justify-center text-[10px] font-black text-[var(--color-primary)]">
                  {article.author?.slice(0, 2)}
                </div>
              </div>
              <div className="text-left">
                <span className="block text-[9px] uppercase tracking-wider text-white/40 leading-none">Written by</span>
                <span className="font-bold text-white/90 text-xs mt-0.5 block leading-none">{article.author}</span>
              </div>
            </div>
            
            <div className="hidden sm:block h-8 w-[1px] bg-white/10" />

            <div className="text-center sm:text-left">
              <span className="block text-[9px] uppercase tracking-wider text-white/40 leading-none">Published on</span>
              <span className="font-bold text-white/90 text-xs mt-0.5 block leading-none">{article.date}</span>
            </div>

            <div className="hidden sm:block h-8 w-[1px] bg-white/10" />

            <div className="text-center sm:text-left">
              <span className="block text-[9px] uppercase tracking-wider text-white/40 leading-none">Reading Time</span>
              <span className="font-bold text-white/90 text-xs mt-0.5 block leading-none">{article.readTime}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Page Layout (Two Columns) */}
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">

        {/* Sticky Left Sidebar (Pinterest Focus) */}
        <aside className="lg:sticky lg:top-24 lg:self-start space-y-6 order-2 lg:order-1">
          
          {/* Author Bio Card */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6 backdrop-blur-xl shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="relative h-16 w-16 rounded-full bg-gradient-to-tr from-purple-600 to-violet-600 p-[2px] shadow-lg">
                <div className="h-full w-full rounded-full bg-black flex items-center justify-center text-lg font-black text-[var(--color-primary)]">
                  {article.author?.slice(0, 2)}
                </div>
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-black bg-emerald-500" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white leading-none">{article.author}</h3>
              <p className="text-[10px] text-[var(--color-primary)] uppercase tracking-widest font-bold mt-1.5 leading-none">{article.authorRole}</p>
              <p className="mt-3.5 text-xs text-white/50 leading-relaxed">
                Curating the best shopping strategies, automated validation trends, and saving tips for e-commerce.
              </p>
            </div>
          </div>

          {/* Table of Contents */}
          {headings.length > 0 && (
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6 backdrop-blur-xl shadow-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] leading-none">{t.tableOfContents}</p>
              <nav className="mt-5 flex flex-col gap-3.5">
                {headings.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    className={cn(
                      "text-xs font-semibold transition-all duration-300 flex items-center gap-2",
                      activeHeading === heading.id
                        ? "text-white font-bold translate-x-1"
                        : "text-white/45 hover:text-white"
                    )}
                  >
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full transition-all duration-300",
                      activeHeading === heading.id ? "bg-[var(--color-primary)] scale-125 shadow-[0_0_8px_rgba(139,92,246,0.6)]" : "bg-white/10"
                    )} />
                    {heading.label}
                  </a>
                ))}
              </nav>
            </div>
          )}

          {/* Pinterest & Social Share Card */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6 backdrop-blur-xl shadow-xl text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] mb-4 leading-none">{t.shareThisArticle}</p>
            <div className="flex flex-col gap-3">
              
              {/* Prominent Pinterest Pin Button */}
              <button
                onClick={() => {
                  const url = typeof window !== "undefined" ? window.location.href : "";
                  const desc = encodeURIComponent(article.title);
                  window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${desc}`, "_blank");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E60023] hover:bg-[#ad001a] py-3 text-xs font-bold text-white transition-all hover:scale-[1.02] shadow-md cursor-pointer"
              >
                <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.993 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.172.278-.396.176-1.482-.689-2.41-2.855-2.41-4.594 0-3.738 2.718-7.173 7.834-7.173 4.113 0 7.309 2.93 7.309 6.848 0 4.087-2.577 7.376-6.154 7.376-1.202 0-2.332-.624-2.719-1.362l-.74 2.82c-.267 1.018-.987 2.294-1.47 3.082C9.88 23.776 10.921 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
                </svg>
                <span>Save to Pinterest</span>
              </button>

              <div className="flex items-center justify-between gap-2.5 mt-1">
                <button
                  onClick={() => handleShareClick("whatsapp")}
                  className="flex-1 flex h-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/5 text-white hover:bg-emerald-500 hover:text-white hover:scale-105 transition-all shadow-sm cursor-pointer"
                >
                  <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.455L0 24zm6.59-4.846c1.6.95 2.698 1.488 4.737 1.488 5.485 0 9.948-4.468 9.95-9.95.002-2.656-1.02-5.156-2.875-7.01C16.55 1.83 14.056.806 11.403.806c-5.49 0-9.953 4.468-9.955 9.95-.001 1.92.493 3.796 1.43 5.473l-.952 3.477 3.56-.934z" />
                  </svg>
                </button>

                <button
                  onClick={() => handleShareClick("twitter")}
                  className="flex-1 flex h-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/5 text-white hover:bg-[#1DA1F2] hover:text-white hover:scale-105 transition-all shadow-sm cursor-pointer"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </button>

                <button
                  onClick={() => handleShareClick("copy")}
                  className="flex-1 flex h-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/5 text-white hover:bg-purple-600 hover:text-white hover:scale-105 transition-all shadow-sm cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M13.5 10.5h-6a1.5 1.5 0 0 0-1.5 1.5v6a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5v-6a1.5 1.5 0 0 0-1.5-1.5z" />
                    <path d="M18 6.5h-6a1.5 1.5 0 0 0-1.5 1.5" />
                  </svg>
                </button>
              </div>
            </div>
            {copiedLink && (
              <p className="mt-3 text-[10px] text-emerald-400 font-bold uppercase tracking-wider leading-none animate-pulse">{t.linkCopied}</p>
            )}
          </div>
        </aside>

        {/* Right Column (Single Article Content Markup) */}
        <article className="prose prose-invert max-w-none order-1 lg:order-2 bg-gradient-to-b from-white/[0.02] to-transparent rounded-[32px] border border-white/10 p-6 sm:p-12 leading-relaxed text-white/85 backdrop-blur-md shadow-2xl relative">
          <div 
            ref={contentRef}
            className={cn(
              "relative overflow-hidden transition-all duration-500 ease-in-out",
              shouldCollapse && !isExpanded ? "max-h-[600px]" : "max-h-[none]"
            )}
          >
            <div className="space-y-6">
              
              {/* Editorial Lead Paragraph / Excerpt */}
              {article.excerpt && (
                <p className="text-xl leading-8 text-white/90 font-medium first-letter:text-6xl first-letter:font-black first-letter:text-[var(--color-primary)] first-letter:mr-3.5 first-letter:float-left first-letter:leading-none">
                  {article.excerpt}
                </p>
              )}

              {/* Custom Visual Illustrations inside Markdown context */}
              {article.visualType && (
                <ContentVisual type={article.visualType} />
              )}

              <div 
                className="prose prose-invert prose-sm max-w-none text-left break-words mt-8 text-white/80"
                dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(article.content) }}
              />
            </div>

            {/* Gradient Fading Overlay at the bottom */}
            {shouldCollapse && !isExpanded && (
              <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0e0e12] via-[#0e0e12]/80 to-transparent pointer-events-none z-20" />
            )}
          </div>

          {/* Toggle Button */}
          {shouldCollapse && (
            <div className="mt-8 flex justify-center relative z-30">
              <button
                onClick={() => {
                  if (isExpanded && typeof window !== "undefined") {
                    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                  setIsExpanded(!isExpanded);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-6 py-3 text-xs font-black uppercase tracking-wider text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-black transition-all duration-300 shadow-[0_0_15px_rgba(139,92,246,0.15)] hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>{isExpanded ? (t.showLess || "Show Less") : (t.readFullArticle || "Read Full Article")}</span>
                <svg 
                  className={cn("h-4 w-4 transition-transform duration-300", isExpanded ? "rotate-180" : "")} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth="3"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            </div>
          )}
        </article>
      </div>

      {/* Curated Products Section */}
      <div className="pt-12 border-t border-white/[0.08]">
        <FeaturedProductsSection featuredProducts={displayProducts} title="Trending Products To Shop" />
      </div>

      {/* Exclusive Coupons & Deals Section */}
      <section className="pt-12 border-t border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-3.5 py-1.5 text-[9px] font-black uppercase tracking-[0.24em] text-[var(--color-primary)]">
              Exclusive Savings
            </span>
            <h2 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
              Hot Coupons & Active Deals
            </h2>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Verified working discount codes</span>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          {displayCoupons.map((coupon, idx) => (
            <FeaturedCouponCard key={idx} coupon={coupon} index={idx} />
          ))}
        </div>
      </section>

      {/* Related Articles Banner */}
      <section className="pt-16 border-t border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-3.5 py-1.5 text-[9px] font-black uppercase tracking-[0.24em] text-[var(--color-primary)]">{t.moreFromOurJournal}</span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white uppercase break-words">
              {t.relatedArticles}
            </h2>
          </div>
          <Link href={buildCountryPath("/blog", countryCode)} className="text-xs font-black uppercase tracking-wider text-[var(--color-primary)] hover:text-white transition-colors">
            View All Articles →
          </Link>
        </div>

        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <Link href={buildCountryPath("/blog/state-of-coupon-codes-2026", countryCode)} className="group block">
            <div className="h-full rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent p-6 hover:border-[var(--color-primary)]/30 transition-all duration-300 hover:-translate-y-1 shadow-lg flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-primary)]">{t.catLatestData || "LATEST DATA"}</span>
                <h3 className="mt-4 text-lg font-black text-white group-hover:text-[var(--color-primary)] transition-colors leading-snug">
                  State of Coupon Codes in 2026: The E-commerce Shift
                </h3>
                <p className="mt-3 text-xs text-white/50 leading-relaxed line-clamp-3">
                  An in-depth analysis of how retail discount codes are evolving, tracking user conversion rates, and the rise of auto-apply checkout extensions.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">
                <span>Read Article</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>
          </Link>
          
          <Link href={buildCountryPath("/blog/coupon-statistics-2026", countryCode)} className="group block">
            <div className="h-full rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent p-6 hover:border-[var(--color-primary)]/30 transition-all duration-300 hover:-translate-y-1 shadow-lg flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-primary)]">{t.catLatestData || "LATEST DATA"}</span>
                <h3 className="mt-4 text-lg font-black text-white group-hover:text-[var(--color-primary)] transition-colors leading-snug">
                  Coupon Statistics 2026: The Ultimate Shopper Guide
                </h3>
                <p className="mt-3 text-xs text-white/50 leading-relaxed line-clamp-3">
                  A compilation of data detailing how global shoppers use codes, showing exactly which shopping categories offer the highest average savings this year.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">
                <span>Read Article</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>
          </Link>
        </div>
      </section>
 
      {/* Newsletter Signup Banner */}
      <section className="rounded-[40px] border border-white/10 bg-gradient-to-br from-[#12121a] via-[#0b0b0e] to-[#07070a] p-8 sm:p-14 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-[var(--color-primary)]/5 blur-[120px] pointer-events-none" />
        <div className="absolute left-1/4 top-0 h-60 w-60 rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />
        
        <div className="max-w-md relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-3.5 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
            {t.stayUpdated}
          </div>
          <h2 className="mt-5 text-2xl sm:text-3xl font-black tracking-tight text-white uppercase leading-tight">
            {t.findOutWhenWePublish}
          </h2>
          <p className="mt-3.5 text-xs leading-relaxed text-white/50">
            {t.subscribeDesc}
          </p>
        </div>

        <div className="w-full max-w-sm relative z-10 shrink-0">
          {subscribed ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center shadow-lg">
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 mx-auto flex items-center justify-center text-emerald-400 font-bold mb-3 shadow-inner">✓</div>
              <p className="text-sm font-bold text-emerald-400">{t.successSub}</p>
              <p className="mt-1 text-xs text-white/50">{t.successSubDesc}</p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSubscribed(true); }} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.subscribePlaceholder}
                className="flex-1 rounded-2xl border border-white/10 bg-black/60 px-5 py-4 text-xs text-white placeholder-white/20 focus:border-[var(--color-primary)]/50 focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:outline-none transition-all"
              />
              <button
                type="submit"
                className="rounded-2xl bg-gradient-to-r from-purple-600 to-[var(--color-primary)] hover:from-purple-700 hover:to-[var(--color-primary-hover)] px-6 py-4 text-xs font-black uppercase tracking-wider text-black transition duration-300 cursor-pointer shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-[1.02]"
              >
                {t.subscribeButton}
              </button>
            </form>
          )}
        </div>
      </section>

    </div>
  );
}
