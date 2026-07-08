"use client";

import { useParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getCountryCodeFromPathname, buildCountryPath } from "@/lib/countries";

// Reusable custom visual illustrations matching the articles
function ContentVisual({ type }) {
  const gridStyle = {
    backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
    backgroundSize: "20px 20px"
  };

  if (type === "verification-ui") {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black p-5 my-8" style={gridStyle}>
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-primary)]/30 to-transparent" />
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono text-white/55">VERIFIER_AGENT_ACTIVE</span>
          </div>
          <span className="text-[9px] font-mono text-[var(--color-primary)]">STATUS: 200_OK</span>
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-white/45">Target Merchant:</span>
            <span className="text-white">Waterdrop Store</span>
          </div>
          <div className="flex justify-between text-xs font-mono">
            <span className="text-white/45">Coupon Code Checked:</span>
            <span className="text-[var(--color-primary)] font-bold tracking-wider">SAVE15</span>
          </div>
          <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 font-mono text-[10px] text-emerald-400">
            {`>> Initiating checkout validation simulation...`}
            <br />
            {`>> Cart status: verified. Discount applied successfully!`}
          </div>
        </div>
      </div>
    );
  }

  if (type === "phone-mockup") {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#111115] to-[#070709] p-6 my-8 flex justify-center">
        <div className="w-[180px] rounded-[32px] border-4 border-white/10 bg-black p-3.5 shadow-2xl">
          {/* Speaker / Notch */}
          <div className="mx-auto mb-3 h-3 w-12 rounded-full bg-white/10" />
          {/* Inner Content */}
          <div className="rounded-[20px] bg-[#0c0c0e] p-2 text-center border border-white/5">
            <div className="h-6 w-6 rounded-full bg-[var(--color-primary)]/20 mx-auto flex items-center justify-center text-[var(--color-primary)] text-[8px] font-black">✓</div>
            <div className="text-[10px] font-black text-white mt-1.5">Coupon Applied!</div>
            <div className="text-[8px] text-white/40 mt-0.5">You saved $24.50</div>
            <div className="mt-3 border-t border-dashed border-white/10 pt-2.5">
              <span className="text-[8px] font-mono block text-white/30">DISCOUNT CODE</span>
              <span className="text-xs font-mono font-black text-[var(--color-primary)] tracking-widest block mt-0.5">EXTRA20</span>
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
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.*?)_/g, "<em>$1</em>");

  // Images
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, "<div class='my-6 rounded-2xl overflow-hidden border border-white/8 bg-black/40 p-2 shadow-lg max-w-2xl mx-auto'><img src='$2' alt='$1' class='w-full h-auto object-cover rounded-xl' /></div>");

  // Headings
  html = html.replace(/^### (.*?)$/gm, "<h3 class='text-base font-bold text-white mt-5 mb-2.5'>$1</h3>");
  html = html.replace(/^## (.*?)$/gm, "<h2 class='text-xl font-extrabold text-white mt-8 mb-4 border-l-4 border-[var(--color-primary)] pl-3'>$1</h2>");
  html = html.replace(/^# (.*?)$/gm, "<h1 class='text-2xl font-black text-white mt-10 mb-5 border-b border-white/5 pb-2'>$1</h1>");

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2' target='_blank' class='text-[var(--color-primary)] hover:underline'>$1</a>");

  // Lists
  html = html.replace(/^\s*-\s+(.*?)$/gm, "<li class='list-disc ml-6 my-1.5 text-white/70'>$1</li>");
  html = html.replace(/^\s*\*\s+(.*?)$/gm, "<li class='list-disc ml-6 my-1.5 text-white/70'>$1</li>");

  // Convert line breaks to paragraphs
  const paragraphs = html.split(/\n\n+/);
  return paragraphs
    .map(p => {
      const trimmed = p.trim();
      if (trimmed.startsWith("<h") || trimmed.startsWith("<li") || trimmed.startsWith("<div")) {
        return p;
      }
      return `<p class="leading-relaxed text-white/70 mb-4">${p.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const pathname = usePathname();
  const countryCode = getCountryCodeFromPathname(pathname) || "US";

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeHeading, setActiveHeading] = useState("");

  // Fetch article dynamically from API
  useEffect(() => {
    async function loadArticle() {
      try {
        const res = await fetch(`/api/blog/${slug}`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Unable to load article parameters.");
        }
        const payload = await res.json();
        setArticle(payload.data);
      } catch (err) {
        setError(err.message || "Article not found.");
      } finally {
        setLoading(false);
      }
    }
    if (slug) {
      loadArticle();
    }
  }, [slug]);

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

  // Generate headings automatically from article content for table of contents
  const headings = article?.content
    ? [
      { id: "introduction", label: "Introduction" },
      ...(article.content.includes("Shift") || article.content.includes("E-commerce")
        ? [{ id: "market-shift", label: "Market Insights" }]
        : []),
      { id: "detailed-analysis", label: "Analysis Detail" },
      { id: "conclusion", label: "Conclusion" }
    ]
    : [];

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
          BLOG
        </Link>
        <span>/</span>
        <span className="text-white/60 truncate">{article.title}</span>
      </nav>

      {/* Hero Split Section */}
      <section className="relative overflow-hidden rounded-[32px] border border-white/5 bg-[#09090b] p-8 sm:p-12 lg:p-14 grid gap-8 md:grid-cols-[1fr_260px] items-center">
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-[var(--color-primary)]/5 blur-[120px] pointer-events-none" />
        <div className="relative z-10">
          <span className="rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--color-primary)]">
            {article.category}
          </span>
          <h1 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-black tracking-[-0.05em] text-white leading-tight">
            {article.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold text-white/50">
            <span className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/30 flex items-center justify-center text-[9px] font-bold text-[var(--color-primary)]">
                {article.author?.slice(0, 2)}
              </div>
              <span className="text-white/80">{article.author}</span>
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
            <span>{article.date}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
            <span>{article.readTime}</span>
          </div>
        </div>

        {/* Thumbnail Visual Container */}
        <div className="hidden md:block">
          <div className="relative aspect-square w-full rounded-2xl border border-white/10 bg-black/60 flex items-center justify-center p-6 shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/[0.04] to-transparent pointer-events-none" />
            {article.thumbnailType === "wave" ? (
              <svg className="w-4/5 h-2/3 text-[var(--color-primary)]/80 drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]" viewBox="0 0 100 40" fill="none">
                <path d="M 0,20 Q 10,5 20,20 T 40,20 T 60,35 T 80,10 T 100,20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            ) : (
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-[var(--color-primary)]/10 border-t-[var(--color-primary)] drop-shadow-[0_0_6px_rgba(139,92,246,0.2)]">
                <span className="text-xs font-black">35%</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Page Layout (Two Columns) */}
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">

        {/* Sticky Left Sidebar (Outline and Author details) */}
        <aside className="lg:sticky lg:top-24 lg:self-start space-y-8 order-2 lg:order-1">
          {/* Author Card */}
          <div className="rounded-2xl border border-white/5 bg-[#0e0e11] p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/30 flex items-center justify-center text-xs font-bold text-[var(--color-primary)]">
                {article.author?.slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">{article.author}</p>
                <p className="text-[10px] text-white/40 mt-1 font-semibold leading-none">{article.authorRole}</p>
              </div>
            </div>
          </div>

          {/* Table of Contents */}
          {headings.length > 0 && (
            <div className="rounded-2xl border border-white/5 bg-[#0e0e11] p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Table of Contents</p>
              <nav className="mt-4 flex flex-col gap-3">
                {headings.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    className={cn(
                      "text-xs font-bold transition-all duration-200 border-l-2 pl-3 py-0.5",
                      activeHeading === heading.id
                        ? "border-[var(--color-primary)] text-white font-semibold pl-4"
                        : "border-transparent text-white/40 hover:text-white"
                    )}
                  >
                    {heading.label}
                  </a>
                ))}
              </nav>
            </div>
          )}

          {/* Share Block */}
          <div className="rounded-2xl border border-white/5 bg-[#0e0e11] p-5 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Share this article</p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={() => handleShareClick("whatsapp")}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white hover:scale-110 transition-all shadow-md cursor-pointer"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.455L0 24zm6.59-4.846c1.6.95 2.698 1.488 4.737 1.488 5.485 0 9.948-4.468 9.95-9.95.002-2.656-1.02-5.156-2.875-7.01C16.55 1.83 14.056.806 11.403.806c-5.49 0-9.953 4.468-9.955 9.95-.001 1.92.493 3.796 1.43 5.473l-.952 3.477 3.56-.934z" />
                </svg>
              </button>
              <button
                onClick={() => handleShareClick("twitter")}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1DA1F2] text-white hover:scale-110 transition-all shadow-md cursor-pointer"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </button>
              <button
                onClick={() => handleShareClick("copy")}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:scale-110 transition-all shadow-md cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M13.5 10.5h-6a1.5 1.5 0 0 0-1.5 1.5v6a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5v-6a1.5 1.5 0 0 0-1.5-1.5z" />
                  <path d="M18 6.5h-6a1.5 1.5 0 0 0-1.5 1.5" />
                </svg>
              </button>
            </div>
            {copiedLink && (
              <p className="mt-2 text-[10px] text-emerald-400 font-bold uppercase tracking-wider leading-none">Link Copied!</p>
            )}
          </div>
        </aside>

        {/* Right Column (Single Article Content Markup) */}
        <article className="prose prose-invert max-w-none order-1 lg:order-2 bg-[#0e0e11] rounded-3xl border border-white/5 p-6 sm:p-10 leading-relaxed text-white/70">
          <div className="space-y-6">
            {article.excerpt && (
              <p className="text-lg leading-8 text-white/80 font-medium first-letter:text-5xl first-letter:font-black first-letter:text-[var(--color-primary)] first-letter:mr-3 first-letter:float-left">
                {article.excerpt}
              </p>
            )}

            <div 
              className="prose prose-invert prose-sm max-w-none text-left break-words mt-6 text-white/75"
              dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(article.content) }}
            />
          </div>
        </article>
      </div>

      {/* Related Articles Banner */}
      <section className="pt-10 border-t border-white/[0.05]">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">MORE FROM OUR JOURNAL</span>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-white uppercase">
          Related Articles
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <Link href={buildCountryPath("/blog/state-of-coupon-codes-2026", countryCode)} className="group block">
            <div className="rounded-2xl border border-white/5 bg-[#0e0e11] p-5 hover:border-[var(--color-primary)]/30 transition-colors">
              <span className="text-[9px] font-black uppercase tracking-wider text-[var(--color-primary)]">Latest Data</span>
              <h3 className="mt-3 text-base font-bold text-white group-hover:text-[var(--color-primary)] transition-colors">
                State of Coupon Codes in 2026: The E-commerce Shift
              </h3>
              <p className="mt-2 text-xs text-white/40 leading-relaxed line-clamp-2">
                An in-depth analysis of how retail discount codes are evolving, tracking user conversion rates, and the rise of auto-apply checkout extensions.
              </p>
            </div>
          </Link>
          <Link href={buildCountryPath("/blog/coupon-statistics-2026", countryCode)} className="group block">
            <div className="rounded-2xl border border-white/5 bg-[#0e0e11] p-5 hover:border-[var(--color-primary)]/30 transition-colors">
              <span className="text-[9px] font-black uppercase tracking-wider text-[var(--color-primary)]">Latest Data</span>
              <h3 className="mt-3 text-base font-bold text-white group-hover:text-[var(--color-primary)] transition-colors">
                Coupon Statistics 2026: The Ultimate Shopper Guide
              </h3>
              <p className="mt-2 text-xs text-white/40 leading-relaxed line-clamp-2">
                A compilation of data detailing how global shoppers use codes, showing exactly which shopping categories offer the highest average savings this year.
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Newsletter Signup Banner */}
      <section className="rounded-[32px] border border-white/5 bg-gradient-to-br from-[#0c0c0f] to-[#07070a] p-8 sm:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-[var(--color-primary)]/3 blur-[100px] pointer-events-none" />
        <div className="max-w-md relative z-10">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)]">STAY UPDATED</span>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white uppercase">
            Find out when we publish.
          </h2>
          <p className="mt-2.5 text-xs leading-relaxed text-white/50">
            Subscribe to our newsletter to receive the latest e-commerce insights, discount code trends, and data reports directly in your inbox.
          </p>
        </div>

        <div className="w-full max-w-sm relative z-10 shrink-0">
          {subscribed ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-center">
              <p className="text-sm font-bold text-emerald-400">✓ Subscription Successful!</p>
              <p className="mt-1 text-xs text-white/50">Thank you for subscribing. We will keep you updated.</p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSubscribed(true); }} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address..."
                className="flex-1 rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-xs text-white placeholder-white/30 focus:border-[var(--color-primary)]/50 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] px-6 py-3 text-xs font-black uppercase tracking-wider text-black transition duration-200 cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.2)]"
              >
                SUBSCRIBE
              </button>
            </form>
          )}
        </div>
      </section>

    </div>
  );
}
