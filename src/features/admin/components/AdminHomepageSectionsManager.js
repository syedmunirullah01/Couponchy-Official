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
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/35 p-4 sm:p-5">
      <div className="mb-4">
        <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
        {description ? <p className="mt-1 text-xs text-[var(--muted)]">{description}</p> : null}
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
        <span className="font-medium text-[var(--text)]">Search Stores</span>
        <Input value={searchValue} onChange={onSearchChange} placeholder="Search by name, slug, category, or description" />
      </label>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="grid grid-cols-[auto_minmax(0,1.4fr)_minmax(0,0.8fr)_90px] gap-3 border-b border-[var(--border)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          <span>Select</span>
          <span>Store</span>
          <span>Category</span>
          <span>Offers</span>
        </div>

        {visibleStores.length ? (
          visibleStores.map((store) => (
            <label
              key={store.slug}
              className="grid cursor-pointer grid-cols-[auto_minmax(0,1.4fr)_minmax(0,0.8fr)_90px] gap-3 border-b border-[var(--border)] px-4 py-3 transition last:border-b-0 hover:bg-[var(--surface-soft)]"
            >
              <input
                type="checkbox"
                checked={selectedStoreSlugs.includes(store.slug)}
                onChange={() => onToggle(store.slug)}
                className="mt-1 h-4 w-4 rounded border border-[var(--border)] bg-[var(--surface-soft)] accent-[var(--color-primary)]"
              />
              <div className="min-w-0">
                <p className="truncate font-medium text-[var(--text)]">{store.name}</p>
                <p className="truncate text-sm text-[var(--muted)]">{store.description || store.slug}</p>
              </div>
              <p className="truncate text-sm text-[var(--muted)]">{store.category || "-"}</p>
              <p className="text-sm font-medium text-[var(--color-primary)]">{store.offersCount || 0}</p>
            </label>
          ))
        ) : (
          <div className="px-4 py-6 text-sm text-[var(--muted)]">No stores matched your search.</div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
        <span>
          Showing {visibleStores.length} of {filteredStores.length} stores
        </span>
        {hasMore ? (
          <Button type="button" variant="outline" size="sm" onClick={onLoadMore}>
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
        <span className="font-medium text-[var(--text)]">Search Coupons</span>
        <Input value={searchValue} onChange={onSearchChange} placeholder="Search by title, store, type, code, or description" />
      </label>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="grid grid-cols-[auto_minmax(0,1.4fr)_minmax(0,0.9fr)_120px] gap-3 border-b border-[var(--border)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          <span>Select</span>
          <span>Coupon</span>
          <span>Store</span>
          <span>Type</span>
        </div>

        {visibleOffers.length ? (
          visibleOffers.map((offer) => (
            <label
              key={offer.id}
              className="grid cursor-pointer grid-cols-[auto_minmax(0,1.4fr)_minmax(0,0.9fr)_120px] gap-3 border-b border-[var(--border)] px-4 py-3 transition last:border-b-0 hover:bg-[var(--surface-soft)]"
            >
              <input
                type="checkbox"
                checked={selectedOfferIds.includes(offer.id)}
                onChange={() => onToggle(offer.id)}
                className="mt-1 h-4 w-4 rounded border border-[var(--border)] bg-[var(--surface-soft)] accent-[var(--color-primary)]"
              />
              <div className="min-w-0">
                <p className="truncate font-medium text-[var(--text)]">{offer.title}</p>
                <p className="truncate text-sm text-[var(--muted)]">{offer.code || offer.ctaLabel || offer.description}</p>
              </div>
              <p className="truncate text-sm text-[var(--muted)]">{offer.storeName || "-"}</p>
              <p className="truncate text-sm font-medium text-[var(--color-primary)]">{offer.type || "-"}</p>
            </label>
          ))
        ) : (
          <div className="px-4 py-6 text-sm text-[var(--muted)]">No coupons matched your search.</div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
        <span>
          Showing {visibleOffers.length} of {filteredOffers.length} coupons
        </span>
        {hasMore ? (
          <Button type="button" variant="outline" size="sm" onClick={onLoadMore}>
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
        <span className="font-medium text-[var(--text)]">Search Products</span>
        <Input value={searchValue} onChange={onSearchChange} placeholder="Search by title, store, status, or description" />
      </label>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="hidden grid-cols-[auto_minmax(0,1.5fr)_minmax(0,0.8fr)_110px] gap-3 border-b border-[var(--border)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)] md:grid">
          <span>Select</span>
          <span>Product</span>
          <span>Store</span>
          <span>Price</span>
        </div>

        {visibleProducts.length ? (
          visibleProducts.map((product) => (
            <label
              key={product.id}
              className="flex cursor-pointer gap-4 border-b border-[var(--border)] px-4 py-4 transition last:border-b-0 hover:bg-[var(--surface-soft)] md:grid md:grid-cols-[auto_minmax(0,1.5fr)_minmax(0,0.8fr)_110px] md:items-start md:gap-3 md:py-3"
            >
              <input
                type="checkbox"
                checked={selectedProductIds.includes(product.id)}
                onChange={() => onToggle(product.id)}
                className="mt-1 h-4 w-4 shrink-0 rounded border border-[var(--border)] bg-[var(--surface-soft)] accent-[var(--color-primary)]"
              />
              <div className="min-w-0 flex-1 md:flex-none">
                <div className="flex min-w-0 items-start justify-between gap-3 md:block">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--text)]">{product.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)] md:truncate">
                      {product.description || product.status || "Product"}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium text-[var(--color-primary)] md:hidden">${product.price ?? 0}</p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-[var(--muted)] md:hidden">
                  <span className="rounded-full border border-[var(--border)] px-2 py-1">{product.storeName || "Unknown store"}</span>
                  <span className="rounded-full border border-[var(--border)] px-2 py-1">{product.status || "Active"}</span>
                </div>
              </div>
              <p className="hidden truncate text-sm text-[var(--muted)] md:block">{product.storeName || "-"}</p>
              <p className="hidden truncate text-sm font-medium text-[var(--color-primary)] md:block">${product.price ?? 0}</p>
            </label>
          ))
        ) : (
          <div className="px-4 py-6 text-sm text-[var(--muted)]">No products matched your search.</div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
        <span>
          Showing {visibleProducts.length} of {filteredProducts.length} products
        </span>
        {hasMore ? (
          <Button type="button" variant="outline" size="sm" onClick={onLoadMore}>
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
  const [latestStoreSearch, setLatestStoreSearch] = useState("");
  const [trendingVisibleCount, setTrendingVisibleCount] = useState(10);
  const [featuredVisibleCount, setFeaturedVisibleCount] = useState(10);
  const [featuredProductVisibleCount, setFeaturedProductVisibleCount] = useState(10);
  const [latestVisibleCount, setLatestVisibleCount] = useState(10);
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
          setStores(storesPayload.data || []);
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

  useEffect(() => {
    setLatestVisibleCount(10);
  }, [latestStoreSearch]);

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
      <Card>
        <CardContent className="py-12 text-sm text-[var(--muted)]">Loading homepage sections...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <CardTitle>Homepage Sections</CardTitle>
          <CardDescription>Choose exactly which stores and offers should appear in the sections below the hero.</CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={saveSections} disabled={isSaving} leadingIcon={isSaving ? <Spinner /> : null}>
          {isSaving ? "Saving Sections..." : "Save Sections"}
        </Button>
      </CardHeader>
      <CardContent className="grid gap-5">
        <SettingsSection
          title="Trending Stores"
          description="Select the stores that should appear in the Trending Stores section on the homepage."
        >
          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              <span className="font-medium text-[var(--text)]">Section Title</span>
              <Input
                value={sections.trendingStores.title}
                onChange={(event) => updateSectionField("trendingStores", "title", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              <span className="font-medium text-[var(--text)]">Items Limit</span>
              <Input
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
          description="Select the exact offers that should appear in the Featured Coupons section."
        >
          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              <span className="font-medium text-[var(--text)]">Section Title</span>
              <Input
                value={sections.featuredCoupons.title}
                onChange={(event) => updateSectionField("featuredCoupons", "title", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              <span className="font-medium text-[var(--text)]">Items Limit</span>
              <Input
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
          description="Select the products that should appear in the Featured Products section on the homepage."
        >
          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              <span className="font-medium text-[var(--text)]">Section Title</span>
              <Input
                value={sections.featuredProducts.title}
                onChange={(event) => updateSectionField("featuredProducts", "title", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              <span className="font-medium text-[var(--text)]">Items Limit</span>
              <Input
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

        <SettingsSection
          title="Latest Stores"
          description="Select the stores that should appear in the Latest Stores section."
        >
          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              <span className="font-medium text-[var(--text)]">Section Title</span>
              <Input
                value={sections.latestStores.title}
                onChange={(event) => updateSectionField("latestStores", "title", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              <span className="font-medium text-[var(--text)]">Items Limit</span>
              <Input
                type="number"
                min="1"
                max="20"
                value={sections.latestStores.limit}
                onChange={(event) => updateSectionField("latestStores", "limit", Number(event.target.value) || 1)}
              />
            </label>
          </div>
          <StoreSelectionList
            stores={stores}
            selectedStoreSlugs={sections.latestStores.selectedStoreSlugs || []}
            onToggle={(storeSlug) => toggleStoreSelection("latestStores", storeSlug)}
            searchValue={latestStoreSearch}
            onSearchChange={(event) => {
              const nextValue = event.target.value;
              startTransition(() => setLatestStoreSearch(nextValue));
            }}
            visibleCount={latestVisibleCount}
            onLoadMore={() => setLatestVisibleCount((current) => current + 10)}
          />
        </SettingsSection>
      </CardContent>
    </Card>
  );
}
