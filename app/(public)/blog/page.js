"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getCountryCodeFromPathname, buildCountryPath } from "@/lib/countries";

// Custom premium SVG illustrations for blog post thumbnails
function ThumbnailGraphic({ type }) {
  const gridStyle = {
    backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
    backgroundSize: "20px 20px"
  };

  return (
    <div 
      className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-[#131318] to-[#08080a] shadow-inner animate-fade-in"
      style={gridStyle}
    >
      {/* Decorative top glow */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-primary)]/20 to-transparent" />

      {type === "wave" && (
        <div className="relative w-full h-full flex items-center justify-center">
          <svg className="w-4/5 h-2/3 text-[var(--color-primary)]/80 drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]" viewBox="0 0 100 40" fill="none">
            <path d="M 0,20 Q 10,5 20,20 T 40,20 T 60,35 T 80,10 T 100,20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 0,20 Q 10,5 20,20 T 40,20 T 60,35 T 80,10 T 100,20 L 100,40 L 0,40 Z" fill="url(#wave-gradient)" opacity="0.15" />
            <defs>
              <linearGradient id="wave-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute bottom-3 left-4 text-[9px] font-mono text-white/30">STATS.WAVEFORM_2026</div>
        </div>
      )}

      {type === "map" && (
        <div className="relative w-full h-full flex items-center justify-center">
          <svg className="w-3/5 h-3/5 text-white/20" viewBox="0 0 120 75" fill="none" stroke="currentColor" strokeWidth="1">
            {/* Outline map placeholder */}
            <path d="M10,25 C15,10 40,15 50,12 C60,10 80,5 90,8 C100,10 110,25 105,40 C100,55 90,65 75,70 C60,75 35,70 20,65 C10,60 5,45 10,25 Z" strokeDasharray="3 3" />
            {/* Target dots */}
            <circle cx="35" cy="28" r="4" fill="var(--color-primary)" className="animate-pulse" />
            <circle cx="75" cy="45" r="3" fill="var(--color-primary)" />
            <circle cx="92" cy="22" r="3" fill="var(--color-primary)" />
          </svg>
          <div className="absolute top-3 right-4 rounded bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 px-1.5 py-0.5 text-[8px] font-mono text-[var(--color-primary)]">US_MARKET</div>
        </div>
      )}

      {type === "stats-circles" && (
        <div className="flex items-center gap-6">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-[var(--color-primary)]/10 border-t-[var(--color-primary)] drop-shadow-[0_0_6px_rgba(139,92,246,0.2)]">
            <span className="text-xs font-black">35%</span>
          </div>
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/5 border-t-white/40">
            <span className="text-xs font-black text-white/80">50%</span>
          </div>
        </div>
      )}

      {type === "checkmark" && (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-[var(--color-primary)]">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <div className="absolute bottom-3 left-4 text-[9px] font-mono text-white/30">VERIFIED.VOUCHER_ENGINE</div>
        </div>
      )}

      {type === "gear" && (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-black/40 text-[var(--color-primary)]">
            <svg viewBox="0 0 24 24" className="h-6 w-6 animate-spin" style={{ animationDuration: "12s" }} fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.936 6.936 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.645-.869L9.594 3.94Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </div>
        </div>
      )}

      {type === "brands" && (
        <div className="relative w-full h-full flex items-center justify-center gap-6 text-white/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-xs font-black border border-white/5 uppercase">NIKE</div>
          <div className="text-[10px] font-mono text-white/20 uppercase font-black">VS</div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-xs font-black border border-white/5 uppercase">ADIDAS</div>
        </div>
      )}

      {type === "500k" && (
        <div className="text-center">
          <div className="text-3xl font-black tracking-tighter text-white">500,000+</div>
          <div className="text-[9px] font-black uppercase tracking-widest text-[var(--color-primary)] mt-1">Codes Tested</div>
        </div>
      )}

      {type === "78m" && (
        <div className="text-center">
          <div className="text-3xl font-black tracking-tighter text-white">78.8M</div>
          <div className="text-[9px] font-black uppercase tracking-widest text-white/40 mt-1">Global Users</div>
        </div>
      )}
    </div>
  );
}

const defaultUI = {
  ourJournal: "OUR JOURNAL",
  shoppingDecoded: "Shopping, Decoded.",
  journalSub: "Find our latest insights, data analyses, and shopping guides from the world of e-commerce, coupons, and retail trends.",
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
  successSub: "✓ Subscription Successful!",
  successSubDesc: "Thank you for subscribing. We will keep you updated.",
  readArticle: "Read article",
  read: "READ",
  by: "By",
  catAll: "All",
  catLatestData: "Latest Data",
  catStoreGuides: "Store Guides",
  catBestLists: "Best Lists",
  catDeepDives: "Deep Dives",
};

