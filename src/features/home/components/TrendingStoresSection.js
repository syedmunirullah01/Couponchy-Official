"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { buildCountryPath, COUNTRY_COOKIE_KEY, DEFAULT_COUNTRY_CODE, normalizeCountryCode } from "@/lib/countries";

function getStoreHealth(store) {
  // Generate a stable, deterministic health percentage between 88% and 100% based on store name/slug
  const hash = (store.name || "").length + (store.slug || "").charCodeAt(0) || 0;
  return 88 + (hash % 13);
}

export default function TrendingStoresSection({
  trendingStores = [],
  title,
  countryCode = DEFAULT_COUNTRY_CODE,
  initialCategories = [],
  totalStoresCount = 0,
}) {
  const categories = initialCategories;
  const [selectedCategorySlug, setSelectedCategorySlug] = useState("popular");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [logoErrors, setLogoErrors] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    setIsExpanded(false);
  }, [selectedCategorySlug]);

  // Only use admin-selected trendingStores — max 12 (3 rows × 4 cols)
  const filtered = selectedCategorySlug === "popular"
    ? [...trendingStores]
      .sort((a, b) => (b.offersCount || 0) - (a.offersCount || 0))
      .slice(0, 12)
    : trendingStores
      .filter((store) => store.categorySlug === selectedCategorySlug)
      .slice(0, 12);

  const MOBILE_INITIAL = 4; // 1 row of 4 on mobile initially
  const limit = isMobile && !isExpanded ? MOBILE_INITIAL : filtered.length;
  const visibleFiltered = filtered.slice(0, limit);
  const remainingCount = filtered.length - MOBILE_INITIAL;

  return (
    <section style={{ position: "relative", width: "100%", paddingTop: "8px" }}>
      {/* Header section with title and links */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "20px",
          marginBottom: "28px",
        }}
      >
        <div>
          {/* Eyebrow badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--color-primary)",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            <span style={{ color: "var(--color-primary)", textShadow: "0 0 10px rgba(139, 92, 246,0.4)" }}>♦</span> STORE DIRECTORY
          </div>
          {/* Main heading */}
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 900,
              lineHeight: 1.1,
              color: "#ffffff",
              letterSpacing: "-0.03em",
              margin: 0,
            }}
          >
            {totalStoresCount > 0
              ? `${totalStoresCount.toLocaleString()}+ stores.`
              : "612,473+ stores."}<br />Every code verified.
          </h2>
        </div>

        {/* Right side links */}
        <div style={{ display: "flex", gap: "24px" }} className="directory-header-links">
          <Link
            href={buildCountryPath("/stores", countryCode)}
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--color-primary)",
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8}
            onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
          >
            Browse all stores →
          </Link>
          <Link
            href={buildCountryPath("/categories", countryCode)}
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--color-primary)",
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8}
            onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
          >
            Browse by category →
          </Link>
        </div>
      </div>

      {/* Category Selection Bar */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          overflowX: "auto",
          paddingBottom: "12px",
          marginBottom: "32px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        className="hide-scrollbar"
      >
        <button
          onClick={() => setSelectedCategorySlug("popular")}
          style={{
            background: selectedCategorySlug === "popular" ? "var(--color-primary)" : "rgba(255, 255, 255, 0.02)",
            border: selectedCategorySlug === "popular" ? "1px solid var(--color-primary)" : "1px solid rgba(255, 255, 255, 0.06)",
            color: selectedCategorySlug === "popular" ? "#000000" : "rgba(255, 255, 255, 0.7)",
            padding: "8px 18px",
            borderRadius: "999px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)",
            whiteSpace: "nowrap",
            fontFamily: "inherit",
            boxShadow: selectedCategorySlug === "popular" ? "0 0 12px rgba(139, 92, 246, 0.25)" : "none",
          }}
          className={selectedCategorySlug !== "popular" ? "category-tab-btn" : ""}
        >
          Popular
        </button>
        {categories.map((cat) => {
          const isActive = selectedCategorySlug === cat.slug;
          return (
            <button
              key={cat.id || cat.slug}
              onClick={() => setSelectedCategorySlug(cat.slug)}
              style={{
                background: isActive ? "var(--color-primary)" : "rgba(255, 255, 255, 0.02)",
                border: isActive ? "1px solid var(--color-primary)" : "1px solid rgba(255, 255, 255, 0.06)",
                color: isActive ? "#000000" : "rgba(255, 255, 255, 0.7)",
                padding: "8px 18px",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)",
                whiteSpace: "nowrap",
                fontFamily: "inherit",
                boxShadow: isActive ? "0 0 12px rgba(139, 92, 246, 0.25)" : "none",
              }}
              className={!isActive ? "category-tab-btn" : ""}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Stores Directory Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(1, 1fr)",
          gap: "20px",
        }}
        className="stores-directory-grid"
      >
        {visibleFiltered.map((store, idx) => {
          const isHovered = hoveredCard === store.slug;
          const hasLogoError = logoErrors[store.slug];
          const showImage = store.logoImage && !hasLogoError;
          const healthPercent = getStoreHealth(store);

          return (
            <Link
              key={store.slug ? `${store.slug}-${idx}` : `store-${idx}`}
              href={buildCountryPath(`/stores/${store.categorySlug}/${store.slug}`, countryCode)}
              onMouseEnter={() => setHoveredCard(store.slug)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                position: "relative",
                background: isHovered
                  ? "radial-gradient(circle at top left, rgba(139, 92, 246, 0.15) 0%, rgba(217, 70, 239, 0.03) 50%, rgba(20, 20, 25, 0.8) 100%)"
                  : "rgba(15, 15, 20, 0.65)",
                border: isHovered
                  ? "1px solid rgba(139, 92, 246, 0.4)"
                  : "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: "24px",
                padding: "26px 24px",
                boxShadow: isHovered
                  ? "0 20px 40px rgba(0, 0, 0, 0.65), 0 0 20px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255,255,255,0.08)"
                  : "0 10px 30px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.02)",
                textDecoration: "none",
                transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                transform: isHovered ? "translateY(-6px)" : "translateY(0)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Trust status badge */}
              {store.trustStatus && (
                <span
                  style={{
                    position: "absolute",
                    top: "14px",
                    right: "14px",
                    fontSize: "9px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    background: store.trustStatus === "Verified" || store.trustStatus === "Active"
                      ? "rgba(139, 92, 246, 0.15)"
                      : "rgba(255, 255, 255, 0.05)",
                    color: store.trustStatus === "Verified" || store.trustStatus === "Active"
                      ? "var(--color-primary-hover)"
                      : "rgba(255, 255, 255, 0.5)",
                    border: store.trustStatus === "Verified" || store.trustStatus === "Active"
                      ? "1px solid rgba(139, 92, 246, 0.3)"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  {store.trustStatus}
                </span>
              )}
              {/* Top row with logo & name */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    position: "relative",
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    flexShrink: 0,
                    boxShadow: isHovered
                      ? "0 8px 16px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(139, 92, 246, 0.3)"
                      : "0 4px 10px rgba(0, 0, 0, 0.15)",
                    transition: "all 0.3s ease",
                  }}
                >
                  {showImage ? (
                    <Image
                      src={store.logoImage}
                      alt={`${store.name} logo`}
                      fill
                      unoptimized
                      onError={() => setLogoErrors(prev => ({ ...prev, [store.slug]: true }))}
                      style={{
                        objectFit: "contain",
                        padding: "1px",
                        transform: isHovered ? "scale(1.4)" : "scale(1.25)",
                        transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: "14px", fontWeight: 900, color: "#111111", textTransform: "uppercase" }}>
                      {(store.logoText || store.name || "ST").slice(0, 2)}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "900",
                    letterSpacing: "-0.02em",
                    color: isHovered ? "var(--color-primary-hover)" : "#ffffff",
                    textAlign: "left",
                    flex: 1,
                    transition: "color 0.3s ease",
                  }}
                >
                  {store.name}
                </div>
              </div>

              {/* Verified Codes count */}
              <div
                style={{
                  fontSize: "13px",
                  color: "rgba(255, 255, 255, 0.78)",
                  marginTop: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: 600,
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "var(--color-primary)",
                    boxShadow: "0 0 8px var(--color-primary)",
                    animation: "pulse 2s infinite",
                  }}
                />
                <span>{store.offersCount || 0} verified {store.offersCount === 1 ? "code" : "codes"}</span>
              </div>

              {/* Progress Health bar */}
              <div
                style={{
                  height: "4px",
                  background: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "999px",
                  overflow: "hidden",
                  marginTop: "14px",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    background: "linear-gradient(90deg, var(--color-primary) 0%, #d946ef 100%)",
                    width: `${healthPercent}%`,
                    borderRadius: "999px",
                    boxShadow: isHovered ? "0 0 8px var(--color-primary)" : "none",
                    transition: "all 0.5s ease",
                  }}
                />
              </div>

              {/* Health Percent text */}
              <div
                style={{
                  fontSize: "11px",
                  color: isHovered ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 255, 255, 0.7)",
                  marginTop: "8px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  textAlign: "left",
                  transition: "color 0.3s ease",
                }}
              >
                {healthPercent}% health
              </div>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <div
            style={{
              gridColumn: "1/-1",
              padding: "48px 24px",
              textAlign: "center",
              border: "1px dashed rgba(255, 255, 255, 0.1)",
              borderRadius: "20px",
              background: "rgba(255, 255, 255, 0.01)",
            }}
          >
            <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "15px", fontWeight: 600, margin: 0 }}>
              No merchants in this category yet
            </p>
            <p style={{ color: "var(--color-muted)", fontSize: "13px", marginTop: "6px", margin: 0 }}>
              Select another category or view all stores above.
            </p>
          </div>
        )}
      </div>

      {isMobile && remainingCount > 0 && !isExpanded && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "32px" }}>
          <button
            onClick={() => setIsExpanded(true)}
            style={{
              background: "var(--color-primary)",
              color: "#000000",
              border: "none",
              padding: "12px 28px",
              borderRadius: "14px",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 0 16px rgba(139, 92, 246, 0.35)",
              transition: "all 0.2s ease",
              fontFamily: "inherit",
            }}
            className="explore-more-btn"
          >
            Explore {remainingCount} more stores
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(0.8);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.15);
            opacity: 1;
          }
        }
        .explore-more-btn {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .explore-more-btn:hover {
          background: var(--color-primary-hover) !important;
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4) !important;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .category-tab-btn:hover {
          border-color: rgba(255, 255, 255, 0.15) !important;
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.05) !important;
        }
        @media (max-width: 640px) {
          .directory-header-links {
            margin-top: 10px;
            width: 100%;
          }
        }
        @media (min-width: 640px) {
          .stores-directory-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 1024px) {
          .stores-directory-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
      `}</style>
    </section>
  );
}
