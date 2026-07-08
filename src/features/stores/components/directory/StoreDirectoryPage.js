"use client";

import { useState, useMemo, useEffect } from "react";
import BreadcrumbBar from "./BreadcrumbBar";
import CategoryFilter from "./CategoryFilter";
import Pagination from "./Pagination";
import StoreGrid from "./StoreGrid";

export default function StoreDirectoryPage({ breadcrumbItems, categories: initialCategories, stores, searchValue }) {
  const trimmedSearch = String(searchValue || "").trim();
  const hasSearch = Boolean(trimmedSearch);

  // States
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20); // Default to 5 rows on desktop (4 * 5 = 20)

  // Adjust items per page dynamically to always render exactly 5 rows
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setItemsPerPage(20); // 4 columns * 5 rows
      } else if (window.innerWidth >= 768) {
        setItemsPerPage(15); // 3 columns * 5 rows
      } else {
        setItemsPerPage(10); // 2 columns * 5 rows
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Parse URL search parameters on mount to pre-filter by category
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get("category");
      if (catParam) {
        const matchedStore = stores.find(
          (s) => s.categorySlug === catParam || s.category?.toLowerCase() === catParam.toLowerCase()
        );
        if (matchedStore?.category) {
          setSelectedCategory(matchedStore.category);
        }
      }
    }
  }, [stores]);

  // Filter stores client-side if a category is selected
  const filteredStores = useMemo(() => {
    if (!selectedCategory) return stores;
    return stores.filter(store => store.category === selectedCategory);
  }, [stores, selectedCategory]);

  // Dynamic categories list with active state
  const categoriesList = useMemo(() => {
    const uniqueCategories = [...new Set(stores.map(s => s.category))].filter(Boolean);
    return uniqueCategories.map(cat => ({
      name: cat,
      active: selectedCategory === cat
    }));
  }, [stores, selectedCategory]);

  // Pagination Math
  const totalPages = Math.ceil(filteredStores.length / itemsPerPage) || 1;

  // Reset to page 1 if category filter changes
  const handleCategorySelect = (categoryName) => {
    if (selectedCategory === categoryName) {
      setSelectedCategory(null); // toggle off
    } else {
      setSelectedCategory(categoryName);
    }
    setCurrentPage(1);
  };

  const paginatedStores = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStores.slice(start, start + itemsPerPage);
  }, [filteredStores, currentPage]);

  return (
    <>
      <BreadcrumbBar breadcrumbItems={breadcrumbItems} />
      <div className="mx-auto max-w-[1240px] px-4 py-8 sm:py-10 lg:py-12">
        <div className="relative mb-12 overflow-hidden rounded-[32px] border border-[var(--color-primary)]/20 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.12),transparent_35%)] bg-[#0c0a0f] p-6 sm:p-10 lg:p-12 shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          {/* Glow orb */}
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[var(--color-primary)]/10 blur-[80px] pointer-events-none" />

          {/* Right side floating glass illustration (Experience level design) */}
          <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2 w-[280px] h-[180px] pointer-events-none select-none">
            <div className="relative w-full h-full">
              {/* Layer 1: Glowing orb behind */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-primary-hover)] rounded-2xl opacity-15 blur-xl" />
              
              {/* Layer 2: Floating Coupon card */}
              <div className="absolute right-4 top-2 w-[200px] h-[110px] rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-4 rotate-6 shadow-[0_20px_40px_rgba(139,92,246,0.25)]">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                  <span className="text-[7.5px] font-black uppercase tracking-wider text-[var(--color-primary)]">Verified Partner</span>
                </div>
                <div className="mt-2.5 text-lg font-black text-white tracking-wider">STORES</div>
                <div className="mt-0.5 text-[8.5px] font-semibold text-white/40">Verified Coupons</div>
                <div className="mt-3 pt-1.5 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[7.5px] font-bold text-white/30">UPDATED: 24H</span>
                  <span className="text-[7.5px] font-bold text-[var(--color-primary)]">COUPONCHY</span>
                </div>
              </div>

              {/* Layer 3: Second overlapping floating card */}
              <div className="absolute left-2 bottom-1 w-[180px] h-[95px] rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-3.5 -rotate-6 shadow-[0_20px_40px_rgba(139,92,246,0.25)]">
                <div className="text-[7.5px] font-black uppercase tracking-wider text-[var(--color-primary)]">Total Catalog</div>
                <div className="mt-1 text-[13px] font-black text-white tracking-tight">ACTIVE BRANDS</div>
                <div className="mt-2.5 pt-1.5 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[7.5px] font-semibold text-white/30">Top Savings</span>
                  <div className="flex -space-x-1.5">
                    <div className="h-4 w-4 rounded-full bg-[var(--color-primary)] border border-black/30 text-[6.5px] flex items-center justify-center font-black text-white">DEAL</div>
                    <div className="h-4 w-4 rounded-full bg-[var(--color-primary-hover)] border border-black/30 text-[6.5px] flex items-center justify-center font-black text-white">%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 max-w-2xl lg:max-w-[640px]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] shadow-[0_0_15px_rgba(139,92,246,0.1)]">
              Brands & Merchants
            </span>
            <h1 className="mt-4 text-[28px] sm:text-4xl lg:text-[54px] font-black tracking-[-0.04em] leading-[1.12] text-white">
                Browse{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] drop-shadow-[0_0_15px_rgba(139,92,246,0.2)]">
               Our Store Directory
              </span>
            </h1>
            <p className="mt-4 text-xs sm:text-base leading-6 sm:leading-7 text-[var(--muted)]/90">
              Browse through our fully verified list of retail stores and online brands. Choose a merchant to discover the latest active coupons, exclusive deals, and promo codes.
            </p>

            {hasSearch && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md px-5 py-4 max-w-md shadow-lg">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)]">Active Query</p>
                <p className="mt-1.5 text-sm text-white/95">
                  Showing results for: <span className="font-bold text-[var(--color-primary)]">&quot;{trimmedSearch}&quot;</span>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-8 lg:flex-row">
          {categoriesList.length ? (
            <CategoryFilter
              categories={categoriesList}
              onCategorySelect={handleCategorySelect}
            />
          ) : null}
          <div className="flex-1">
            {paginatedStores.length ? (
              <>
                <StoreGrid stores={paginatedStores} />
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            ) : (
              <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
                <p className="text-xl font-semibold text-[var(--text)]">
                  {hasSearch ? `No stores found for "${trimmedSearch}"` : "No stores have been added yet"}
                </p>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  {hasSearch
                    ? "Try another store name, category, or slug to find matching results."
                    : "Add your first store from the admin dashboard to start building the catalog."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
