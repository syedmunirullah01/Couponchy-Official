"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const initialState = {
  trendingStores: {
    title: "Trending Stores",
    selectedStoreSlugs: [],
    limit: 5,
  },
  featuredCoupons: {
    title: "Featured Coupons",
    selectedOfferIds: [],
    limit: 4,
  },
  featuredProducts: {
    title: "Featured Products",
    selectedProductIds: [],
    limit: 4,
  },
  latestStores: {
    title: "Latest Stores",
    selectedStoreSlugs: [],
    limit: 10,
  },
};

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" className="stroke-current opacity-25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" className="stroke-current" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function SettingsSection({ title, description, children }) {
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-soft)]/20 p-5 sm:p-6 shadow-sm">
      <div className="mb-5 border-b border-[var(--border)] pb-4">
        <p className="text-sm font-bold tracking-tight text-[var(--text)]">{title}</p>
        {description ? <p className="mt-0.5 text-xs text-[var(--muted)]">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

function StoreSelectionList({ stores, selectedStoreSlugs, onToggle, searchValue, onSearchChange, visibleCount, onLoadMore }) {
  const deferredSearchValue = useDeferredValue(searchValue);

  const filteredStores = useMemo(() => {
    const normalizedQuery = deferredSearchValue.trim().toLowerCase();

    if (!normalizedQuery) {
      return stores;
    }

    return stores.filter((store) => {
      const fields = [store.name, store.slug, store.category, store.description];
      return fields.some((field) => String(field || "").toLowerCase().includes(normalizedQuery));
    });
  }, [deferredSearchValue, stores]);

  const visibleStores = filteredStores.slice(0, visibleCount);
  const hasMore = visibleStores.length < filteredStores.length;

  return (
    <div className="grid gap-4">
      <label className="grid gap-2 text-sm text-[var(--muted)]">
        <span className="font-bold text-[var(--text)] text-xs">Search Stores</span>
        <Input
          className="rounded-xl h-10 text-xs bg-[var(--surface)] border-[var(--border)] focus:bg-[var(--surface-soft)]"
          value={searchValue}
          onChange={onSearchChange}
          placeholder="Search by name, slug, category, or description"
        />
      </label>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="grid grid-cols-[40px_40px_minmax(0,2fr)_minmax(0,1fr)_120px] gap-3 border-b border-[var(--border)] bg-[var(--surface-soft)]/50 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] items-center">
          <span>#</span>
          <span>Select</span>
          <span>Store Description</span>
          <span>Category</span>
          <span className="text-right pr-4">Offers Count</span>
        </div>

        {visibleStores.length ? (
          visibleStores.map((store, index) => (
            <label
              key={store.slug}
              className="grid cursor-pointer grid-cols-[40px_40px_minmax(0,2fr)_minmax(0,1fr)_120px] gap-3 border-b border-[var(--border)]/50 px-4 py-3 transition last:border-b-0 hover:bg-[var(--surface-soft)]/60 items-center"
            >
              <span className="text-xs text-[var(--muted)] font-mono">{(index + 1).toString().padStart(2, '0')}</span>
              <input
                type="checkbox"
                checked={selectedStoreSlugs.includes(store.slug)}
                onChange={() => onToggle(store.slug)}
                className="h-4 w-4 appearance-none rounded-full border-2 border-[var(--muted)]/60 bg-[var(--surface-soft)] checked:bg-[var(--color-primary)] checked:border-[var(--color-primary)] focus:outline-none transition-all cursor-pointer relative after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-transparent checked:after:bg-white"
              />
              <div className="min-w-0">
                <p className="truncate font-semibold text-[var(--text)] text-xs">{store.name}</p>
                {store.description && store.description !== "The goal is to support thousands of stores without requiring a full checkout validation for every coupon on every run." ? (
                  <p className="truncate text-[11px] text-[var(--muted)]">{store.description}</p>
                ) : null}
              </div>
              <p className="truncate text-xs font-semibold text-[var(--text)]/80 capitalize">{store.category || "-"}</p>
              <div className="text-right pr-4">
                <span className="inline-flex items-center rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:text-blue-400">
                  {(store.offersCount || 0).toString().padStart(2, "0")} Hubs
                </span>
              </div>
            </label>
          ))
        ) : (
          <div className="px-4 py-6 text-sm text-[var(--muted)]">No stores matched your search.</div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-[var(--muted)] font-semibold">
        <span>
          Showing {visibleStores.length} of {filteredStores.length} stores
        </span>
        {hasMore ? (
          <Button type="button" variant="outline" size="sm" className="text-xs font-bold rounded-lg" onClick={onLoadMore}>
            Load More
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function OfferSelectionList({ offers, selectedOfferIds, onToggle, searchValue, onSearchChange, visibleCount, onLoadMore }) {
  const deferredSearchValue = useDeferredValue(searchValue);

  const filteredOffers = useMemo(() => {
    const normalizedQuery = deferredSearchValue.trim().toLowerCase();

    if (!normalizedQuery) {
      return offers;
    }

    return offers.filter((offer) => {
      const fields = [offer.title, offer.storeName, offer.type, offer.code, offer.description];
      return fields.some((field) => String(field || "").toLowerCase().includes(normalizedQuery));
    });
  }, [deferredSearchValue, offers]);

  const visibleOffers = filteredOffers.slice(0, visibleCount);
  const hasMore = visibleOffers.length < filteredOffers.length;

  return (
    <div className="grid gap-4">
      <label className="grid gap-2 text-sm text-[var(--muted)]">
        <span className="font-bold text-[var(--text)] text-xs">Search Coupons</span>
        <Input
          className="rounded-xl h-10 text-xs bg-[var(--surface)] border-[var(--border)] focus:bg-[var(--surface-soft)]"
          value={searchValue}
          onChange={onSearchChange}
          placeholder="Search by title, store, type, code, or description"
        />
      </label>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="grid grid-cols-[40px_40px_minmax(0,2fr)_minmax(0,1fr)_100px_90px_100px] gap-3 border-b border-[var(--border)] bg-[var(--surface-soft)]/50 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] items-center">
          <span>#</span>
          <span>Select</span>
          <span>Coupon / Deal Description</span>
          <span>Store</span>
          <span>Type</span>
          <span>Source</span>
          <span className="text-right pr-4">Added Date</span>
        </div>

        {visibleOffers.length ? (
          visibleOffers.map((offer, index) => {
            const isCoupon = offer.type === "Coupon";
            const dateStr = offer.createdAt
              ? new Date(offer.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "Jun 27";
            return (
              <label
                key={offer.id}
                className="grid cursor-pointer grid-cols-[40px_40px_minmax(0,2fr)_minmax(0,1fr)_100px_90px_100px] gap-3 border-b border-[var(--border)]/50 px-4 py-3 transition last:border-b-0 hover:bg-[var(--surface-soft)]/60 items-center"
              >
                <span className="text-xs text-[var(--muted)] font-mono">{(index + 1).toString().padStart(2, '0')}</span>
                <input
                  type="checkbox"
                  checked={selectedOfferIds.includes(offer.id)}
                  onChange={() => onToggle(offer.id)}
                  className="h-4 w-4 appearance-none rounded-full border-2 border-[var(--muted)]/60 bg-[var(--surface-soft)] checked:bg-[var(--color-primary)] checked:border-[var(--color-primary)] focus:outline-none transition-all cursor-pointer relative after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-transparent checked:after:bg-white"
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--text)] text-xs">{offer.title}</p>
                  <p className="truncate text-[11px] text-[var(--muted)]">{offer.code || offer.ctaLabel || offer.description}</p>
                </div>
                <p className="truncate text-xs font-semibold text-[var(--text)]/80 capitalize">{offer.storeName || "-"}</p>
                <div>
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${isCoupon
                      ? "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400"
                      : "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"
                    }`}>
                    {offer.type || "Coupon"}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--muted)] text-[10px] font-bold uppercase tracking-wider bg-[var(--surface-soft)] px-2 py-0.5 rounded border border-[var(--border)]">
                    {offer.source || "Manual"}
                  </span>
                </div>
                <div className="text-right pr-4 text-xs font-semibold text-[var(--muted)]">
                  {dateStr}
                </div>
              </label>
            );
          })
        ) : (
          <div className="px-4 py-6 text-sm text-[var(--muted)]">No coupons matched your search.</div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-[var(--muted)] font-semibold">
        <span>
          Showing {visibleOffers.length} of {filteredOffers.length} coupons
        </span>
        {hasMore ? (
          <Button type="button" variant="outline" size="sm" className="text-xs font-bold rounded-lg" onClick={onLoadMore}>
            Load More
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function ProductSelectionList({ products, selectedProductIds, onToggle, searchValue, onSearchChange, visibleCount, onLoadMore }) {
  const deferredSearchValue = useDeferredValue(searchValue);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = deferredSearchValue.trim().toLowerCase();

    if (!normalizedQuery) {
      return products;
    }

    return products.filter((product) => {
      const fields = [product.title, product.storeName, product.status, product.description];
      return fields.some((field) => String(field || "").toLowerCase().includes(normalizedQuery));
    });
  }, [deferredSearchValue, products]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleProducts.length < filteredProducts.length;

  return (
    <div className="grid gap-4">
      <label className="grid gap-2 text-sm text-[var(--muted)]">
        <span className="font-bold text-[var(--text)] text-xs">Search Products</span>
        <Input
          className="rounded-xl h-10 text-xs bg-[var(--surface)] border-[var(--border)] focus:bg-[var(--surface-soft)]"
          value={searchValue}
          onChange={onSearchChange}
          placeholder="Search by title, store, status, or description"
        />
      </label>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="hidden grid-cols-[40px_40px_minmax(0,2fr)_minmax(0,1fr)_120px_100px] gap-3 border-b border-[var(--border)] bg-[var(--surface-soft)]/50 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] items-center md:grid">
          <span>#</span>
          <span>Select</span>
          <span>Product Description</span>
          <span>Store</span>
          <span>Price</span>
          <span className="text-right pr-4">Status</span>
        </div>

        {visibleProducts.length ? (
          visibleProducts.map((product, index) => (
            <label
              key={product.id}
              className="flex cursor-pointer gap-4 border-b border-[var(--border)]/50 px-4 py-4 transition last:border-b-0 hover:bg-[var(--surface-soft)]/60 md:grid md:grid-cols-[40px_40px_minmax(0,2fr)_minmax(0,1fr)_120px_100px] md:items-center md:gap-3 md:py-3"
            >
              <span className="text-xs text-[var(--muted)] font-mono hidden md:inline">{(index + 1).toString().padStart(2, '0')}</span>
              <input
                type="checkbox"
                checked={selectedProductIds.includes(product.id)}
                onChange={() => onToggle(product.id)}
                className="h-4 w-4 shrink-0 appearance-none rounded-full border-2 border-[var(--muted)]/60 bg-[var(--surface-soft)] checked:bg-[var(--color-primary)] checked:border-[var(--color-primary)] focus:outline-none transition-all cursor-pointer relative after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-transparent checked:after:bg-white"
              />
              <div className="min-w-0 flex-1 md:flex-none">
                <div className="flex min-w-0 items-start justify-between gap-3 md:block">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--text)] text-xs">{product.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--muted)] md:truncate">
                      {product.description || product.status || "Product"}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs font-bold text-[var(--color-primary)] md:hidden">${product.price ?? 0}</p>
                </div>
              </div>
              <p className="hidden truncate text-xs font-semibold text-[var(--text)]/80 capitalize md:block">{product.storeName || "-"}</p>
              <div className="hidden md:block">
                <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 dark:text-emerald-400">
                  ${product.price ?? 0}
                </span>
              </div>
              <div className="hidden md:block text-right pr-4">
                <span className="text-[var(--muted)] text-[10px] font-bold uppercase tracking-wider bg-[var(--surface-soft)] px-2 py-0.5 rounded border border-[var(--border)]">
                  {product.status || "Active"}
                </span>
              </div>
            </label>
          ))
        ) : (
          <div className="px-4 py-6 text-sm text-[var(--muted)]">No products matched your search.</div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-[var(--muted)] font-semibold">
        <span>
          Showing {visibleProducts.length} of {filteredProducts.length} products
        </span>
        {hasMore ? (
          <Button type="button" variant="outline" size="sm" className="text-xs font-bold rounded-lg" onClick={onLoadMore}>
            Load More
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminHomepageSectionsManager() {
  const [sections, setSections] = useState(initialState);
  const [stores, setStores] = useState([]);
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [trendingStoreSearch, setTrendingStoreSearch] = useState("");
  const [featuredOfferSearch, setFeaturedOfferSearch] = useState("");
  const [featuredProductSearch, setFeaturedProductSearch] = useState("");
  const [trendingVisibleCount, setTrendingVisibleCount] = useState(10);
  const [featuredVisibleCount, setFeaturedVisibleCount] = useState(10);
  const [featuredProductVisibleCount, setFeaturedProductVisibleCount] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [sectionsResponse, storesResponse, offersResponse, productsResponse] = await Promise.all([
          fetch("/api/homepage/sections", { cache: "no-store" }),
          fetch("/api/stores", { cache: "no-store" }),
          fetch("/api/offers", { cache: "no-store" }),
          fetch("/api/products", { cache: "no-store" }),
        ]);

        const [sectionsPayload, storesPayload, offersPayload, productsPayload] = await Promise.all([
          sectionsResponse.json(),
          storesResponse.json(),
          offersResponse.json(),
          productsResponse.json(),
        ]);

        if (!sectionsResponse.ok) {
          throw new Error(sectionsPayload.error || "Unable to load homepage sections.");
        }

        if (active) {
          setSections({ ...initialState, ...sectionsPayload.data });
          const rawStores = storesPayload.data || [];
          const filteredStores = rawStores.filter(
            (store) =>
              !store.name.toLowerCase().includes("test") &&
              !store.slug.toLowerCase().includes("test")
          );
          setStores(filteredStores);
          setOffers(offersPayload.data || []);
          setProducts(productsPayload.data || []);
        }
      } catch (error) {
        toast.error(error.message);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setTrendingVisibleCount(10);
  }, [trendingStoreSearch]);

  useEffect(() => {
    setFeaturedVisibleCount(10);
  }, [featuredOfferSearch]);

  useEffect(() => {
    setFeaturedProductVisibleCount(10);
  }, [featuredProductSearch]);

  function updateSectionField(sectionKey, field, value) {
    setSections((current) => ({
      ...current,
      [sectionKey]: {
        ...current[sectionKey],
        [field]: value,
      },
    }));
  }

  function toggleStoreSelection(sectionKey, storeSlug) {
    setSections((current) => {
      const selectedStoreSlugs = current[sectionKey].selectedStoreSlugs || [];
      const exists = selectedStoreSlugs.includes(storeSlug);

      return {
        ...current,
        [sectionKey]: {
          ...current[sectionKey],
          selectedStoreSlugs: exists
            ? selectedStoreSlugs.filter((slug) => slug !== storeSlug)
            : [...selectedStoreSlugs, storeSlug],
        },
      };
    });
  }

  function toggleOfferSelection(offerId) {
    setSections((current) => {
      const selectedOfferIds = current.featuredCoupons.selectedOfferIds || [];
      const exists = selectedOfferIds.includes(offerId);

      return {
        ...current,
        featuredCoupons: {
          ...current.featuredCoupons,
          selectedOfferIds: exists
            ? selectedOfferIds.filter((id) => id !== offerId)
            : [...selectedOfferIds, offerId],
        },
      };
    });
  }

  function toggleProductSelection(productId) {
    setSections((current) => {
      const selectedProductIds = current.featuredProducts.selectedProductIds || [];
      const exists = selectedProductIds.includes(productId);

      return {
        ...current,
        featuredProducts: {
          ...current.featuredProducts,
          selectedProductIds: exists
            ? selectedProductIds.filter((id) => id !== productId)
            : [...selectedProductIds, productId],
        },
      };
    });
  }

  async function saveSections() {
    try {
      setIsSaving(true);
      const response = await fetch("/api/homepage/sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to save homepage sections.");
      }

      setSections({ ...initialState, ...payload.data });
      toast.success("Homepage sections saved.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <CardContent className="py-12 text-sm text-[var(--muted)] text-center font-semibold">
          Loading homepage sections...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <CardHeader className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 lg:flex-row lg:items-center lg:justify-between p-6">
        <div>
          <CardTitle className="text-base font-bold tracking-tight text-[var(--text)]">Homepage Sections Manager</CardTitle>
          <CardDescription className="text-xs text-[var(--muted)] mt-0.5">Choose exactly which stores, coupons, and products appear on the homepage.</CardDescription>
        </div>
        <Button
          type="button"
          size="md"
          className="rounded-xl font-bold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-sm transition-all duration-200 px-4 py-2 cursor-pointer text-xs"
          onClick={saveSections}
          disabled={isSaving}
          leadingIcon={isSaving ? <Spinner /> : null}
        >
          {isSaving ? "Saving Sections..." : "Save Sections"}
        </Button>
      </CardHeader>
      <CardContent className="grid gap-6 p-6">
        <SettingsSection
          title="Trending Stores"
          description="Select the stores that appear in the Trending Stores section on the homepage."
        >
          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              <span className="font-bold text-[var(--text)] text-xs">Section Title</span>
              <Input
                className="rounded-xl h-10 text-xs bg-[var(--surface)] border-[var(--border)] focus:bg-[var(--surface-soft)]"
                value={sections.trendingStores.title}
                onChange={(event) => updateSectionField("trendingStores", "title", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              <span className="font-bold text-[var(--text)] text-xs">Items Limit</span>
              <Input
                className="rounded-xl h-10 text-xs bg-[var(--surface)] border-[var(--border)] focus:bg-[var(--surface-soft)]"
                type="number"
                min="1"
                max="20"
                value={sections.trendingStores.limit}
                onChange={(event) => updateSectionField("trendingStores", "limit", Number(event.target.value) || 1)}
              />
            </label>
          </div>
          <StoreSelectionList
            stores={stores}
            selectedStoreSlugs={sections.trendingStores.selectedStoreSlugs || []}
            onToggle={(storeSlug) => toggleStoreSelection("trendingStores", storeSlug)}
            searchValue={trendingStoreSearch}
            onSearchChange={(event) => {
              const nextValue = event.target.value;
              startTransition(() => setTrendingStoreSearch(nextValue));
            }}
            visibleCount={trendingVisibleCount}
            onLoadMore={() => setTrendingVisibleCount((current) => current + 10)}
          />
        </SettingsSection>

        <SettingsSection
          title="Featured Coupons"
          description="Select the exact offers that appear in the Featured Coupons section."
        >
          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              <span className="font-bold text-[var(--text)] text-xs">Section Title</span>
              <Input
                className="rounded-xl h-10 text-xs bg-[var(--surface)] border-[var(--border)] focus:bg-[var(--surface-soft)]"
                value={sections.featuredCoupons.title}
                onChange={(event) => updateSectionField("featuredCoupons", "title", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              <span className="font-bold text-[var(--text)] text-xs">Items Limit</span>
              <Input
                className="rounded-xl h-10 text-xs bg-[var(--surface)] border-[var(--border)] focus:bg-[var(--surface-soft)]"
                type="number"
                min="1"
                max="20"
                value={sections.featuredCoupons.limit}
                onChange={(event) => updateSectionField("featuredCoupons", "limit", Number(event.target.value) || 1)}
              />
            </label>
          </div>
          <OfferSelectionList
            offers={offers}
            selectedOfferIds={sections.featuredCoupons.selectedOfferIds || []}
            onToggle={toggleOfferSelection}
            searchValue={featuredOfferSearch}
            onSearchChange={(event) => {
              const nextValue = event.target.value;
              startTransition(() => setFeaturedOfferSearch(nextValue));
            }}
            visibleCount={featuredVisibleCount}
            onLoadMore={() => setFeaturedVisibleCount((current) => current + 10)}
          />
        </SettingsSection>

        <SettingsSection
          title="Featured Products"
          description="Select the products that appear in the Featured Products section on the homepage."
        >
          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              <span className="font-bold text-[var(--text)] text-xs">Section Title</span>
              <Input
                className="rounded-xl h-10 text-xs bg-[var(--surface)] border-[var(--border)] focus:bg-[var(--surface-soft)]"
                value={sections.featuredProducts.title}
                onChange={(event) => updateSectionField("featuredProducts", "title", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              <span className="font-bold text-[var(--text)] text-xs">Items Limit</span>
              <Input
                className="rounded-xl h-10 text-xs bg-[var(--surface)] border-[var(--border)] focus:bg-[var(--surface-soft)]"
                type="number"
                min="1"
                max="20"
                value={sections.featuredProducts.limit}
                onChange={(event) => updateSectionField("featuredProducts", "limit", Number(event.target.value) || 1)}
              />
            </label>
          </div>
          <ProductSelectionList
            products={products}
            selectedProductIds={sections.featuredProducts.selectedProductIds || []}
            onToggle={toggleProductSelection}
            searchValue={featuredProductSearch}
            onSearchChange={(event) => {
              const nextValue = event.target.value;
              startTransition(() => setFeaturedProductSearch(nextValue));
            }}
            visibleCount={featuredProductVisibleCount}
            onLoadMore={() => setFeaturedProductVisibleCount((current) => current + 10)}
          />
        </SettingsSection>
      </CardContent>
    </Card>
  );
}
