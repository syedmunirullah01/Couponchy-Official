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
      <div className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="relative mb-12 overflow-hidden rounded-[32px] border border-white/5 bg-gradient-to-br from-[#0c0c0f] to-[#07070a] p-8 sm:p-12 lg:p-14 shadow-2xl">
          {/* Radial ambient glow */}
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-[var(--accent)]/5 blur-[120px] pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-[var(--accent)]/3 blur-[120px] pointer-events-none" />

          {/* Grid background overlay */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
              backgroundSize: "24px 24px"
            }}
          />

          <div className="relative z-10 max-w-2xl">
            <span className="rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-3.5 py-1.5 text-[9px] font-black uppercase tracking-[0.25em] text-[var(--accent)]">
              BRANDS & MERCHANTS
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-[-0.05em] leading-tight text-white">
              Store{" "}<span className="bg-gradient-to-r from-white via-white to-[var(--color-primary-hover)] bg-clip-text text-transparent">Directory</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/50 sm:text-base">
              Browse through our fully verified list of retail stores and online brands. Choose a merchant to discover the latest active coupons, exclusive deals, and promo codes.
            </p>

            {hasSearch && (
              <div className="mt-8 rounded-2xl border border-[var(--border)] bg-black/40 px-5 py-4 max-w-md">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">Active Query</p>
                <p className="mt-1.5 text-sm text-white">
                  Showing results for: <span className="font-bold text-[var(--accent)]">&quot;{trimmedSearch}&quot;</span>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
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
