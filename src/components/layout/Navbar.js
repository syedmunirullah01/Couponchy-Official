"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  buildCountryPath,
  COUNTRY_COOKIE_KEY,
  DEFAULT_COUNTRY_CODE,
  getCountryCodeFromPathname,
  getCountryByCode,
  normalizeCountryCode,
  removeCountryPrefix,
  SUPPORTED_COUNTRIES,
  sanitizeCountryList,
} from "@/lib/countries";

const PRIMARY_NAV = [
  { label: "Find Merchants", href: "/stores", kind: "mega" },
  {
    label: "Events", href: "#", kind
      : "events"
  },
  { label: "Exclusive", href: "/exclusive" },
  { label: "Blog", href: "/blog" },
];

const POPULAR_STORE_NAMES = ["Nike", "Old Navy", "Fashion Nova", "SHEIN", "SKIMS", "DSW", "Carter's"];

function SearchIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ChevronDownIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function CloseIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 6 18 18" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function MenuIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function BrandMark({ countryCode, onClick }) {
  return (
    <Link
      href={buildCountryPath("/", countryCode)}
      onClick={onClick}
      className="group inline-flex items-center gap-2.5 rounded-[12px] border border-white/8 bg-white/[0.03] px-3.5 py-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] transition duration-300 hover:border-[var(--accent)]/45 hover:bg-white/[0.06]"
    >
      {/* Icon badge */}
      <div
        className="flex h-6 w-6 items-center justify-center rounded-[8px] transition-transform duration-300 group-hover:scale-110"
        style={{
          background: "linear-gradient(135deg, var(--accent) 0%, #d946ef 100%)",
          boxShadow: "0 0 10px rgba(139, 92, 246,0.35)",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 text-black"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="19" y1="5" x2="5" y2="19"></line>
          <circle cx="6.5" cy="6.5" r="2.5" fill="currentColor"></circle>
          <circle cx="17.5" cy="17.5" r="2.5" fill="currentColor"></circle>
        </svg>
      </div>

      {/* Text logo */}
      <span className="text-[1.25rem] font-black tracking-[-0.04em] text-white">
        Coupon<span style={{ color: "var(--accent)" }}>chy</span>
      </span>
    </Link>
  );
}

function formatOfferCount(value) {
  if (!value) {
    return "No deals yet";
  }

  if (value === 1) {
    return "1 live deal";
  }

  return `${value} live deals`;
}

function getStoreHref(store, countryCode) {
  return buildCountryPath(`/stores/${store.categorySlug}/${store.slug}`, countryCode);
}

function formatCategoryLabel(name) {
  return String(name || "").trim() || "Category";
}

function formatOfferValue(offer) {
  const source = [offer.title, offer.description, offer.code].filter(Boolean).join(" ");
  const percentMatch = source.match(/(\d{1,3})\s*%/);
  if (percentMatch) {
    return `${percentMatch[1]}% off`;
  }

  const amountMatch = source.match(/\$ ?(\d[\d,]*)/);
  if (amountMatch) {
    return `$${amountMatch[1]} off`;
  }

  return offer.type === "Deal" ? "Deal" : offer.code || "Coupon";
}

function formatOfferAge(dateString) {
  if (!dateString) {
    return "Recently added";
  }

  const now = Date.now();
  const createdAt = new Date(dateString).getTime();
  const diffDays = Math.max(0, Math.floor((now - createdAt) / (1000 * 60 * 60 * 24)));

  if (diffDays === 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "1 day ago";
  }

  if (diffDays < 30) {
    return `${diffDays} days ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} mo ago`;
}

function formatOfferUsage(totalOffers) {
  if (!totalOffers) {
    return "Used recently";
  }

  if (totalOffers >= 1000) {
    return `Used ${(totalOffers / 1000).toFixed(1)}K times`;
  }

  return `Used ${Math.max(1, totalOffers * 11)} times`;
}

function isExactStoreMatch(store, query) {
  return [store.name, store.slug].filter(Boolean).some((value) => value.trim().toLowerCase() === query);
}

export default function Navbar() {
  const pathname = usePathname();
  const pathWithoutCountry = removeCountryPrefix(pathname);
  const router = useRouter();
  const menuRef = useRef(null);
  const countryDropdownRef = useRef(null);
  const mobileCountryDropdownRef = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [mobileEventsOpen, setMobileEventsOpen] = useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [mobileCountryDropdownOpen, setMobileCountryDropdownOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [offers, setOffers] = useState([]);
  const [events, setEvents] = useState([]);
  const [countries, setCountries] = useState(SUPPORTED_COUNTRIES);
  const [activeCategorySlug, setActiveCategorySlug] = useState("");
  const [activeStoreSlug, setActiveStoreSlug] = useState("");
  const [allCategoriesMode, setAllCategoriesMode] = useState(false);
  const [mobileDealsOpen, setMobileDealsOpen] = useState(false);
  const [mobileActiveCategorySlug, setMobileActiveCategorySlug] = useState("");
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState(() => {
    const countryFromPath = getCountryCodeFromPathname(pathname);
    if (countryFromPath) {
      return countryFromPath;
    }

    if (typeof document === "undefined") {
      return DEFAULT_COUNTRY_CODE;
    }

    const matchedCookie = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(`${COUNTRY_COOKIE_KEY}=`))
      ?.split("=")[1];

    return normalizeCountryCode(decodeURIComponent(matchedCookie || DEFAULT_COUNTRY_CODE));
  });
  const selectedCountry = getCountryByCode(selectedCountryCode, countries);

  useEffect(() => {
    let cancelled = false;

    async function loadNavigationData() {
      try {
        const [categoriesResponse, storesResponse, offersResponse, countriesResponse, eventsResponse] = await Promise.all([
          fetch("/api/categories", { cache: "no-store" }),
          fetch(`/api/stores?country=${selectedCountryCode}`, { cache: "no-store" }),
          fetch(`/api/offers?country=${selectedCountryCode}`, { cache: "no-store" }),
          fetch("/api/public/countries", { cache: "no-store" }),
          fetch("/api/public/events", { cache: "no-store" }),
        ]);

        const [categoriesPayload, storesPayload, offersPayload, countriesPayload, eventsPayload] = await Promise.all([
          categoriesResponse.json(),
          storesResponse.json(),
          offersResponse.json(),
          countriesResponse.json(),
          eventsResponse.json(),
        ]);

        if (cancelled) {
          return;
        }

        const nextCategories = Array.isArray(categoriesPayload.data) ? categoriesPayload.data : [];
        const nextStores = Array.isArray(storesPayload.data) ? storesPayload.data : [];
        const nextOffers = Array.isArray(offersPayload.data) ? offersPayload.data : [];
        const nextCountries = sanitizeCountryList(countriesPayload.data || SUPPORTED_COUNTRIES);

        setCategories(nextCategories);
        setStores(nextStores);
        setOffers(nextOffers);
        setCountries(nextCountries);
        setEvents(Array.isArray(eventsPayload.data) ? eventsPayload.data : []);

        setActiveCategorySlug((current) => {
          if (current && nextCategories.some((item) => item.slug === current)) {
            return current;
          }

          const categoryFromPath = nextCategories.find((item) => pathname.includes(`/${item.slug}`));
          return categoryFromPath?.slug || nextCategories[0]?.slug || "";
        });
      } catch {
        if (!cancelled) {
          setCategories([]);
          setStores([]);
          setOffers([]);
          setCountries(SUPPORTED_COUNTRIES);
          setEvents([]);
        }
      }
    }

    const delayTimer = setTimeout(() => {
      loadNavigationData();
    }, 1200);

    return () => {
      cancelled = true;
      clearTimeout(delayTimer);
    };
  }, [pathname, selectedCountryCode]);

  function handleCountryChange(nextCountryCode) {
    const normalizedCountryCode = normalizeCountryCode(nextCountryCode);
    setSelectedCountryCode(normalizedCountryCode);
    document.cookie = `${COUNTRY_COOKIE_KEY}=${encodeURIComponent(normalizedCountryCode)}; path=/; max-age=31536000; samesite=lax`;
    const nextPath = buildCountryPath("/", normalizedCountryCode);
    const search = typeof window !== "undefined" ? window.location.search : "";
    router.replace(`${nextPath}${search}`);
    router.refresh();
  }

  useEffect(() => {
    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setMegaOpen(false);
        setEventsOpen(false);
      }
      if (!countryDropdownRef.current?.contains(event.target)) {
        setCountryDropdownOpen(false);
      }
      if (!mobileCountryDropdownRef.current?.contains(event.target)) {
        setMobileCountryDropdownOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setMegaOpen(false);
        setDetailOpen(false);
        setMobileOpen(false);
        setMobileDealsOpen(false);
        setMobileActiveCategorySlug("");
        setDesktopSearchOpen(false);
        setEventsOpen(false);
        setMobileEventsOpen(false);
        setCountryDropdownOpen(false);
        setMobileCountryDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const activeCategory = useMemo(
    () => categories.find((category) => category.slug === activeCategorySlug) || categories[0] || null,
    [activeCategorySlug, categories]
  );

  const storesByCategory = useMemo(() => {
    return stores.reduce((accumulator, store) => {
      const key = store.categorySlug || "uncategorized";
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(store);
      return accumulator;
    }, {});
  }, [stores]);

  const storeMap = useMemo(() => new Map(stores.map((store) => [store.slug, store])), [stores]);

  const offersByStoreSlug = useMemo(() => {
    return offers.reduce((accumulator, offer) => {
      if (!accumulator[offer.storeSlug]) {
        accumulator[offer.storeSlug] = [];
      }
      accumulator[offer.storeSlug].push(offer);
      return accumulator;
    }, {});
  }, [offers]);

  const activeStores = useMemo(() => {
    if (!activeCategory) {
      return [];
    }

    return [...(storesByCategory[activeCategory.slug] || [])]
      .sort(
        (left, right) => (right.offersCount || 0) - (left.offersCount || 0) || left.name.localeCompare(right.name)
      )
      .slice(0, 7);
  }, [activeCategory, storesByCategory]);

  const allStoresPreview = useMemo(() => {
    return [...stores]
      .sort((left, right) => (right.offersCount || 0) - (left.offersCount || 0) || left.name.localeCompare(right.name))
      .slice(0, 7);
  }, [stores]);

  const visibleStores = allCategoriesMode ? allStoresPreview : activeStores;

  const effectiveActiveStoreSlug =
    activeStoreSlug && visibleStores.some((store) => store.slug === activeStoreSlug) ? activeStoreSlug : visibleStores[0]?.slug || "";

  const featuredStores = useMemo(() => {
    return [...visibleStores]
      .sort((left, right) => (right.offersCount || 0) - (left.offersCount || 0) || left.name.localeCompare(right.name))
      .slice(0, 4);
  }, [visibleStores]);

  const featuredOffers = useMemo(() => {
    const relevantStoreSlugs = new Set(
      effectiveActiveStoreSlug ? [effectiveActiveStoreSlug] : visibleStores.map((store) => store.slug)
    );

    const matchedOffers = offers
      .filter((offer) => relevantStoreSlugs.has(offer.storeSlug))
      .filter((offer) => offer.status?.toLowerCase() !== "expired")
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .slice(0, 4)
      .map((offer) => {
        const store = storeMap.get(offer.storeSlug);
        const storeOffers = offersByStoreSlug[offer.storeSlug] || [];

        return {
          offer,
          store,
          totalOffers: storeOffers.length || store?.offersCount || 0,
        };
      });

    return matchedOffers;
  }, [effectiveActiveStoreSlug, visibleStores, offers, offersByStoreSlug, storeMap]);

  const searchMatches = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return stores
      .filter((store) => {
        return (
          store.name?.toLowerCase().includes(query) ||
          store.slug?.toLowerCase().includes(query) ||
          store.category?.toLowerCase().includes(query)
        );
      })
      .slice(0, 6);
  }, [searchValue, stores]);

  function handleSearchSubmit(event) {
    event.preventDefault();

    const rawQuery = searchValue.trim();
    const normalizedQuery = rawQuery.toLowerCase();
    const exactStoreMatch = stores.find((store) => isExactStoreMatch(store, normalizedQuery));

    if (exactStoreMatch) {
      router.push(getStoreHref(exactStoreMatch, selectedCountryCode));
      setMegaOpen(false);
      setDetailOpen(false);
      setMobileOpen(false);
      setMobileDealsOpen(false);
      setDesktopSearchOpen(false);
      return;
    }

    router.push(
      rawQuery
        ? `${buildCountryPath("/stores", selectedCountryCode)}?search=${encodeURIComponent(rawQuery)}`
        : buildCountryPath("/stores", selectedCountryCode)
    );
    setMegaOpen(false);
    setDetailOpen(false);
    setMobileOpen(false);
    setMobileDealsOpen(false);
    setDesktopSearchOpen(false);
  }

  function handleOpenMegaMenu() {
    setMegaOpen(true);
    setDetailOpen(false);
    if (!activeCategorySlug && categories[0]?.slug) {
      setActiveCategorySlug(categories[0].slug);
    }
  }

  const isDealsActive = pathWithoutCountry.startsWith("/stores");

  const displayCategories = categories.map((category) => ({
    ...category,
    displayName: formatCategoryLabel(category.name),
  }));

  const showMegaMenu = megaOpen && displayCategories.length > 0;
  const navItems = PRIMARY_NAV;
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[rgba(0,0,0,0.96)]">
      <div
        className={cn(
          "mx-auto max-w-[1440px] items-center justify-between gap-4 px-5 py-3 sm:px-6 lg:px-8",
          mobileOpen ? "hidden lg:flex" : "flex"
        )}
      >
        <div className="flex items-center gap-4 lg:gap-6">
          <BrandMark countryCode={selectedCountryCode} />

          <nav className="hidden items-center gap-6 lg:flex" ref={menuRef}>
            {navItems.map((item) => {
              const isActive =
                item.kind === "mega"
                  ? isDealsActive
                  : item.kind === "events"
                    ? pathWithoutCountry.startsWith("/events")
                    : pathWithoutCountry === item.href;

              if (item.kind === "events") {
                return (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => setEventsOpen(true)}
                    onMouseLeave={() => setEventsOpen(false)}
                  >
                    <button
                      type="button"
                      onClick={() => setEventsOpen((current) => !current)}
                      className="flex items-center gap-1.5 font-sans text-sm font-bold text-white transition hover:text-white/80"
                      aria-expanded={eventsOpen}
                      aria-haspopup="true"
                    >
                      {item.label}
                      <ChevronDownIcon className={cn("h-3.5 w-3.5 transition-transform", eventsOpen ? "rotate-180" : "rotate-0")} />
                    </button>

                    {eventsOpen && events.length > 0 && (
                      <div className="absolute left-0 top-full pt-3 z-50">
                        <div className="absolute inset-x-0 -top-3 h-3" />
                        <div
                          className="w-[200px] overflow-hidden rounded-[16px] border border-white/10 bg-[#0c0c0c] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.85)]"
                        >
                          <div className="grid gap-1">
                            {events.map((event) => (
                              <Link
                                key={event.id || event.slug}
                                href={buildCountryPath(`/events/${event.slug}`, selectedCountryCode)}
                                className="flex items-center justify-between rounded-[10px] px-3.5 py-2.5 text-left text-white/80 transition hover:bg-white/5 hover:text-white"
                              >
                                <span className="text-[0.88rem] font-medium">{event.name}</span>
                                <ChevronRightIcon className="h-3.5 w-3.5 text-white/30" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              if (item.kind === "mega") {
                return (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={handleOpenMegaMenu}
                    onMouseLeave={() => {
                      setMegaOpen(false);
                      setDetailOpen(false);
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setMegaOpen((current) => !current)}
                      className="flex items-center gap-1.5 font-sans text-sm font-bold text-white transition hover:text-white/80"
                      aria-expanded={megaOpen}
                      aria-haspopup="true"
                    >
                      {item.label}
                      <ChevronDownIcon className={cn("h-3.5 w-3.5 transition-transform", megaOpen ? "rotate-180" : "rotate-0")} />
                    </button>

                    {showMegaMenu ? (
                      <div className="absolute left-0 top-full pt-3">
                        <div className="absolute inset-x-0 -top-3 h-3" />
                        <div
                          className={cn(
                            "overflow-hidden rounded-[24px] border border-white/10 bg-black shadow-[0_24px_90px_rgba(0,0,0,0.72)] transition-[width,transform,opacity] duration-200",
                            detailOpen ? "w-[900px]" : "w-[230px]",
                            "translate-y-0 opacity-100"
                          )}
                        >
                          <div className="grid grid-cols-[230px_200px_1fr]">
                            <div className="bg-[#060609] p-3.5">
                              <div className="grid max-h-[360px] gap-1 overflow-y-auto pr-1">
                                {displayCategories.map((category) => {
                                  const isCategoryActive = category.slug === activeCategory?.slug;
                                  const count = storesByCategory[category.slug]?.length || 0;

                                  return (
                                    <button
                                      key={category.id || category.slug}
                                      type="button"
                                      onMouseEnter={() => {
                                        setActiveCategorySlug(category.slug);
                                        setActiveStoreSlug("");
                                        setAllCategoriesMode(false);
                                        setDetailOpen(true);
                                      }}
                                      onFocus={() => {
                                        setActiveCategorySlug(category.slug);
                                        setActiveStoreSlug("");
                                        setAllCategoriesMode(false);
                                        setDetailOpen(true);
                                      }}
                                      onClick={() => {
                                        setActiveCategorySlug(category.slug);
                                        setActiveStoreSlug("");
                                        setAllCategoriesMode(false);
                                        setDetailOpen(true);
                                      }}
                                      className={cn(
                                        "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition border-l-2",
                                        isCategoryActive
                                          ? "bg-[var(--accent)]/10 border-[var(--accent)] text-white"
                                          : "border-transparent text-white/70 hover:bg-white/[0.02] hover:text-white"
                                      )}
                                    >
                                      <span>
                                        <span className="block text-[0.88rem] font-semibold">{category.displayName}</span>
                                        <span className={cn("mt-0.5 block text-[10px]", isCategoryActive ? "text-[var(--accent)]/70 font-semibold" : "text-white/40")}>{count} stores</span>
                                      </span>
                                      <ChevronRightIcon className="h-3.5 w-3.5 text-white/55" />
                                    </button>
                                  );
                                })}
                              </div>

                              <Link
                                href={buildCountryPath("/categories", selectedCountryCode)}
                                onMouseEnter={() => {
                                  setActiveStoreSlug("");
                                  setAllCategoriesMode(true);
                                  setDetailOpen(true);
                                }}
                                onFocus={() => {
                                  setActiveStoreSlug("");
                                  setAllCategoriesMode(true);
                                  setDetailOpen(true);
                                }}
                                className={cn(
                                  "mt-2 flex items-center justify-between rounded-xl border px-3.5 py-2 text-[0.88rem] font-semibold transition",
                                  allCategoriesMode
                                    ? "border-[var(--accent)]/30 bg-[var(--accent)]/10 text-white"
                                    : "border-white/5 bg-white/[0.02] text-white/70 hover:border-white/10 hover:text-white"
                                )}
                              >
                                <span className="flex flex-col">
                                  <span>All categories</span>
                                  <span className="mt-0.5 text-[10px] font-medium text-white/40">Browse the full catalog</span>
                                </span>
                                <ChevronRightIcon className="h-3.5 w-3.5" />
                              </Link>
                            </div>

                            <div className={cn("border-r border-white/5 bg-[#0a0a0e] p-3.5", detailOpen ? "block" : "hidden")}>
                              <div className="grid gap-0.5">
                                {visibleStores.map((store, index) => (
                                  <Link
                                    key={store.id || store.slug}
                                    href={getStoreHref(store)}
                                    onMouseEnter={() => setActiveStoreSlug(store.slug)}
                                    onFocus={() => setActiveStoreSlug(store.slug)}
                                    className={cn(
                                      "flex items-center justify-between rounded-xl px-3 py-2 transition-all duration-200",
                                      effectiveActiveStoreSlug === store.slug
                                        ? "bg-[var(--accent)]/10 text-[var(--accent)] font-semibold"
                                        : "text-white/60 hover:bg-white/[0.02] hover:text-white"
                                    )}
                                  >
                                    <span className="truncate pr-3 text-[0.88rem]">
                                      {store.name || POPULAR_STORE_NAMES[index] || "Store"}
                                    </span>
                                    <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-white/40" />
                                  </Link>
                                ))}
                              </div>

                              {!visibleStores.length ? (
                                <div className="px-3 py-4 text-[0.82rem] text-white/45">
                                  {allCategoriesMode ? "No stores available yet." : "No stores in this category yet."}
                                </div>
                              ) : null}

                              <Link
                                href={
                                  activeCategory
                                    ? `${buildCountryPath("/stores", selectedCountryCode)}?category=${activeCategory.slug}`
                                    : buildCountryPath("/stores", selectedCountryCode)
                                }
                                onMouseEnter={() => setActiveStoreSlug("")}
                                onFocus={() => setActiveStoreSlug("")}
                                className="mt-2.5 flex items-center justify-between px-3 py-1.5 text-[0.88rem] font-semibold text-[var(--accent)] transition-all hover:translate-x-0.5"
                              >
                                <span>All {activeCategory ? formatCategoryLabel(activeCategory.name) : "stores"}</span>
                                <ChevronRightIcon className="h-3.5 w-3.5" />
                              </Link>
                            </div>

                            <div className={cn("bg-[#0e0e13] p-3.5", detailOpen ? "block" : "hidden")}>
                              <div className="grid gap-2.5 md:grid-cols-2">
                                {featuredOffers.length ? (
                                  featuredOffers.map(({ offer, store, totalOffers }) => (
                                    <Link
                                      key={offer.id}
                                      href={store ? getStoreHref(store, selectedCountryCode) : buildCountryPath("/stores", selectedCountryCode)}
                                      className="group flex min-h-[250px] flex-col rounded-2xl border border-white/5 bg-[#13131b]/60 p-4 transition-all duration-300 hover:border-[var(--accent)]/30 hover:bg-[#161622]/85 hover:shadow-[0_8px_25px_rgba(139,92,246,0.06)]"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white p-1.5 text-black">
                                          {store?.logoImage ? (
                                            <Image
                                              src={store.logoImage}
                                              alt={store.name}
                                              width={56}
                                              height={56}
                                              className="h-full w-full object-contain"
                                              unoptimized
                                            />
                                          ) : (
                                            <span className="px-2 text-center text-[11px] font-black uppercase tracking-[0.18em]">
                                              {(store?.name || offer.storeName || "OF").slice(0, 2)}
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-right">
                                          <p className="text-[1.35rem] font-black leading-none text-[var(--accent)] group-hover:scale-105 transition-transform duration-300">
                                            {formatOfferValue(offer)}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="mt-4">
                                        <h3 className="line-clamp-1 text-sm font-bold text-white group-hover:text-[var(--accent)] transition-colors">{store?.name || offer.storeName}</h3>
                                        <p className="mt-2 min-h-[2.5rem] line-clamp-2 text-xs leading-relaxed text-white/50 font-medium">
                                          {offer.title || offer.description || `Browse current savings from ${store?.name || offer.storeName}.`}
                                        </p>
                                      </div>

                                      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-white/40 font-semibold uppercase tracking-wider">
                                        <span className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-full border border-white/10 text-[9px]">◷</span>
                                        <span>{formatOfferAge(offer.createdAt)}</span>
                                      </div>

                                      <div className="mt-auto pt-4">
                                        <div className="flex items-center justify-center rounded-xl border border-[var(--accent)]/10 bg-[var(--accent)]/5 px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-[var(--accent)]">
                                          <span>{formatOfferUsage(totalOffers)}</span>
                                        </div>
                                      </div>
                                    </Link>
                                  ))
                                ) : featuredStores.length ? (
                                  featuredStores.map((store) => (
                                    <Link
                                      key={store.id || store.slug}
                                      href={getStoreHref(store, selectedCountryCode)}
                                      className="group flex min-h-[250px] flex-col rounded-2xl border border-white/5 bg-[#13131b]/60 p-4 transition-all duration-300 hover:border-[var(--accent)]/30 hover:bg-[#161622]/85 hover:shadow-[0_8px_25px_rgba(139,92,246,0.06)]"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white p-1 text-black">
                                          {store.logoImage ? (
                                            <Image
                                              src={store.logoImage}
                                              alt={store.name}
                                              width={40}
                                              height={40}
                                              className="h-full w-full object-contain"
                                              unoptimized
                                            />
                                          ) : (
                                            <span className="px-2 text-center text-[11px] font-black uppercase tracking-[0.18em]">
                                              {store.name.slice(0, 2)}
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-right">
                                          <p className="text-[1.35rem] font-black leading-none text-[var(--accent)] group-hover:scale-105 transition-transform duration-300">
                                            {store.offersCount ? `${store.offersCount}+ offers` : "New"}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="mt-4">
                                        <h3 className="line-clamp-1 text-sm font-bold text-white group-hover:text-[var(--accent)] transition-colors">{store.name}</h3>
                                        <p className="mt-2 min-h-[2.5rem] line-clamp-2 text-xs leading-relaxed text-white/50 font-medium">
                                          {store.description || `Browse current savings, coupon codes, and direct offers from ${store.name}.`}
                                        </p>
                                      </div>

                                      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-white/40 font-semibold uppercase tracking-wider">
                                        <span className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-full border border-white/10 text-[9px]">C</span>
                                        <span>{formatOfferCount(store.offersCount)}</span>
                                      </div>

                                      <div className="mt-auto pt-4">
                                        <div className="inline-flex items-center justify-center w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-white/70 transition-all duration-300 group-hover:bg-[var(--accent)] group-hover:border-[var(--accent)] group-hover:text-black">
                                          Explore {store.name}
                                        </div>
                                      </div>
                                    </Link>
                                  ))
                                ) : (
                                  <div className="col-span-full rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-white/55">
                                    Add stores from admin to populate the deals preview here.
                                  </div>
                                )}
                              </div>

                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={buildCountryPath(item.href, selectedCountryCode)}
                  className="flex items-center gap-1.5 font-sans text-sm font-bold text-white transition hover:text-white/80"
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="relative hidden lg:flex items-center gap-2" ref={countryDropdownRef}>
            <span className="text-xs font-semibold tracking-[0.08em] text-white/80">Country</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setCountryDropdownOpen((open) => !open)}
                className="flex items-center gap-1.5 h-8 rounded-full border border-white/12 bg-black px-2.5 text-white outline-none transition hover:border-white/25 focus:border-[var(--color-primary)] select-none"
                aria-expanded={countryDropdownOpen}
                aria-haspopup="listbox"
                aria-label={`Select country, current: ${selectedCountry.name}`}
                title={selectedCountry.name}
              >
                <img
                  src={selectedCountry?.flagUrl || `https://flagcdn.com/w40/${selectedCountryCode.toLowerCase()}.png`}
                  alt={selectedCountry.name}
                  className="h-3 w-4.5 object-cover rounded-[1px]"
                />
                <ChevronDownIcon className={cn("h-3.5 w-3.5 text-white/50 transition-transform", countryDropdownOpen ? "rotate-180" : "rotate-0")} />
              </button>

              {countryDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 z-50">
                  <div className="w-[52px] overflow-hidden rounded-[16px] border border-white/10 bg-[#0c0c0c] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
                    <div className="grid gap-1">
                      {countries.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => {
                            handleCountryChange(country.code);
                            setCountryDropdownOpen(false);
                          }}
                          className={cn(
                            "flex items-center justify-center rounded-[10px] py-2 hover:bg-white/5 transition-colors",
                            selectedCountryCode === country.code && "bg-white/10"
                          )}
                          title={country.name}
                        >
                          <img
                            src={country.flagUrl || `https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                            alt={country.name}
                            className="h-3.5 w-5 object-cover rounded-[1px]"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDesktopSearchOpen((current) => !current)}
            className="hidden h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/5 lg:inline-flex"
            aria-label="Open search"
          >
            <SearchIcon />
          </button>
          {desktopSearchOpen ? (
            <form
              onSubmit={handleSearchSubmit}
              className="absolute right-0 top-[calc(100%+12px)] hidden w-[340px] items-center gap-3 rounded-[16px] border border-white/14 bg-[#090909] px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.45)] ring-1 ring-white/6 lg:flex"
            >
              <span className="text-white/55">
                <SearchIcon className="h-4.5 w-4.5" />
              </span>
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search stores, coupons, deals"
                className="w-full border-0 bg-transparent text-[0.98rem] font-medium tracking-[0.01em] text-white outline-none placeholder:font-normal placeholder:text-white/38"
              />
            </form>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setMobileOpen((current) => {
                const next = !current;
                if (next) {
                  setMobileDealsOpen(false);
                  setMobileActiveCategorySlug("");
                }
                return next;
              });
            }}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-white transition hover:border-white/20 hover:bg-white/5 lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-x-0 top-0 z-[70] h-[100dvh] overflow-y-auto border-t border-white/6 bg-black/98 transition lg:hidden",
          mobileOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        )}
      >
        <div className="mx-auto flex min-h-[100dvh] max-w-[1400px] flex-col overflow-x-hidden px-4 pb-5 pt-4">
          <div className="border-b border-white/8 pb-4">
            <div className="flex items-center justify-between gap-4">
              <BrandMark countryCode={selectedCountryCode} onClick={() => setMobileOpen(false)} />
              <div className="flex items-center gap-3 text-white">
                <button type="button" onClick={() => setDesktopSearchOpen((current) => !current)} className="inline-flex h-10 w-10 items-center justify-center" aria-label="Toggle Search">
                  <SearchIcon className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => setMobileOpen(false)} className="inline-flex h-10 w-10 items-center justify-center" aria-label="Close Menu">
                  <CloseIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="mt-4 relative" ref={mobileCountryDropdownRef}>
              <div className="flex items-center justify-between gap-4 rounded-[14px] border border-white/10 bg-white/[0.025] px-4 py-3">
                <span className="text-sm font-semibold tracking-[0.08em] text-white/80">Country</span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMobileCountryDropdownOpen((open) => !open)}
                    className="flex items-center gap-1.5 h-9 rounded-full border border-white/10 bg-black px-3 text-white outline-none"
                    aria-label={`Select country, current: ${selectedCountry.name}`}
                    title={selectedCountry.name}
                  >
                    <img
                      src={selectedCountry?.flagUrl || `https://flagcdn.com/w40/${selectedCountryCode.toLowerCase()}.png`}
                      alt={selectedCountry.name}
                      className="h-3.5 w-5 object-cover rounded-[1px]"
                    />
                    <ChevronDownIcon className={cn("h-4.5 w-4.5 text-white/55 transition-transform", mobileCountryDropdownOpen ? "rotate-180" : "rotate-0")} />
                  </button>

                  {mobileCountryDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 z-50">
                      <div className="w-[52px] overflow-hidden rounded-[16px] border border-white/10 bg-[#0c0c0c] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
                        <div className="grid gap-1">
                          {countries.map((country) => (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => {
                                handleCountryChange(country.code);
                                setMobileCountryDropdownOpen(false);
                              }}
                              className={cn(
                                "flex items-center justify-center rounded-[10px] py-2 hover:bg-white/5 transition-colors",
                                selectedCountryCode === country.code && "bg-white/10"
                              )}
                              title={country.name}
                            >
                              <img
                                src={country.flagUrl || `https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                                alt={country.name}
                                className="h-3.5 w-5 object-cover rounded-[1px]"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {desktopSearchOpen ? (
            <form onSubmit={handleSearchSubmit} className="mt-4 flex items-center gap-3 rounded-[16px] border border-white/12 bg-white/[0.04] px-4 py-3.5 ring-1 ring-white/6">
              <span className="text-white/55">
                <SearchIcon className="h-4.5 w-4.5" />
              </span>
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search stores, coupons, deals"
                className="w-full border-0 bg-transparent text-[0.98rem] font-medium text-white outline-none placeholder:font-normal placeholder:text-white/38"
              />
            </form>
          ) : null}

          <div className="border-b border-white/8 py-5">
            <button
              type="button"
              onClick={() => setMobileDealsOpen((current) => !current)}
              className="flex w-full items-center justify-between text-left font-sans text-[1.05rem] font-bold text-white"
            >
              <span>Find Merchants</span>
              <ChevronDownIcon className={cn("h-4 w-4 transition-transform", mobileDealsOpen ? "rotate-180" : "rotate-0")} />
            </button>

            {mobileDealsOpen ? (
              <div className="mt-4 grid gap-1">
                {displayCategories.map((category) => {
                  const mobileCategoryStores = storesByCategory[category.slug] || [];
                  const isMobileActive = mobileActiveCategorySlug === category.slug;

                  return (
                    <div key={category.id || category.slug} className="border-t border-white/6 first:border-t-0">
                      <button
                        type="button"
                        onClick={() =>
                          setMobileActiveCategorySlug((current) => (current === category.slug ? "" : category.slug))
                        }
                        className="flex w-full items-center justify-between py-4 text-left"
                      >
                        <span className={cn("text-[0.98rem] font-semibold", isMobileActive ? "text-white" : "text-white/86")}>
                          {category.displayName}
                        </span>
                        <ChevronRightIcon className={cn("h-4 w-4", isMobileActive ? "text-white" : "text-white/45")} />
                      </button>

                      {isMobileActive ? (
                        <div className="mb-4 rounded-[2px] bg-white/[0.03] px-5 py-4">
                          <div className="grid gap-4">
                            {mobileCategoryStores.length ? (
                              mobileCategoryStores.map((store) => (
                                <Link
                                  key={store.id || store.slug}
                                  href={getStoreHref(store, selectedCountryCode)}
                                  onClick={() => {
                                    setMobileOpen(false);
                                    setMobileDealsOpen(false);
                                  }}
                                  className="text-[0.96rem] text-white/88"
                                >
                                  {store.name}
                                </Link>
                              ))
                            ) : (
                              <p className="text-sm text-white/45">No stores in this category yet.</p>
                            )}

                            <Link
                              href={`${buildCountryPath("/stores", selectedCountryCode)}?category=${category.slug}`}
                              onClick={() => {
                                setMobileOpen(false);
                                setMobileDealsOpen(false);
                              }}
                              className="text-[0.98rem] font-semibold text-[var(--accent)]"
                            >
                              All {category.displayName} →
                            </Link>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Mobile Events Menu */}
          <div className="border-b border-white/8 py-5">
            <button
              type="button"
              onClick={() => setMobileEventsOpen((current) => !current)}
              className="flex w-full items-center justify-between text-left font-sans text-[1.05rem] font-bold text-white"
            >
              <span>Events</span>
              <ChevronDownIcon className={cn("h-4 w-4 transition-transform", mobileEventsOpen ? "rotate-180" : "rotate-0")} />
            </button>

            {mobileEventsOpen ? (
              <div className="mt-4 grid gap-1">
                {events.map((event) => (
                  <Link
                    key={event.id || event.slug}
                    href={buildCountryPath(`/events/${event.slug}`, selectedCountryCode)}
                    onClick={() => {
                      setMobileOpen(false);
                      setMobileEventsOpen(false);
                    }}
                    className="flex items-center justify-between py-3 pl-4 pr-2 border-t border-white/6 text-white/80 transition hover:text-white"
                  >
                    <span className="text-[0.98rem] font-semibold">{event.name}</span>
                    <ChevronRightIcon className="h-4 w-4 text-white/45" />
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <div className="border-b border-white/8 py-5">
            <Link href={buildCountryPath("/exclusive", selectedCountryCode)} onClick={() => setMobileOpen(false)} className="block font-sans text-[1.05rem] font-bold text-white">
              Exclusive
            </Link>
          </div>

          <div className="border-b border-white/8 py-5">
            <Link href={buildCountryPath("/blog", selectedCountryCode)} onClick={() => setMobileOpen(false)} className="block font-sans text-[1.05rem] font-bold text-white">
              Blog
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
