"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { startTransition, useEffect, useRef, useState } from "react";
import { buildCountryPath, COUNTRY_COOKIE_KEY, DEFAULT_COUNTRY_CODE, normalizeCountryCode } from "@/lib/countries";

function isExactStoreMatch(store, query) {
  return [store.name, store.slug].filter(Boolean).some((value) => value.trim().toLowerCase() === query);
}

const COUPON_CARDS = [
  {
    id: 1,
    amount: "20% OFF",
    max: "MAX $20.00",
    category: "VAULT",
    title: "Christmas Week Discount",
    tag: "EXPIRES 03/17",
    verified: false,
    rotation: "rotate(-6deg) translate(0px, 0px)",
    mobileRotation: "rotate(-4deg)",
    zIndex: 1,
  },
  {
    id: 2,
    amount: "$50 OFF",
    max: "MAX $20.00",
    category: "TECH",
    title: "Premium Electronics Sitewide",
    tag: "VERIFIED TODAY",
    verified: true,
    rotation: "rotate(3deg) translate(40px, 60px)",
    mobileRotation: "rotate(2deg)",
    zIndex: 2,
  },
  {
    id: 3,
    amount: "15% OFF",
    max: "NO MINIMUM",
    category: "SNEAKS",
    title: "Exclusive Member Deal",
    tag: "EXPIRES 04/02",
    verified: false,
    rotation: "rotate(-2deg) translate(70px, 130px)",
    mobileRotation: "rotate(-1deg)",
    zIndex: 3,
  },
];

const STAT_ICONS = {
  package: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="M22 12H2" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  dollar: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
};

const STATS = [
  {
    value: null, // filled dynamically from totalStoresCount
    label: "Stores Verified",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    value: "98%",
    label: "Accuracy Rate",
    accent: true,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    value: "4.6M+",
    label: "Monthly Verifications",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="M22 12H2" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    value: "$1B+",
    label: "Saved at Checkout",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function VerifiedIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor">
      <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.646 6.354-4 4a.5.5 0 0 1-.707 0l-2-2a.5.5 0 0 1 .707-.707L7.293 9.293l3.647-3.647a.5.5 0 0 1 .707.707z" />
    </svg>
  );
}

function PulseIcon() {
  return (
    <span className="relative flex h-2 w-2">
      <span
        className="absolute inline-flex h-full w-full rounded-full opacity-75"
        style={{
          background: "var(--color-primary)",
          animation: "ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite",
        }}
      />
      <span
        className="relative inline-flex h-2 w-2 rounded-full"
        style={{ background: "var(--color-primary)" }}
      />
    </span>
  );
}

