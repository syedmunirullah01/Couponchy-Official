"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ConfirmModal } from "@/components/ui/AppModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { cn } from "@/lib/utils";
import { SUPPORTED_COUNTRIES, sanitizeCountryList } from "@/lib/countries";

const initialForm = {
  title: "",
  description: "",
  image: "",
  price: "",
  originalPrice: "",
  currency: "$",
  ctaLabel: "View Product",
  productUrl: "",
  status: "Active",
  storeSlug: "",
  storeName: "",
};

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" className="stroke-current opacity-25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" className="stroke-current" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function AdminProductsManager() {
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedStoreFilter, setSelectedStoreFilter] = useState("all");
  const [countries, setCountries] = useState(SUPPORTED_COUNTRIES);
  const [selectedCountryFilter, setSelectedCountryFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");


  const filteredStoresForSelect = useMemo(() => {
    const sorted = [...stores].sort((a, b) => {
      const dateA = a.createdAt || a.created_at || 0;
      const dateB = b.createdAt || b.created_at || 0;
      return new Date(dateB) - new Date(dateA);
    });

    if (!storeSearch) return sorted;
    const lowerQuery = storeSearch.toLowerCase();
    return sorted.filter((store) => {
      const name = (store.name || "").toLowerCase();
      const slug = (store.slug || "").toLowerCase();
      return name.includes(lowerQuery) || slug.includes(lowerQuery);
    });
  }, [stores, storeSearch]);


  const visibleProducts = useMemo(() => {
    const storeMap = new Map(stores.map((s) => [s.slug, s]));
    let result = products;

    if (selectedCountryFilter !== "all") {
      result = result.filter((product) => {
        const store = storeMap.get(product.storeSlug);
        const countryCode = store?.countryCode || "US";
        return countryCode.toLowerCase() === selectedCountryFilter.toLowerCase();
      });
    }

    if (selectedStoreFilter !== "all") {
      result = result.filter((product) => product.storeSlug === selectedStoreFilter);
    }

    return result;
  }, [products, stores, selectedStoreFilter, selectedCountryFilter]);

  const filteredStoresForFilter = useMemo(() => {
    if (selectedCountryFilter === "all") return stores;
    return stores.filter(
      (store) => (store.countryCode || "").toLowerCase() === selectedCountryFilter.toLowerCase()
    );
  }, [stores, selectedCountryFilter]);

  useEffect(() => {
    setSelectedStoreFilter("all");
  }, [selectedCountryFilter]);

  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return visibleProducts;
    const lowerQuery = searchQuery.toLowerCase();
    return visibleProducts.filter((product) => {
      const title = (product.title || "").toLowerCase();
      const desc = (product.description || "").toLowerCase();
      const storeName = (product.storeName || "").toLowerCase();
      return title.includes(lowerQuery) || desc.includes(lowerQuery) || storeName.includes(lowerQuery);
    });
  }, [visibleProducts, searchQuery]);

  async function loadData() {
    const [productsResponse, storesResponse, countriesResponse] = await Promise.all([
      fetch("/api/products", { cache: "no-store" }),
      fetch("/api/stores", { cache: "no-store" }),
      fetch("/api/public/countries", { cache: "no-store" }),
    ]);

    const [productsPayload, storesPayload, countriesPayload] = await Promise.all([
      productsResponse.json(),
      storesResponse.json(),
      countriesResponse.json(),
    ]);
    setProducts(productsPayload.data || []);
    setStores(storesPayload.data || []);
    setCountries(sanitizeCountryList(countriesPayload.data || SUPPORTED_COUNTRIES));
  }

  useEffect(() => {
    let active = true;

    async function hydrateData() {
      const [productsResponse, storesResponse, countriesResponse] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }),
        fetch("/api/stores", { cache: "no-store" }),
        fetch("/api/public/countries", { cache: "no-store" }),
      ]);

      const [productsPayload, storesPayload, countriesPayload] = await Promise.all([
        productsResponse.json(),
        storesResponse.json(),
        countriesResponse.json(),
      ]);

      if (active) {
        setProducts(productsPayload.data || []);
        setStores(storesPayload.data || []);
        setCountries(sanitizeCountryList(countriesPayload.data || SUPPORTED_COUNTRIES));
      }
    }

    hydrateData();

    return () => {
      active = false;
    };
  }, []);

  function handleOpenCreate() {
    setEditingProduct(null);
    setForm(initialForm);
    setActiveTab("details");
    setError("");
    setOpen(true);
  }

  function handleOpenEdit(product) {
    setEditingProduct(product);
    setForm({
      title: product.title,
      description: product.description || "",
      image: product.image || "",
      price: String(product.price ?? ""),
      originalPrice: product.originalPrice == null ? "" : String(product.originalPrice),
      currency: product.currency || "$",
      ctaLabel: product.ctaLabel || "View Product",
      productUrl: product.productUrl || "",
      status: product.status || "Active",
      storeSlug: product.storeSlug,
      storeName: product.storeName,
    });
    setActiveTab("details");
    setError("");
    setOpen(true);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    const nextState = { ...form, [name]: value };

    if (name === "storeSlug") {
      const matchedStore = stores.find((store) => store.slug === value);
      nextState.storeName = matchedStore?.name || "";
      nextState.productUrl = matchedStore?.affiliateLink || "";
    }

    setForm(nextState);
  }

  function validateImageFile(file) {
    if (!file) {
      return "Please choose a product image.";
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return "Product image must be PNG, JPG, WEBP, or SVG.";
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return "Product image must be 2MB or smaller.";
    }

    return null;
  }

  async function handleImageSelection(file) {
    const validationMessage = validateImageFile(file);

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    try {
      setIsUploadingImage(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "slug",
        `${form.storeSlug || "product"}-${form.title || file.name}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );

      const response = await fetch("/api/uploads/product-image", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to upload product image.");
      }

      setForm((current) => ({
        ...current,
        image: payload.data.secureUrl,
      }));
    } catch (uploadError) {
      setError(uploadError.message || "Unable to upload product image.");
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const endpoint = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
    const method = editingProduct ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error || "Unable to save product.");
      setIsSubmitting(false);
      return;
    }

    await loadData();
    setOpen(false);
    setForm(initialForm);
    setEditingProduct(null);
    setIsSubmitting(false);
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    const response = await fetch(`/api/products/${deleteTarget.id}`, { method: "DELETE" });

    if (!response.ok) {
      setIsDeleting(false);
      return;
    }

    setDeleteTarget(null);
    setIsDeleting(false);
    await loadData();
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 lg:flex-row lg:items-center lg:justify-between p-6">
          <div>
            <CardTitle className="text-base font-bold tracking-tight text-[var(--text)]">Products</CardTitle>
            <CardDescription className="text-xs text-[var(--muted)] mt-0.5">Manage store-linked products that appear after coupons and deals on store pages.</CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={selectedCountryFilter}
              onChange={(event) => setSelectedCountryFilter(event.target.value)}
              className="h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-xs font-bold text-[var(--text)] outline-none cursor-pointer"
            >
              <option value="all">All countries</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
            <select
              value={selectedStoreFilter}
              onChange={(event) => setSelectedStoreFilter(event.target.value)}
              className="h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-xs font-bold text-[var(--text)] outline-none cursor-pointer"
            >
              <option value="all">All stores</option>
              {filteredStoresForFilter.map((store) => (
                <option key={store.slug} value={store.slug}>
                  {store.name}
                </option>
              ))}
            </select>
            <Button type="button" variant="ghost" size="sm" className="h-10 w-10 rounded-xl border border-[var(--border)] px-0 bg-[var(--surface)] hover:bg-[var(--surface-soft)] transition" onClick={loadData} aria-label="Refresh products">
              <RefreshIcon />
            </Button>
            <Button type="button" className="rounded-xl font-bold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-sm transition-all duration-200 px-4 py-2 cursor-pointer text-xs h-10" onClick={handleOpenCreate}>
              Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <Table>
              <TableHeader className="bg-[var(--surface-soft)]/50">
                <TableRow className="border-b border-[var(--border)] hover:bg-transparent">
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-4">Product</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-4">Store</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-4">Price</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-4">Status</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-4">Edit/Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--surface-soft)]/30 transition-colors duration-150">
                    <TableCell className="px-4 py-3 text-xs">
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-0.5">
                            <Image src={product.image} alt={product.title} fill className="object-cover rounded-md" unoptimized />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-[10px] font-bold text-[var(--muted)]">
                            N/A
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--text)] truncate">{product.title}</p>
                          <p className="text-[10px] text-[var(--muted)] truncate max-w-[250px] mt-0.5">{product.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs font-semibold text-[var(--text)]">{product.storeName}</TableCell>
                    <TableCell className="px-4 py-3 text-xs font-mono">
                      {product.originalPrice ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-[var(--text)]">{product.currency || "$"}{Number(product.price).toFixed(2)}</span>
                          <span className="text-[10px] text-[var(--muted)] line-through">{product.currency || "$"}{Number(product.originalPrice).toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="font-semibold text-[var(--text)]">{product.currency || "$"}{Number(product.price).toFixed(2)}</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                        product.status === "Active"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                          : product.status === "Draft"
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400"
                          : "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400"
                      )}>
                        {product.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 rounded-lg border border-[var(--border)] p-0 text-[var(--muted)] hover:text-[var(--color-primary)] hover:bg-[var(--surface-soft)] cursor-pointer"
                          onClick={() => handleOpenEdit(product)}
                          aria-label={`Edit ${product.title}`}
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 rounded-lg border border-[var(--border)] p-0 text-[var(--muted)] hover:text-red-600 hover:bg-red-500/5 cursor-pointer"
                          onClick={() => setDeleteTarget(product)}
                          aria-label={`Delete ${product.title}`}
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {!filteredProducts.length ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-5 py-6 text-sm text-[var(--muted)]">
              {searchQuery ? "No products match your search query." : "No products found. Add products and assign them to stores from the admin panel."}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-h-[calc(100vh-2rem)] max-w-5xl overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-0 shadow-2xl sm:max-h-[calc(100vh-3rem)]"
        >
          <div className="grid gap-0 lg:grid-cols-[400px_1fr] h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] max-h-[800px] overflow-hidden">
            {/* Left Column - Live Preview & Checklist */}
            <div className="border-b border-[var(--border)] bg-gradient-to-br from-[var(--surface-soft)] via-[var(--surface)] to-[var(--surface-soft)]/30 p-6 lg:border-r lg:border-b-0 lg:p-8 flex flex-col justify-between overflow-y-auto">
              <div>
                <DialogHeader className="mb-6">
                  <span className="w-fit inline-flex items-center rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                    Product Editor
                  </span>
                  <DialogTitle className="text-lg font-bold tracking-tight text-[var(--text)] mt-3">
                    {editingProduct ? "Update Product" : "Add Product"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[var(--muted)] mt-1">
                    Create store-linked products that appear after offers on public store pages.
                  </DialogDescription>
                </DialogHeader>

                {/* Live Preview Storefront Product Card */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Card Preview</span>
                  <div className="relative rounded-2xl border border-[var(--border)]/70 bg-[var(--surface)] p-3 shadow-md overflow-hidden max-w-[280px] mx-auto">
                    {/* Product Image preview */}
                    <div className="relative aspect-square w-full rounded-xl bg-[var(--surface-soft)] border border-[var(--border)]/30 overflow-hidden flex items-center justify-center">
                      {form.image ? (
                        <Image src={form.image} alt="Product preview" fill className="object-cover" unoptimized />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-[var(--muted)]">
                          <svg viewBox="0 0 24 24" className="h-8 w-8 text-[var(--muted)] stroke-current" fill="none" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          <span className="text-[9px] font-bold tracking-wide">No Cover Image</span>
                        </div>
                      )}
                    </div>

                    {/* Product info details */}
                    <div className="mt-3">
                      <span className="inline-flex items-center rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[9px] font-bold text-[var(--color-primary)]">
                        {form.storeName || "Unassigned Store"}
                      </span>
                      <h4 className="mt-1.5 truncate text-xs font-bold text-[var(--text)]">{form.title || "Product Title"}</h4>
                      <p className="mt-1 text-[10px] text-[var(--muted)] line-clamp-2 min-h-[30px] leading-relaxed">
                        {form.description || "Product description will appear here..."}
                      </p>

                      {/* Pricing & CTA */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="font-mono">
                          <span className="text-xs font-bold text-[var(--text)]">{form.currency || "$"}{form.price ? Number(form.price).toFixed(2) : "0.00"}</span>
                          {form.originalPrice ? (
                            <span className="text-[9px] text-[var(--muted)] line-through ml-1.5">{form.currency || "$"}{Number(form.originalPrice).toFixed(2)}</span>
                          ) : null}
                        </div>
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border",
                          form.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : form.status === "Draft"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            : "bg-red-500/10 text-red-600 border-red-500/20"
                        )}>
                          {form.status}
                        </span>
                      </div>

                      {/* CTA Link preview button */}
                      <div className="mt-3 w-full text-center py-2 text-[10px] font-bold rounded-lg bg-[var(--color-primary)] text-white shadow-sm transition">
                        {form.ctaLabel || "View Product"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="mt-6 border-t border-[var(--border)] pt-5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Requirements Checklist</span>
                <ul className="mt-3.5 space-y-2.5 text-xs text-[var(--muted)] font-medium">
                  <li className="flex items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full", form.title && form.storeSlug ? "bg-purple-500" : "bg-[var(--border)]")} />
                    <span>Identity: Title & linked store</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full", form.price ? "bg-blue-500" : "bg-[var(--border)]")} />
                    <span>Pricing: Price & CTA Label attributes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full", form.image ? "bg-emerald-500" : "bg-[var(--border)]")} />
                    <span>Media: High quality cover visual</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column - Forms */}
            <div className="flex flex-col h-full bg-[var(--surface)] overflow-hidden">
              <form className="flex flex-col h-full overflow-hidden" onSubmit={handleSubmit}>
                
                {/* Tab Switcher */}
                <div className="border-b border-[var(--border)] bg-[var(--surface-soft)]/20 px-6 pt-4 flex gap-1 overflow-x-auto scrollbar-none shrink-0">
                  {[
                    { id: "details", label: "Product Details" },
                    { id: "pricing", label: "Pricing & CTA" },
                    { id: "media", label: "Product Media" }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "px-4 py-2.5 text-xs font-bold border-b-2 transition-all duration-150 whitespace-nowrap cursor-pointer -mb-px",
                        activeTab === tab.id
                          ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                          : "border-transparent text-[var(--muted)] hover:text-[var(--text)]"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab scroll viewport */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* Tab 1: details */}
                  {activeTab === "details" && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-0.5">Product Details</h3>
                        <p className="text-[10px] text-[var(--muted)]">Specify titles, summaries, and store taxonomies.</p>
                      </div>

                      <div className="grid gap-4">
                        <div className="grid gap-1.5">
                          <label className="text-xs font-bold text-[var(--text)]">Product Title</label>
                          <Input
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="e.g. Nike Air Max 2026"
                            className="rounded-lg bg-[var(--surface)]"
                            required
                          />
                          <span className="text-[9px] text-[var(--muted)]">Displays prominently in catalogs.</span>
                        </div>

                        <div className="grid gap-1.5">
                          <label className="text-xs font-bold text-[var(--text)]">Description</label>
                          <textarea
                            name="description"
                            rows={4}
                            value={form.description}
                            onChange={handleChange}
                            className="min-h-[110px] w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] outline-none transition focus:border-[var(--color-primary)]"
                            placeholder="Short product description details..."
                          />
                          <span className="text-[9px] text-[var(--muted)]">Light editorial details.</span>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="grid gap-1.5">
                            <label className="text-xs font-bold text-[var(--text)]">Linked Store</label>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
                                className="flex h-10 w-full items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs text-[var(--text)] outline-none focus:border-[var(--color-primary)] text-left cursor-pointer"
                              >
                                <span className={form.storeSlug ? "text-[var(--text)]" : "text-[var(--muted)]"}>
                                  {form.storeName || "Select store"}
                                </span>
                                <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--muted)]" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="m6 9 6 6 6-6" />
                                </svg>
                              </button>

                              {storeDropdownOpen && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setStoreDropdownOpen(false)} />
                                  <div className="absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-[var(--border)] bg-[#0c0c11] p-2 shadow-2xl z-50 flex flex-col gap-1.5 custom-scrollbar">
                                    <input
                                      type="text"
                                      value={storeSearch}
                                      onChange={(e) => setStoreSearch(e.target.value)}
                                      placeholder="Search store..."
                                      autoFocus
                                      className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-soft)]/40 px-3 text-xs text-[var(--text)] outline-none focus:border-[var(--color-primary)] placeholder-[var(--muted)]"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="overflow-y-auto max-h-40 flex flex-col gap-1 pr-1 custom-scrollbar">
                                      {filteredStoresForSelect.length === 0 ? (
                                        <div className="py-4 text-center text-xs text-[var(--muted)] italic">No stores found</div>
                                      ) : (
                                        filteredStoresForSelect.map((store) => {
                                          const isSelected = form.storeSlug === store.slug;
                                          return (
                                            <button
                                              key={store.slug}
                                              type="button"
                                              onClick={() => {
                                                setForm({
                                                  ...form,
                                                  storeSlug: store.slug,
                                                  storeName: store.name,
                                                  productUrl: store.affiliateLink || "",
                                                });
                                                setStoreDropdownOpen(false);
                                                setStoreSearch("");
                                              }}
                                              className={cn(
                                                "w-full rounded-lg px-3 py-2 text-left text-xs transition duration-150 cursor-pointer",
                                                isSelected
                                                  ? "bg-[var(--color-primary)] text-white font-bold"
                                                  : "text-[var(--text)] hover:bg-[var(--surface-soft)]"
                                              )}
                                            >
                                              {store.name}
                                            </button>
                                          );
                                        })
                                      )}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                            <span className="text-[9px] text-[var(--muted)]">Links product to a merchant catalog.</span>

                          </div>

                          <div className="grid gap-1.5">
                            <label className="text-xs font-bold text-[var(--text)]">Stock Status</label>
                            <select
                              name="status"
                              value={form.status}
                              onChange={handleChange}
                              className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs text-[var(--text)] outline-none focus:border-[var(--color-primary)]"
                            >
                              <option value="Active">Active</option>
                              <option value="Draft">Draft</option>
                              <option value="Out of stock">Out of stock</option>
                            </select>
                            <span className="text-[9px] text-[var(--muted)]">Configures purchasing availability.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: pricing */}
                  {activeTab === "pricing" && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-0.5">Pricing & CTA Details</h3>
                        <p className="text-[10px] text-[var(--muted)]">Setup offer prices, original strikes, and labels.</p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-1.5 sm:col-span-2">
                          <label className="text-xs font-bold text-[var(--text)]">Currency Symbol</label>
                          <Input
                            name="currency"
                            value={form.currency}
                            onChange={handleChange}
                            placeholder="e.g. $, €, £, zł"
                            className="rounded-lg bg-[var(--surface)] font-mono"
                            maxLength={5}
                            required
                          />
                          <span className="text-[9px] text-[var(--muted)]">Specify the price currency symbol manually (e.g. $, €, £, zł, Rs).</span>
                        </div>

                        <div className="grid gap-1.5">
                          <label className="text-xs font-bold text-[var(--text)]">Deal Price</label>
                          <Input
                            name="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.price}
                            onChange={handleChange}
                            placeholder="e.g. 99.99"
                            className="rounded-lg bg-[var(--surface)] font-mono"
                            required
                          />
                          <span className="text-[9px] text-[var(--muted)]">The active selling price tag.</span>
                        </div>

                        <div className="grid gap-1.5">
                          <label className="text-xs font-bold text-[var(--text)]">Original Price</label>
                          <Input
                            name="originalPrice"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.originalPrice}
                            onChange={handleChange}
                            placeholder="e.g. 129.99"
                            className="rounded-lg bg-[var(--surface)] font-mono"
                          />
                          <span className="text-[9px] text-[var(--muted)]">Optional markdown price strikeout (MSRP).</span>
                        </div>

                        <div className="grid gap-1.5 sm:col-span-2">
                          <label className="text-xs font-bold text-[var(--text)]">CTA Button Label</label>
                          <Input
                            name="ctaLabel"
                            value={form.ctaLabel}
                            onChange={handleChange}
                            placeholder="e.g. View Product"
                            className="rounded-lg bg-[var(--surface)]"
                          />
                          <span className="text-[9px] text-[var(--muted)]">CTA anchor text redirecting to the storefront link.</span>
                        </div>

                        <div className="grid gap-1.5 sm:col-span-2">
                          <label className="text-xs font-bold text-[var(--text)]">Product Redirect Link</label>
                          <Input
                            name="productUrl"
                            value={form.productUrl}
                            onChange={handleChange}
                            placeholder="e.g. https://www.nike.com/t/air-max-2026-shoes"
                            className="rounded-lg bg-[var(--surface)]"
                          />
                          <span className="text-[9px] text-[var(--muted)]">Optional external affiliate or purchase link. Leaves internal path default if empty.</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: media */}
                  {activeTab === "media" && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-0.5">Product Media</h3>
                        <p className="text-[10px] text-[var(--muted)]">Add images through Cloudinary uploads or custom links.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="grid gap-1.5">
                          <label className="text-xs font-bold text-[var(--text)]">Product Image Cover</label>
                          <input
                            type="file"
                            accept={ACCEPTED_IMAGE_TYPES.join(",")}
                            className="hidden"
                            id="dialog-product-image-uploader"
                            onChange={(event) => handleImageSelection(event.target.files?.[0])}
                          />

                          <div className="rounded-xl border border-dashed border-[var(--border)] p-4 bg-[var(--surface-soft)]/10 flex flex-col items-center justify-center text-center">
                            <svg viewBox="0 0 24 24" className="h-7 w-7 text-[var(--muted)] stroke-current mb-2" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <polyline points="21 15 16 10 5 21" />
                            </svg>
                            <p className="text-[11px] font-bold text-[var(--text)]">Upload your product cover media</p>
                            <p className="text-[10px] text-[var(--muted)] mt-0.5">Supports PNG, JPG, WEBP, SVG up to 2MB (Recommended: Aspect ratio 1:1 or 400x400 px)</p>

                            <div className="flex gap-2 mt-3">
                              <Button
                                type="button"
                                variant="outline"
                                className="rounded-lg h-7 text-[10px] px-3 bg-[var(--surface)] hover:bg-[var(--surface-soft)] cursor-pointer"
                                onClick={() => document.getElementById("dialog-product-image-uploader")?.click()}
                              >
                                {isUploadingImage ? "Uploading..." : "Browse Cloudinary"}
                              </Button>
                              {form.image ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="rounded-lg h-7 text-[10px] px-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 cursor-pointer"
                                  disabled={isUploadingImage}
                                  onClick={() => setForm((current) => ({ ...current, image: "" }))}
                                >
                                  Remove cover
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-1.5">
                          <label className="text-xs font-bold text-[var(--text)]">Paste Image Address URL Manually</label>
                          <Input
                            name="image"
                            value={form.image}
                            onChange={handleChange}
                            placeholder="Or paste direct image URL address"
                            className="rounded-lg bg-[var(--surface)]"
                          />
                          <span className="text-[9px] text-[var(--muted)]">Custom fallback URL paths.</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Sticky Action Footer */}
                {error ? <p className="px-6 text-xs text-red-500 font-semibold mb-2">{error}</p> : null}
                <div className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-4 flex justify-end gap-3 shrink-0">
                  <Button type="button" variant="outline" className="rounded-lg h-9 text-xs font-bold px-4 border-[var(--border)] hover:bg-[var(--surface-soft)]" onClick={() => setOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-lg h-9 text-xs font-bold px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-sm"
                    disabled={isSubmitting || isUploadingImage}
                  >
                    {isSubmitting ? "Saving..." : editingProduct ? "Update Product" : "Save Product"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete product"
        description={deleteTarget ? `Delete "${deleteTarget.title}" from the catalog?` : ""}
        confirmLabel="Delete Product"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirmed}
        isSubmitting={isDeleting}
      />
    </>
  );
}
