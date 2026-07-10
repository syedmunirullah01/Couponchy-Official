"use client";

import Link from "next/link";
import { useState } from "react";
import { buildCountryPath } from "@/lib/countries";

export default function SitemapPage({ categories = [], stores = [], settings = {}, countryCode = "us" }) {
  const [searchQuery, setSearchQuery] = useState("");

  const siteName = settings.siteName || "Couponchy";

  // Group stores alphabetically
  const groupedStores = stores.reduce((acc, store) => {
    if (!store || !store.name) return acc;
    const firstLetter = store.name.charAt(0).toUpperCase();
    const groupKey = /[A-Z]/.test(firstLetter) ? firstLetter : "#";
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(store);
    return acc;
  }, {});

  // Sort alphabetical groups
  const sortedGroupKeys = Object.keys(groupedStores).sort((a, b) => {
    if (a === "#") return 1;
    if (b === "#") return -1;
    return a.localeCompare(b);
  });

  // Filter groups based on search query
  const filteredGroupKeys = sortedGroupKeys.filter((key) => {
    const groupMatches = groupedStores[key].some((store) =>
      store.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return searchQuery === "" || groupMatches;
  });

  return (
    <div style={{ color: "#fff", fontFamily: "inherit", overflow: "hidden" }}>
      {/* ── BACKGROUND GLOWS ────────────────────────────────────────── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-100px", left: "50%", transform: "translateX(-50%)", width: "900px", height: "500px", background: "radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1240px", margin: "0 auto", padding: "80px 24px 120px" }}>
        
        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "999px", padding: "6px 18px", marginBottom: "24px" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-primary)", boxShadow: "0 0 10px var(--color-primary)", display: "inline-block" }} />
            <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-primary)" }}>Directory Map</span>
          </div>
          <h1 style={{ fontSize: "clamp(38px, 5vw, 64px)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.04em", margin: "0 0 20px" }}>
            Sitemap
          </h1>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)", maxWidth: "560px", margin: "0 auto", lineHeight: 1.6, fontWeight: 500 }}>
            Quickly navigate Couponchy. Search for brand listings, browse deal categories, or locate general service pages.
          </p>
        </div>

        {/* ── SEARCH BAR ─────────────────────────────────────────────── */}
        <div style={{ maxWidth: "500px", margin: "0 auto 60px" }}>
          <div style={{ position: "relative", background: "rgba(15,15,20,0.6)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: "14px", padding: "6px", display: "flex", alignItems: "center" }}>
            <span style={{ padding: "0 12px", color: "rgba(255,255,255,0.4)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18 }}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search store in sitemap (e.g. Adidas)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "14px", width: "100%", padding: "8px 0" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "60px" }}>
          
          {/* SECTION 1: General Pages */}
          {searchQuery === "" && (
            <section style={{ scrollMarginTop: "100px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--color-primary)", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ height: "2px", width: "16px", background: "var(--color-primary)" }} /> General Pages
              </h2>
              <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(1, 1fr)" }} className="sitemap-pages-grid">
                {[
                  { name: "Homepage", href: "/", desc: "Verify working discount codes and view active store selections." },
                  { name: "Stores Directory", href: "/stores", desc: "Browse alphabetically all brand promo configurations." },
                  { name: "Categories", href: "/categories", desc: "Discover collections grouped by shopping interests." },
                  { name: "About Us", href: "/about", desc: "Learn about the Couponchy promise and automated verification." },
                  { name: "Contact Us", href: "/contact", desc: "Submit queries, advertise, or send manual coupon configurations." },
                  { name: "Privacy Policy", href: "/privacy-policy", desc: "Read our rules concerning your personal cookies and data." },
                  { name: "Terms of Service", href: "/terms-of-service", desc: "Examine licensing rules and obligations of website usage." },
                ].map((item) => (
                  <Link key={item.href} href={buildCountryPath(item.href, countryCode)} style={{ background: "rgba(15,15,20,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "18px", padding: "24px", textDecoration: "none", display: "block", transition: "all 0.3s" }}
                    onMouseEnter={e => { e.currentTarget.style.border = "1px solid rgba(139,92,246,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.05)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 4px", color: "#fff" }}>{item.name}</h3>
                    <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", margin: 0, fontWeight: 500 }}>{item.desc}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 2: Dynamic Categories */}
          {searchQuery === "" && categories.length > 0 && (
            <section style={{ scrollMarginTop: "100px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--color-primary)", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ height: "2px", width: "16px", background: "var(--color-primary)" }} /> Deal Categories
              </h2>
              <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(2, 1fr)" }} className="sitemap-categories-grid">
                {categories.map((cat) => (
                  <Link key={cat.slug} href={buildCountryPath(`/stores?category=${cat.slug}`, countryCode)} style={{ background: "rgba(15,15,20,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "18px", padding: "20px 24px", textDecoration: "none", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.3s" }}
                    onMouseEnter={e => { e.currentTarget.style.border = "1px solid rgba(139,92,246,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.05)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                    <span style={{ fontSize: "15px", fontWeight: 800, color: "#fff" }}>{cat.name}</span>
                    <span style={{ fontSize: "11px", fontWeight: 800, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "var(--color-primary)", padding: "4px 10px", borderRadius: "999px" }}>Explore</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 3: Dynamic Alphabetical Stores List */}
          <section style={{ scrollMarginTop: "100px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--color-primary)", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ height: "2px", width: "16px", background: "var(--color-primary)" }} /> Alphabetical Stores Directory
            </h2>

            {filteredGroupKeys.length === 0 ? (
              <div style={{ background: "rgba(15,15,20,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "48px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                No stores found matching your search.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                {filteredGroupKeys.map((key) => {
                  const matchingStores = groupedStores[key].filter((store) =>
                    store.name.toLowerCase().includes(searchQuery.toLowerCase())
                  );

                  return (
                    <div key={key} style={{ display: "grid", gap: "20px", gridTemplateColumns: "1fr" }} className="sitemap-group-row">
                      {/* Letter indicator */}
                      <div style={{ fontSize: "36px", fontWeight: 900, color: "var(--color-primary)", lineHeight: 1, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "10px" }}>
                        {key}
                      </div>

                      {/* Store lists in group */}
                      <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "repeat(2, 1fr)" }} className="sitemap-stores-subgrid">
                        {matchingStores.map((store) => (
                          <Link
                            key={store.slug}
                            href={buildCountryPath(`/stores/${store.categorySlug || "uncategorized"}/${store.slug}`, countryCode)}
                            style={{
                              fontSize: "14px",
                              fontWeight: 700,
                              color: "rgba(255,255,255,0.65)",
                              textDecoration: "none",
                              transition: "color 0.2s",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = "var(--color-primary)"}
                            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.65)"}
                          >
                            <span style={{ color: "var(--color-primary)", fontSize: "10px" }}>♦</span>
                            {store.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </div>

      </div>

      <style>{`
        .sitemap-pages-grid {
          grid-template-columns: 1fr !important;
        }
        .sitemap-categories-grid {
          grid-template-columns: 1fr !important;
        }
        .sitemap-group-row {
          grid-template-columns: 1fr !important;
        }
        .sitemap-stores-subgrid {
          grid-template-columns: 1fr !important;
        }
        @media (min-width: 640px) {
          .sitemap-pages-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .sitemap-categories-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .sitemap-stores-subgrid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 1024px) {
          .sitemap-pages-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .sitemap-categories-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .sitemap-group-row {
            grid-template-columns: 100px 1fr !important;
          }
          .sitemap-stores-subgrid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