export default function BlogPage() {
  const pathname = usePathname();
  const countryCode = getCountryCodeFromPathname(pathname) || "US";

  const [posts, setPosts] = useState([]);
  const [ui, setUi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);

  const t = ui || defaultUI;

  const categories = ["All", "Latest Data", "Store Guides", "Best Lists", "Deep Dives"];
  const categoryLabels = {
    "All": t.catAll,
    "Latest Data": t.catLatestData,
    "Store Guides": t.catStoreGuides,
    "Best Lists": t.catBestLists,
    "Deep Dives": t.catDeepDives
  };

  // Fetch posts from API
  useEffect(() => {
    async function loadPosts() {
      try {
        const res = await fetch("/api/blog", { cache: "no-store" });
        if (!res.ok) throw new Error();
        const payload = await res.json();
        setPosts(payload.data || []);
        setUi(payload.ui || null);
      } catch {
        // Keep empty array
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  const currentCountry = String(countryCode || "US").toUpperCase();
  const countryScopedPosts = posts.filter(post => {
    const postCountry = String(post.countryCode || "GLOBAL").toUpperCase();
    return postCountry === "GLOBAL" || postCountry === currentCountry;
  });

  // Filtering logic
  const filteredPosts = countryScopedPosts.filter(post => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-12 px-5 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      
      {/* Header Section */}
      <section className="relative overflow-hidden rounded-[32px] border border-white/5 bg-[#09090b] p-8 sm:p-12 lg:p-16">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[var(--color-primary)]/5 blur-[120px] pointer-events-none" />
        <div className="max-w-2xl relative z-10">
          <span className="rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--color-primary)]">
            {t.ourJournal}
          </span>
          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-black tracking-[-0.05em] text-white leading-tight break-words">
            {t.shoppingDecoded}
          </h1>
          <p className="mt-4 text-base leading-7 text-white/50 sm:text-lg">
            {t.journalSub}
          </p>

          {/* Search bar inside header */}
          <div className="mt-8 max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 pl-11 text-sm text-white placeholder-white/30 focus:border-[var(--color-primary)]/50 focus:outline-none"
              />
              <svg className="absolute left-4 top-3.5 h-4.5 w-4.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex h-40 w-full items-center justify-center">
          <svg viewBox="0 0 24 24" className="h-6 w-6 animate-spin text-[var(--color-primary)]" fill="none">
            <circle cx="12" cy="12" r="9" className="stroke-current opacity-25" strokeWidth="3" />
            <path d="M21 12a9 9 0 0 0-9-9" className="stroke-current" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      ) : (
        <>
          {/* Featured / Hero Section (2 Columns) */}
          {searchQuery === "" && selectedCategory === "All" && countryScopedPosts.some(p => p.featured) && (
            <section className="grid gap-6 md:grid-cols-2 animate-fade-in">
              {countryScopedPosts.filter(p => p.featured).slice(0, 2).map((post) => (
                <Link 
                  href={buildCountryPath("/blog/" + post.slug, countryCode)} 
                  key={post.id} 
                  className="group flex flex-col hover:no-underline"
                >
                  <article 
                    className="w-full flex-1 flex flex-col rounded-3xl border border-white/5 bg-[#0e0e11] p-6 transition-all duration-300 hover:border-[var(--color-primary)]/30 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] cursor-pointer"
                  >
                    <ThumbnailGraphic type={post.thumbnailType} />
                    
                    <div className="mt-6 flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-primary)] bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10 px-2.5 py-0.5 rounded-md">
                        {categoryLabels[post.category] || post.category}
                      </span>
                      <span className="text-[11px] font-medium text-white/30">{post.date}</span>
                      <span className="text-[11px] font-medium text-white/30">• {post.readTime}</span>
                    </div>

                    <h2 className="mt-4 text-xl font-bold tracking-tight text-white group-hover:text-[var(--color-primary)] transition-colors leading-snug">
                      {post.title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-white/50 line-clamp-3">
                      {post.excerpt}
                    </p>

                    <div className="mt-6 pt-5 border-t border-white/[0.04] flex items-center justify-between">
                      <span className="text-xs font-bold text-white/60">{t.by} {post.author}</span>
                      <span className="text-xs font-bold text-[var(--color-primary)] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        {t.readArticle} <span className="text-sm">→</span>
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </section>
          )}

          {/* Category Pills Filter */}
          <section className="flex flex-wrap items-center gap-2 border-b border-white/[0.05] pb-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setVisibleCount(6); // reset pagination
                }}
                className={cn(
                  "rounded-full px-5 py-2 text-xs font-black uppercase tracking-wider transition duration-200 border cursor-pointer",
                  selectedCategory === cat
                    ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-black hover:bg-[var(--color-primary)]/90 shadow-[0_0_15px_rgba(139,92,246,0.25)]"
                    : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white"
                )}
              >
                {categoryLabels[cat] || cat}
              </button>
            ))}
          </section>

          {/* Grid Section */}
          <section>
            {filteredPosts.length > 0 ? (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredPosts.slice(0, visibleCount).map((post) => (
                    <Link 
                       href={buildCountryPath("/blog/" + post.slug, countryCode)} 
                      key={post.id} 
                      className="group flex flex-col hover:no-underline"
                    >
                      <article 
                        className="w-full flex-1 flex flex-col rounded-3xl border border-white/5 bg-[#0e0e11] p-5 transition-all duration-300 hover:border-[var(--color-primary)]/30 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] cursor-pointer"
                      >
                        <ThumbnailGraphic type={post.thumbnailType} />
                        
                        <div className="mt-5 flex items-center gap-3">
                          <span className="text-[9px] font-black uppercase tracking-wider text-[var(--color-primary)]">
                            {categoryLabels[post.category] || post.category}
                          </span>
                          <span className="text-[10px] text-white/30 font-medium">{post.date}</span>
                          <span className="text-[10px] text-white/30 font-medium">• {post.readTime}</span>
                        </div>

                        <h3 className="mt-3 text-base font-bold tracking-tight text-white group-hover:text-[var(--color-primary)] transition-colors leading-snug">
                          {post.title}
                        </h3>
                        <p className="mt-2.5 text-xs leading-relaxed text-white/40 line-clamp-3">
                          {post.excerpt}
                        </p>

                        <div className="mt-auto pt-5 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-white/40">{t.by} {post.author}</span>
                          <span className="text-[11px] font-black text-[var(--color-primary)] group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                            {t.read} <span className="text-sm">→</span>
                          </span>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>

                {/* Load More Button */}
                {filteredPosts.length > visibleCount && (
                  <div className="mt-12 text-center">
                    <button
                      onClick={() => setVisibleCount(prev => prev + 3)}
                      className="rounded-full border border-white/10 bg-white/[0.02] px-8 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-white/[0.06] hover:border-white/20 cursor-pointer"
                    >
                      {t.loadMore}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center bg-white/[0.01]">
                <svg className="mx-auto h-12 w-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
                </svg>
                <h3 className="mt-4 text-base font-bold text-white">{t.noArticlesFound}</h3>
                <p className="mt-2 text-xs text-white/40">{t.noArticlesDesc}</p>
              </div>
            )}
          </section>
        </>
      )}

      {/* Newsletter Signup Banner */}
      <section className="rounded-[32px] border border-white/5 bg-gradient-to-br from-[#0c0c0f] to-[#07070a] p-8 sm:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-[var(--color-primary)]/3 blur-[100px] pointer-events-none" />
        <div className="max-w-md relative z-10">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)]">{t.stayUpdated}</span>
          <h2 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white uppercase break-words">
            {t.findOutWhenWePublish}
          </h2>
          <p className="mt-2.5 text-xs leading-relaxed text-white/50">
            {t.subscribeDesc}
          </p>
        </div>

        <div className="w-full max-w-sm relative z-10 shrink-0">
          {subscribed ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-center">
              <p className="text-sm font-bold text-emerald-400">{t.successSub}</p>
              <p className="mt-1 text-xs text-white/50">{t.successSubDesc}</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.subscribePlaceholder}
                className="flex-1 rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-xs text-white placeholder-white/30 focus:border-[var(--color-primary)]/50 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] px-6 py-3 text-xs font-black uppercase tracking-wider text-black transition duration-200 cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.2)]"
              >
                {t.subscribeButton}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Understand the Engine Section */}
      <section className="pt-6 border-t border-white/[0.05]">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">{t.insideOurPlatform}</span>
        <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white uppercase break-words">
          {t.understandTheEngine}
        </h2>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/5 bg-[#0e0e11] p-6 hover:border-white/10 transition-colors">
            <span className="text-[9px] font-black uppercase tracking-wider text-[var(--color-primary)]">{t.validationSystem}</span>
            <h3 className="mt-3 text-lg font-bold text-white">{t.howItWorks}</h3>
            <p className="mt-2 text-xs leading-relaxed text-white/50">
              {t.validationDesc}
            </p>
            <Link href="/" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] hover:underline">
              {t.goHome}
            </Link>
          </div>

          <div className="rounded-3xl border border-white/5 bg-[#0e0e11] p-6 hover:border-white/10 transition-colors">
            <span className="text-[9px] font-black uppercase tracking-wider text-[var(--color-primary)]">{t.couponAnatomy}</span>
            <h3 className="mt-3 text-lg font-bold text-white">{t.anatomyOfVoucher}</h3>
            <p className="mt-2 text-xs leading-relaxed text-white/50">
              {t.anatomyDesc}
            </p>
            <Link href="/exclusive" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] hover:underline">
              {t.viewExclusiveDeals}
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