function formatStoreCount(count) {
  if (!count) return "0";
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M+`;
  if (count >= 1000) return `${Math.floor(count / 1000)}K+`;
  return `${count}+`;
}

export default function HeroSection({ hero, countryCode = DEFAULT_COUNTRY_CODE, totalStoresCount = 0 }) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [stores, setStores] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const cards = hero?.cards?.length ? hero.cards : COUPON_CARDS;
  const stats = hero?.stats?.length ? hero.stats : STATS;

  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [logoErrors, setLogoErrors] = useState({});
  const [hoveredStat, setHoveredStat] = useState(null);
  const dropdownRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function loadStores() {
      try {
        const res = await fetch(`/api/stores?country=${countryCode}`, { cache: "no-store" });
        const payload = await res.json();
        if (!cancelled) setStores(Array.isArray(payload.data) ? payload.data : []);
      } catch {
        if (!cancelled) setStores([]);
      }
    }
    loadStores();
    return () => { cancelled = true; };
  }, [countryCode]);

  const query = searchValue.trim().toLowerCase();
  const filteredStores = query
    ? stores
      .filter((store) =>
        store.name.toLowerCase().includes(query) ||
        store.slug.toLowerCase().includes(query)
      )
      .slice(0, 6)
    : [];

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !formRef.current?.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleSelectStore(store) {
    setShowDropdown(false);
    setSearchValue(store.name);
    router.push(buildCountryPath(`/stores/${store.categorySlug}/${store.slug}`, countryCode));
  }

  function handleKeyDown(e) {
    if (!showDropdown || filteredStores.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % filteredStores.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + filteredStores.length) % filteredStores.length);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    } else if (e.key === "Enter") {
      if (focusedIndex >= 0 && focusedIndex < filteredStores.length) {
        e.preventDefault();
        handleSelectStore(filteredStores[focusedIndex]);
      }
    }
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    const rawQuery = searchValue.trim();
    const query = rawQuery.toLowerCase();
    if (!query) {
      router.push(buildCountryPath("/stores", countryCode));
      return;
    }
    const matchedStore = stores.find((store) => isExactStoreMatch(store, query));
    if (matchedStore) {
      router.push(buildCountryPath(`/stores/${matchedStore.categorySlug}/${matchedStore.slug}`, countryCode));
      return;
    }
    router.push(`${buildCountryPath("/stores", countryCode)}?search=${encodeURIComponent(rawQuery)}`);
  }

  const headline = hero?.titleLineOne || "Find Coupons";
  const accent = hero?.titleAccent || "That Actually Save";
  const subtext = hero?.description || "Access verified, working discount codes. Stop wasting time with expired links and start saving instantly.";
  const eyebrow = hero?.eyebrow || "Real-Time Code Verification";
  const searchPlaceholder = "Search any store (e.g. nike.com)";
  const popularTags = ["Adidas", "J.Crew", "Sephora", "Crocs", "Abercrombie", "ASUS"];

  const dynamicPopularStores = stores.length > 0
    ? [...stores]
        .sort((a, b) => (b.offersCount || 0) - (a.offersCount || 0))
        .slice(0, 6)
    : [];


  // Build stats: replace null (Stores Verified) with live count
  const storeCountLabel = formatStoreCount(totalStoresCount);
  const displayStats = (hero?.stats?.length ? hero.stats : STATS).map((stat) =>
    stat.value === null ? { ...stat, value: storeCountLabel } : stat
  );

  return (
    <section suppressHydrationWarning style={{ position: "relative", overflow: "hidden" }}>

      {/* Grid background pattern */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Glow blob */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-120px",
          left: "-80px",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(139, 92, 246,0.09) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "48px",
            alignItems: "center",
            paddingTop: "40px",
            paddingBottom: "16px",
          }}
          className="hero-grid"
        >
          {/* LEFT: Text content */}
          <div style={{ maxWidth: "640px" }}>
            {/* Eyebrow badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(139, 92, 246,0.08)",
                border: "1px solid rgba(139, 92, 246,0.18)",
                borderRadius: "999px",
                padding: "6px 14px",
                marginBottom: "28px",
                animation: "fadeSlideDown 0.6s cubic-bezier(0.22,1,0.36,1) forwards",
              }}
            >
              <PulseIcon />
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--color-primary)",
                }}
              >
                {eyebrow}
              </span>
            </div>

            {/* Main headline */}
            <h1
              style={{
                fontSize: "clamp(44px, 6vw, 76px)",
                fontWeight: 900,
                lineHeight: 0.92,
                letterSpacing: "-0.04em",
                color: "#ffffff",
                margin: 0,
                marginBottom: "8px",
                animation: "fadeSlideUp 0.7s 0.1s cubic-bezier(0.22,1,0.36,1) both",
              }}
            >
              {headline}
              <br />
              <span style={{ color: "var(--color-primary)" }}>{accent}</span>
              <br />
              <span style={{ color: "#ffffff" }}>You Money.</span>
            </h1>

            {/* Subtext */}
            <p
              style={{
                marginTop: "24px",
                fontSize: "16px",
                lineHeight: 1.75,
                color: "var(--color-muted)",
                maxWidth: "460px",
                animation: "fadeSlideUp 0.7s 0.2s cubic-bezier(0.22,1,0.36,1) both",
              }}
            >
              {subtext}
            </p>

            {/* Search bar */}
            <form
              ref={formRef}
              onSubmit={handleSearchSubmit}
              style={{
                marginTop: "36px",
                display: "flex",
                alignItems: "center",
                gap: "0",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(139, 92, 246,0.16)",
                borderRadius: "14px",
                padding: "6px",
                maxWidth: "540px",
                backdropFilter: "blur(12px)",
                animation: "fadeSlideUp 0.7s 0.3s cubic-bezier(0.22,1,0.36,1) both",
                position: "relative",
                zIndex: 50,
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flex: 1,
                  padding: "8px 14px",
                  color: "var(--color-muted)",
                  cursor: "text",
                }}
              >
                <SearchIcon />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onKeyDown={handleKeyDown}
                  placeholder={searchPlaceholder}
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "#fff",
                    fontSize: "15px",
                    width: "100%",
                    fontFamily: "inherit",
                  }}
                />
              </label>
              <button
                type="submit"
                className="group/btn"
                style={{
                  background: "var(--color-primary)",
                  color: "#000",
                  border: "none",
                  borderRadius: "10px",
                  padding: "12px 22px",
                  fontWeight: 800,
                  fontSize: "14px",
                  letterSpacing: "0.02em",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "background 0.2s, transform 0.15s",
                  fontFamily: "inherit",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-primary-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-primary)"; }}
              >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover/btn:translate-x-full" />
                <span className="relative z-10">Search Brand →</span>
              </button>

              {/* Suggestions Dropdown */}
              {showDropdown && filteredStores.length > 0 && (
                <div
                  ref={dropdownRef}
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: "8px",
                    background: "#0c0c0c",
                    border: "1px solid rgba(139, 92, 246, 0.18)",
                    borderRadius: "12px",
                    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.95), inset 0 1px 0 rgba(255,255,255,0.05)",
                    overflow: "hidden",
                    zIndex: 100,
                    padding: "6px 0",
                  }}
                >
                  {filteredStores.map((store, index) => {
                    const isFocused = index === focusedIndex;
                    const hasLogoError = logoErrors[store.slug];
                    const showImage = store.logoImage && !hasLogoError;

                    return (
                      <div
                        key={store.id || store.slug}
                        onClick={() => handleSelectStore(store)}
                        onMouseEnter={() => setFocusedIndex(index)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "10px 16px",
                          cursor: "pointer",
                          background: isFocused ? "rgba(139, 92, 246, 0.08)" : "transparent",
                          borderLeft: isFocused ? "3px solid var(--color-primary)" : "3px solid transparent",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {/* Logo image or text initials fallback */}
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            background: "rgba(255, 255, 255, 0.04)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                          }}
                        >
                          {showImage ? (
                            <Image
                              src={store.logoImage}
                              alt={`${store.name} logo`}
                              width={36}
                              height={36}
                              unoptimized
                              onError={() => setLogoErrors(prev => ({ ...prev, [store.slug]: true }))}
                              style={{
                                objectFit: "contain",
                                padding: "4px",
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 900,
                                color: "var(--color-primary)",
                                textTransform: "uppercase",
                              }}
                            >
                              {(store.logoText || store.name || "ST").slice(0, 2)}
                            </span>
                          )}
                        </div>

                        {/* Name and category/type */}
                        <div style={{ flex: 1, textAlign: "left" }}>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 700,
                              color: isFocused ? "var(--color-primary)" : "#ffffff",
                              transition: "color 0.15s ease",
                            }}
                          >
                            {store.name}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--color-muted)", marginTop: "2px" }}>
                            {store.category || "Store"}
                          </div>
                        </div>

                        {/* Offers/Deals Count Badge */}
                        {store.offersCount > 0 && (
                          <div
                            style={{
                              fontSize: "10px",
                              fontWeight: 800,
                              background: "rgba(139, 92, 246, 0.12)",
                              color: "var(--color-primary)",
                              padding: "4px 10px",
                              borderRadius: "999px",
                              border: "1px solid rgba(139, 92, 246, 0.15)",
                            }}
                          >
                            {store.offersCount} {store.offersCount === 1 ? 'Code' : 'Codes'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </form>

            {/* Popular tags */}
            <div
              style={{
                marginTop: "18px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
                animation: "fadeSlideUp 0.7s 0.4s cubic-bezier(0.22,1,0.36,1) both",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.4)",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginRight: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    color: "var(--color-primary)",
                    filter: "drop-shadow(0 0 4px rgba(139, 92, 246,0.4))",
                  }}
                >
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                Popular Stores:
              </span>
              {dynamicPopularStores.length > 0 ? (
                dynamicPopularStores.map((store) => (
                  <button
                    key={store.slug}
                    type="button"
                    onClick={() => {
                      setSearchValue(store.name);
                      router.push(buildCountryPath(`/stores/${store.categorySlug}/${store.slug}`, countryCode));
                    }}
                    className="popular-tag-btn"
                  >
                    {store.name}
                  </button>
                ))
              ) : (
                popularTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSearchValue(tag);
                      router.push(`${buildCountryPath("/stores", countryCode)}?search=${encodeURIComponent(tag)}`);
                    }}
                    className="popular-tag-btn"
                  >
                    {tag}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: Floating coupon cards */}
          <div
            className="hero-cards-area"
            style={{
              position: "relative",
              height: "340px",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              animation: "fadeIn 0.9s 0.2s cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            {cards.map((card, i) => (
              <div
                key={card.id}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  position: "absolute",
                  top: `${i * 52}px`,
                  left: `${i * 18}px`,
                  width: "260px",
                  background: "rgba(17,17,17,0.92)",
                  border: `1px solid ${hoveredCard === card.id ? "rgba(139, 92, 246,0.4)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: "18px",
                  padding: "20px",
                  backdropFilter: "blur(20px)",
                  transform: hoveredCard === card.id ? "scale(1.04) rotate(0deg) translateY(-6px)" : card.rotation,
                  transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)",
                  cursor: "default",
                  zIndex: hoveredCard === card.id ? 10 : card.zIndex,
                  boxShadow: hoveredCard === card.id
                    ? "0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(139, 92, 246,0.2)"
                    : "0 12px 40px rgba(0,0,0,0.4)",
                  animation: `cardFloat${(i % 3) + 1} ${3 + i * 0.5}s ease-in-out infinite`,
                }}
              >
                {/* Top row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <div
                      style={{
                        fontSize: "22px",
                        fontWeight: 900,
                        color: "#ffffff",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {card.amount}
                    </div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", marginTop: "2px" }}>
                      {card.max}
                    </div>
                  </div>
                  <span
                    style={{
                      background: "rgba(139, 92, 246,0.12)",
                      border: "1px solid rgba(139, 92, 246,0.25)",
                      color: "var(--color-primary)",
                      fontSize: "9px",
                      fontWeight: 800,
                      letterSpacing: "0.18em",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      textTransform: "uppercase",
                    }}
                  >
                    {card.category}
                  </span>
                </div>

                {/* Divider */}
                <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", marginBottom: "12px" }} />

                {/* Title */}
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)", fontWeight: 600, marginBottom: "12px" }}>
                  {card.title}
                </div>

                {/* Footer */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span
                    style={{
                      fontSize: "9px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: card.verified ? "var(--color-primary)" : "rgba(255,255,255,0.3)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontWeight: 700,
                    }}
                  >
                    {card.verified && <VerifiedIcon />}
                    {card.tag}
                  </span>
                  {card.verified && (
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "var(--color-primary)",
                        boxShadow: "0 0 8px rgba(139, 92, 246,0.8)",
                        display: "inline-block",
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Bar */}
        <div
          style={{
            marginTop: "64px",
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "16px",
            animation: "fadeSlideUp 0.7s 0.5s cubic-bezier(0.22,1,0.36,1) both",
          }}
          className="stats-grid"
        >
          {displayStats.map((stat, i) => {
            const isHovered = hoveredStat === i;
            return (
              <div
                key={stat.label}
                onMouseEnter={() => setHoveredStat(i)}
                onMouseLeave={() => setHoveredStat(null)}
                style={{
                  position: "relative",
                  padding: "30px 20px",
                  background: isHovered
                    ? "linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(139, 92, 246, 0.015) 100%)"
                    : "linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.005) 100%)",
                  border: isHovered
                    ? "1px solid rgba(139, 92, 246, 0.25)"
                    : "1px solid rgba(255, 255, 255, 0.05)",
                  borderRadius: "20px",
                  textAlign: "center",
                  overflow: "hidden",
                  transition: "all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)",
                  cursor: "default",
                  boxShadow: isHovered
                    ? "0 20px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(139, 92, 246, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                    : "0 10px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                }}
              >
                {/* Glow ring effect inside card on hover */}
                {isHovered && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "radial-gradient(circle at 50% 50%, rgba(139, 92, 246,0.06) 0%, transparent 60%)",
                      pointerEvents: "none",
                    }}
                  />
                )}

                {/* Styled icon badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: stat.accent || isHovered ? "rgba(139, 92, 246, 0.08)" : "rgba(255, 255, 255, 0.03)",
                    border: stat.accent || isHovered ? "1px solid rgba(139, 92, 246, 0.18)" : "1px solid rgba(255, 255, 255, 0.06)",
                    color: stat.accent || isHovered ? "var(--color-primary)" : "rgba(255, 255, 255, 0.5)",
                    transition: "all 0.3s ease",
                  }}
                >
                  {typeof stat.icon === "string" ? STAT_ICONS[stat.icon] || STAT_ICONS.package : stat.icon}
                </div>

                <div
                  style={{
                    fontSize: "clamp(26px, 3vw, 38px)",
                    fontWeight: 900,
                    letterSpacing: "-0.03em",
                    color: stat.accent || isHovered ? "var(--color-primary)" : "#ffffff",
                    lineHeight: 1,
                    transition: "all 0.3s ease",
                    transform: isHovered ? "scale(1.02)" : "scale(1)",
                  }}
                >
                  {stat.value}
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: isHovered ? "rgba(255,255,255,0.6)" : "rgba(255, 255, 255, 0.35)",
                    transition: "all 0.3s ease",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .popular-tag-btn {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 999px;
          padding: 4px 14px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          font-family: inherit;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
        .popular-tag-btn:hover {
          background: rgba(139, 92, 246, 0.06);
          border-color: var(--color-primary);
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(139, 92, 246, 0.15), 0 0 0 1px rgba(139, 92, 246, 0.2);
        }

        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes cardFloat1 {
          0%, 100% { translate: 0 0px; }
          50%       { translate: 0 -8px; }
        }
        @keyframes cardFloat2 {
          0%, 100% { translate: 0 0px; }
          50%       { translate: 0 -10px; }
        }
        @keyframes cardFloat3 {
          0%, 100% { translate: 0 0px; }
          50%       { translate: 0 -6px; }
        }
        @media (min-width: 1024px) {
          .hero-grid {
            grid-template-columns: 1.1fr 0.9fr !important;
          }
          .stats-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
          .hero-cards-area {
            height: 420px !important;
          }
        }
      `}</style>
    </section>
  );
}
