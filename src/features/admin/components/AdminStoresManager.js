"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/AppModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, useDialogA11yIds } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import BulkStoreImportDialog from "@/features/admin/components/BulkStoreImportDialog";
import { cn } from "@/lib/utils";
import { DEFAULT_COUNTRY_CODE, SUPPORTED_COUNTRIES, sanitizeCountryList, buildCountryPath } from "@/lib/countries";

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const ACCEPTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

const storeSchema = z.object({
  name: z.string().trim().min(1, "Store name is required."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase and URL-friendly."),
  category: z.string().trim().min(1, "Category is required."),
  countryCode: z
    .string()
    .trim()
    .min(2, "Country is required.")
    .max(2, "Use a 2-letter country code."),
  description: z
    .string()
    .trim()
    .max(280, "Description must stay under 280 characters.")
    .optional()
    .or(z.literal("")),
  trustStatus: z.enum(["Verified", "Trusted", "Pending", "Active"]),
  logoText: z
    .string()
    .trim()
    .max(24, "Logo text should stay concise.")
    .optional()
    .or(z.literal("")),
  affiliateLink: z.string().trim().optional().or(z.literal("")),
  logoImage: z.string().optional().or(z.literal("")),
  sidebarBannerImage: z.string().optional().or(z.literal("")),
  sidebarBannerUrl: z.string().trim().optional().or(z.literal("")),
  contentIntroTitle: z.string().trim().optional().or(z.literal("")),
  contentIntroParagraph1: z.string().trim().optional().or(z.literal("")),
  contentIntroParagraph2: z.string().trim().optional().or(z.literal("")),
  contentWhyItemsText: z.string().trim().optional().or(z.literal("")),
  contentOutro: z.string().trim().optional().or(z.literal("")),
  faq1Question: z.string().trim().optional().or(z.literal("")),
  faq1Answer: z.string().trim().optional().or(z.literal("")),
  faq2Question: z.string().trim().optional().or(z.literal("")),
  faq2Answer: z.string().trim().optional().or(z.literal("")),
  faq3Question: z.string().trim().optional().or(z.literal("")),
  faq3Answer: z.string().trim().optional().or(z.literal("")),
});

const defaultValues = {
  name: "",
  slug: "",
  category: "",
  countryCode: DEFAULT_COUNTRY_CODE,
  description: "",
  trustStatus: "Active",
  logoText: "",
  affiliateLink: "",
  logoImage: "",
  sidebarBannerImage: "",
  sidebarBannerUrl: "",
  contentIntroTitle: "",
  contentIntroParagraph1: "",
  contentIntroParagraph2: "",
  contentWhyItemsText: "",
  contentOutro: "",
  faq1Question: "",
  faq1Answer: "",
  faq2Question: "",
  faq2Answer: "",
  faq3Question: "",
  faq3Answer: "",
};

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCategoryOptionMap(categories) {
  return categories.reduce((accumulator, category) => {
    accumulator[category.name] = category;
    return accumulator;
  }, {});
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" className="stroke-current opacity-25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" className="stroke-current" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function CategoryCombobox({ categories, value, onChange, error, onBlur }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filteredCategories = categories.filter((category) =>
    category.toLowerCase().includes((query || value || "").toLowerCase())
  );

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select store category"
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-lg border px-4 text-sm text-[var(--text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:rgba(139, 92, 246,0.16)]",
          error
            ? "border-[var(--color-primary)] bg-[var(--surface)]"
            : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--color-primary)]/40"
        )}
        onClick={() => {
          setOpen((current) => !current);
          setQuery(value);
        }}
        onBlur={onBlur}
      >
        <span className={value ? "text-[var(--text)]" : "text-[var(--muted)]"}>{value || "Choose a category"}</span>
        <span className="text-[var(--muted)]">⌄</span>
      </button>

      {open ? (
        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search category"
            aria-label="Search categories"
            className="mb-3"
          />
          <div role="listbox" aria-label="Category options" className="max-h-52 space-y-1 overflow-y-auto">
            {filteredCategories.length ? (
              filteredCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={cn(
                    "w-full rounded-lg px-3 py-2.5 text-left text-sm transition",
                    category === value
                      ? "border border-[var(--color-primary)]/25 bg-[var(--surface-soft)] text-[var(--text)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)]"
                  )}
                  onClick={() => {
                    onChange(category);
                    setQuery(category);
                    setOpen(false);
                  }}
                >
                  {category}
                </button>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--border)] px-3 py-4 text-sm text-[var(--muted)]">
                No matching category found.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminStoresManager() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState(SUPPORTED_COUNTRIES);
  const [open, setOpen] = useState(false);
  const [selectedCountryFilter, setSelectedCountryFilter] = useState("all");

  const filteredStores = useMemo(() => {
    let result = stores;
    if (selectedCountryFilter !== "all") {
      result = result.filter(
        (store) => (store.countryCode || "").toLowerCase() === selectedCountryFilter.toLowerCase()
      );
    }
    if (!searchQuery) return result;
    const lowerQuery = searchQuery.toLowerCase();
    return result.filter((store) => {
      const name = (store.name || "").toLowerCase();
      const slug = (store.slug || "").toLowerCase();
      const category = (store.category || "").toLowerCase();
      const countryCode = (store.countryCode || "").toLowerCase();
      return (
        name.includes(lowerQuery) ||
        slug.includes(lowerQuery) ||
        category.includes(lowerQuery) ||
        countryCode.includes(lowerQuery)
      );
    });
  }, [stores, searchQuery, selectedCountryFilter]);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [isHydrating, setIsHydrating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedStoreSlugs, setSelectedStoreSlugs] = useState([]);
  const [activeTab, setActiveTab] = useState("general");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const totalPages = Math.ceil(filteredStores.length / pageSize);

  const paginatedStores = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredStores.slice(startIndex, startIndex + pageSize);
  }, [filteredStores, currentPage, pageSize]);

  // Reset page when search query or country filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCountryFilter]);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push("...");
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push("...");
      }
      pages.push(totalPages);
    }
    return pages;
  };
  const slugEditedRef = useRef(false);
  const logoTextEditedRef = useRef(false);
  const fileInputRef = useRef(null);
  const bannerFileInputRef = useRef(null);
  const descriptionRef = useRef(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const { titleId, descriptionId } = useDialogA11yIds();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    watch,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(storeSchema),
    defaultValues,
  });

  const watchedName = watch("name");
  const watchedSlug = watch("slug");
  const watchedDescription = watch("description") || "";
  const watchedLogoImage = watch("logoImage");
  const watchedLogoText = watch("logoText");
  const watchedSidebarBannerImage = watch("sidebarBannerImage");
  const watchedSidebarBannerUrl = watch("sidebarBannerUrl");
  const watchedCategory = watch("category");
  const watchedCountryCode = watch("countryCode");
  const watchedTrustStatus = watch("trustStatus");

  const categoryOptions = categories.map((category) => category.name);
  const descriptionField = register("description");

  async function loadStores() {
    setIsHydrating(true);

    try {
      const [storesResponse, categoriesResponse, countriesResponse] = await Promise.all([
        fetch("/api/stores", { cache: "no-store" }),
        fetch("/api/categories", { cache: "no-store" }),
        fetch("/api/public/countries", { cache: "no-store" }),
      ]);
      const [storesPayload, categoriesPayload, countriesPayload] = await Promise.all([
        storesResponse.json(),
        categoriesResponse.json(),
        countriesResponse.json(),
      ]);
      setStores(storesPayload.data || []);
      setCategories(categoriesPayload.data || []);
      setCountries(sanitizeCountryList(countriesPayload.data || SUPPORTED_COUNTRIES));
      setSelectedStoreSlugs((current) =>
        current.filter((slug) => (storesPayload.data || []).some((store) => store.slug === slug))
      );
    } finally {
      setIsHydrating(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function hydrateStores() {
      setIsHydrating(true);

      try {
        const [storesResponse, categoriesResponse, countriesResponse] = await Promise.all([
          fetch("/api/stores", { cache: "no-store" }),
          fetch("/api/categories", { cache: "no-store" }),
          fetch("/api/public/countries", { cache: "no-store" }),
        ]);
        const [storesPayload, categoriesPayload, countriesPayload] = await Promise.all([
          storesResponse.json(),
          categoriesResponse.json(),
          countriesResponse.json(),
        ]);

        if (active) {
          setStores(storesPayload.data || []);
          setCategories(categoriesPayload.data || []);
          setCountries(sanitizeCountryList(countriesPayload.data || SUPPORTED_COUNTRIES));
          setSelectedStoreSlugs([]);
        }
      } finally {
        if (active) {
          setIsHydrating(false);
        }
      }
    }

    hydrateStores();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!slugEditedRef.current) {
      setValue("slug", slugify(watchedName || ""), { shouldValidate: true });
    }
  }, [watchedName, setValue]);

  useEffect(() => {
    if (!logoTextEditedRef.current) {
      setValue("logoText", (watchedName || "").trim(), { shouldValidate: true });
    }
  }, [watchedName, setValue]);

  useEffect(() => {
    if (!descriptionRef.current) {
      return;
    }

    descriptionRef.current.style.height = "0px";
    descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`;
  }, [watchedDescription]);

  function openCreateModal() {
    slugEditedRef.current = false;
    logoTextEditedRef.current = false;
    setActiveTab("general");
    setEditingStore(null);
    reset(defaultValues);
    setOpen(true);
  }

  function openEditModal(store) {
    slugEditedRef.current = true;
    logoTextEditedRef.current = true;
    setActiveTab("general");
    setEditingStore(store);
    reset({
      name: store.name,
      slug: store.slug,
      category: store.category,
      countryCode: store.countryCode || DEFAULT_COUNTRY_CODE,
      description: store.description || "",
      trustStatus: store.trustStatus || "Active",
      logoText: store.logoText || "",
      affiliateLink: store.affiliateLink || "",
      logoImage: store.logoImage || "",
      sidebarBannerImage: store.sidebarBannerImage || "",
      sidebarBannerUrl: store.sidebarBannerUrl || "",
      contentIntroTitle: store.contentIntroTitle || "",
      contentIntroParagraph1: store.contentIntroParagraph1 || "",
      contentIntroParagraph2: store.contentIntroParagraph2 || "",
      contentWhyItemsText: store.contentWhyItemsText || "",
      contentOutro: store.contentOutro || "",
      faq1Question: store.faq1Question || "",
      faq1Answer: store.faq1Answer || "",
      faq2Question: store.faq2Question || "",
      faq2Answer: store.faq2Answer || "",
      faq3Question: store.faq3Question || "",
      faq3Answer: store.faq3Answer || "",
    });
    setOpen(true);
  }

  function closeModal() {
    setActiveTab("general");
    setOpen(false);
  }

  function validateLogoFile(file) {
    if (!file) {
      return "Please choose a logo file.";
    }

    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      return "Logo must be PNG, JPG, WEBP, or SVG.";
    }

    if (file.size > MAX_LOGO_SIZE) {
      return "Logo must be 2MB or smaller.";
    }

    return null;
  }

  async function handleLogoSelection(file) {
    const validationMessage = validateLogoFile(file);

    if (validationMessage) {
      setError("logoImage", { type: "manual", message: validationMessage });
      return;
    }

    try {
      setIsUploadingLogo(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("slug", watchedSlug || slugify(watchedName || file.name));

      const response = await fetch("/api/uploads/store-logo", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to upload logo.");
      }

      setValue("logoImage", payload.data.secureUrl, { shouldDirty: true, shouldValidate: true });
      clearErrors("logoImage");
      toast.success("Logo uploaded to Cloudinary.");
    } catch (error) {
      setError("logoImage", { type: "manual", message: error.message });
      toast.error(error.message || "Unable to upload logo.");
    } finally {
      setIsUploadingLogo(false);
    }
  }

  async function handleFileInputChange(event) {
    const file = event.target.files?.[0];
    if (file) {
      await handleLogoSelection(file);
    }
  }

  async function handleLogoDrop(event) {
    event.preventDefault();
    setIsDraggingLogo(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      await handleLogoSelection(file);
    }
  }

  async function handleBannerSelection(file) {
    const validationMessage = validateLogoFile(file);

    if (validationMessage) {
      setError("sidebarBannerImage", { type: "manual", message: validationMessage });
      return;
    }

    try {
      setIsUploadingBanner(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("slug", `${watchedSlug || slugify(watchedName || "store")}-sidebar-banner`);

      const response = await fetch("/api/uploads/store-logo", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to upload sidebar banner.");
      }

      setValue("sidebarBannerImage", payload.data.secureUrl, { shouldDirty: true, shouldValidate: true });
      clearErrors("sidebarBannerImage");
      toast.success("Sidebar banner uploaded to Cloudinary.");
    } catch (error) {
      setError("sidebarBannerImage", { type: "manual", message: error.message });
      toast.error(error.message || "Unable to upload sidebar banner.");
    } finally {
      setIsUploadingBanner(false);
    }
  }

  async function handleBannerFileInputChange(event) {
    const file = event.target.files?.[0];
    if (file) {
      await handleBannerSelection(file);
    }
  }

  async function handleBannerDrop(event) {
    event.preventDefault();
    setIsDraggingBanner(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      await handleBannerSelection(file);
    }
  }

  async function submitStore(values) {
    const selectedCategory = getCategoryOptionMap(categories)[values.category];

    if (!selectedCategory) {
      toast.error("Select a managed category before saving the store.");
      return;
    }

    let sanitizedBannerImage = values.sidebarBannerImage || "";
    if (sanitizedBannerImage) {
      try {
        const parsed = new URL(sanitizedBannerImage);
        if (parsed.hostname.includes("google.") && parsed.pathname.includes("/imgres")) {
          const imgUrlParam = parsed.searchParams.get("imgurl");
          if (imgUrlParam) {
            sanitizedBannerImage = decodeURIComponent(imgUrlParam);
          }
        }
      } catch (e) {
        // Ignore parsing errors for relative URLs
      }
    }

    const endpoint = editingStore ? `/api/stores/${editingStore.slug}` : "/api/stores";
    const method = editingStore ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        sidebarBannerImage: sanitizedBannerImage,
        category: selectedCategory.name,
        categorySlug: selectedCategory.slug,
        logoText: values.logoText || values.name.trim(),
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      toast.error(payload.error || "Unable to save store.");
      return;
    }

    await loadStores();
    toast.success(editingStore ? "Store updated." : "Store created.");
    slugEditedRef.current = false;
    logoTextEditedRef.current = false;
    reset(defaultValues);
    setEditingStore(null);
    setOpen(false);
  }

  function openDeleteModal(store) {
    setDeleteTarget(store);
  }

  function toggleStoreSelection(storeSlug) {
    setSelectedStoreSlugs((current) =>
      current.includes(storeSlug) ? current.filter((slug) => slug !== storeSlug) : [...current, storeSlug]
    );
  }

  function toggleSelectAllStores() {
    const visibleSlugs = paginatedStores.map((store) => store.slug);
    const allVisibleSelected = visibleSlugs.every((slug) => selectedStoreSlugs.includes(slug));

    setSelectedStoreSlugs((current) => {
      if (allVisibleSelected) {
        return current.filter((slug) => !visibleSlugs.includes(slug));
      } else {
        return [...new Set([...current, ...visibleSlugs])];
      }
    });
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget && !selectedStoreSlugs.length) {
      return;
    }

    setIsDeleting(true);
    const slugsToDelete = deleteTarget?.slug === "__bulk__" ? selectedStoreSlugs : deleteTarget ? [deleteTarget.slug] : selectedStoreSlugs;
    const responses = await Promise.all(
      slugsToDelete.map(async (slug) => {
        const response = await fetch(`/api/stores/${slug}`, { method: "DELETE" });
        const payload = await response.json().catch(() => ({}));
        return { response, payload };
      })
    );

    const failedResult = responses.find(({ response }) => !response.ok);
    if (failedResult) {
      toast.error(failedResult.payload.error || "Unable to delete store.");
      setIsDeleting(false);
      return;
    }

    await loadStores();
    setDeleteTarget(null);
    setSelectedStoreSlugs([]);
    setIsDeleting(false);
    toast.success(deleteTarget ? "Store deleted." : "Selected stores deleted.");
  }

  return (
    <>
      <Card className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 lg:flex-row lg:items-center lg:justify-between p-6">
          <div>
            <CardTitle className="text-base font-bold tracking-tight text-[var(--text)]">Stores Management</CardTitle>
            <CardDescription className="text-xs text-[var(--muted)] mt-0.5">Manage merchant details, slugs, trust signals, and offer coverage.</CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {selectedStoreSlugs.length ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl font-semibold border border-red-500/25 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-600 transition-all duration-200 px-4 py-2 text-xs"
                onClick={() => setDeleteTarget({ slug: "__bulk__", name: `${selectedStoreSlugs.length} selected stores` })}
              >
                Delete Selected ({selectedStoreSlugs.length})
              </Button>
            ) : null}
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
            <Button type="button" variant="ghost" size="sm" className="h-10 w-10 rounded-xl border border-[var(--border)] px-0 bg-[var(--surface)] hover:bg-[var(--surface-soft)] transition" onClick={loadStores} aria-label="Refresh stores">
              <RefreshIcon />
            </Button>
            <Button type="button" variant="outline" className="rounded-xl font-bold bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface)] transition px-4 py-2 text-xs cursor-pointer" onClick={() => setBulkImportOpen(true)}>
              Bulk Import Stores
            </Button>
            <Button type="button" className="rounded-xl font-bold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-sm transition-all duration-200 px-4 py-2 cursor-pointer text-xs" onClick={openCreateModal}>
              Add New Store
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <Table>
              <TableHeader className="bg-[var(--surface-soft)]/50">
                <TableRow className="border-b border-[var(--border)] hover:bg-transparent">
                  <TableHead className="w-14 h-10 text-[10px] font-black uppercase tracking-wider text-[var(--muted)] px-4">
                    <label className="flex items-center justify-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 appearance-none rounded-full border-2 border-[var(--muted)]/60 bg-[var(--surface-soft)] checked:bg-[var(--color-primary)] checked:border-[var(--color-primary)] focus:outline-none transition-all cursor-pointer relative after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-transparent checked:after:bg-white"
                        checked={paginatedStores.length > 0 && paginatedStores.every((store) => selectedStoreSlugs.includes(store.slug))}
                        onChange={toggleSelectAllStores}
                        aria-label="Select all visible stores"
                      />
                    </label>
                  </TableHead>
                  <TableHead className="h-10 text-[10px] font-black uppercase tracking-wider text-[var(--muted)] px-4">Store Name</TableHead>
                  <TableHead className="h-10 text-[10px] font-black uppercase tracking-wider text-[var(--muted)] px-4">Slug</TableHead>
                  <TableHead className="h-10 text-[10px] font-black uppercase tracking-wider text-[var(--muted)] px-4">Category</TableHead>
                  <TableHead className="h-10 text-[10px] font-black uppercase tracking-wider text-[var(--muted)] px-4">Country</TableHead>
                  <TableHead className="h-10 text-[10px] font-black uppercase tracking-wider text-[var(--muted)] px-4">Offers Count</TableHead>
                  <TableHead className="h-10 text-[10px] font-black uppercase tracking-wider text-[var(--muted)] px-4">Website</TableHead>
                  <TableHead className="h-10 text-[10px] font-black uppercase tracking-wider text-[var(--muted)] px-4">Trust</TableHead>
                  <TableHead className="h-10 text-[10px] font-black uppercase tracking-wider text-[var(--muted)] px-4">Edit/Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStores.map((store) => (
                  <TableRow key={store.slug} className="border-b border-[var(--border)]/50 last:border-0 hover:bg-[var(--surface-soft)]/60 transition-colors duration-150">
                    <TableCell className="py-3 px-4">
                      <label className="flex items-center justify-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4 appearance-none rounded-full border-2 border-[var(--muted)]/60 bg-[var(--surface-soft)] checked:bg-[var(--color-primary)] checked:border-[var(--color-primary)] focus:outline-none transition-all cursor-pointer relative after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-transparent checked:after:bg-white"
                          checked={selectedStoreSlugs.includes(store.slug)}
                          onChange={() => toggleStoreSelection(store.slug)}
                          aria-label={`Select ${store.name}`}
                        />
                      </label>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-3.5">
                        {store.logoImage ? (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 shadow-sm">
                            <div className="relative h-full w-full">
                              <Image
                                src={store.logoImage}
                                alt={`${store.name} logo`}
                                fill
                                className="object-contain rounded-full"
                                unoptimized
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] font-black text-[10px] text-[var(--muted)] shadow-sm">
                            {store.logoText?.slice(0, 2).toUpperCase() || store.name?.slice(0, 2).toUpperCase() || "ST"}
                          </div>
                        )}
                        <span className="font-semibold text-[var(--text)] text-xs truncate max-w-[200px]">
                          {store.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[var(--muted)] text-xs py-3 px-4">/{store.slug}</TableCell>
                    <TableCell className="text-[var(--text)]/80 text-xs py-3 px-4 capitalize font-semibold">{store.category}</TableCell>
                    <TableCell className="text-[var(--text)]/80 text-xs py-3 px-4 font-mono font-semibold">{store.countryCode || DEFAULT_COUNTRY_CODE}</TableCell>
                    <TableCell className="py-3 px-4 font-mono font-semibold text-xs text-[var(--text)]/80">{store.offersCount || 0}</TableCell>
                    <TableCell className="py-3 px-4 text-xs font-semibold">
                      <a
                        href={buildCountryPath(`/stores/${store.categorySlug || slugify(store.category)}/${store.slug}`, store.countryCode)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors duration-150"
                      >
                        Visit
                        <svg viewBox="0 0 24 24" className="h-3 w-3 stroke-current" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${store.trustStatus === "Verified" || store.trustStatus === "Active"
                          ? "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400"
                          : store.trustStatus === "Trusted"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400"
                        }`}>
                        {store.trustStatus}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-lg h-7 w-7 p-0 flex items-center justify-center border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text)] hover:bg-[var(--surface)] hover:text-[var(--color-primary)] cursor-pointer transition-all duration-200"
                          onClick={() => openEditModal(store)}
                          aria-label="Edit store"
                        >
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 stroke-current" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="rounded-lg h-7 w-7 p-0 flex items-center justify-center border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 cursor-pointer transition-all duration-200"
                          onClick={() => openDeleteModal(store)}
                          aria-label="Delete store"
                        >
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 stroke-current" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 ? (
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-[var(--muted)]">
                Showing {Math.min((currentPage - 1) * pageSize + 1, filteredStores.length)} to{" "}
                {Math.min(currentPage * pageSize, filteredStores.length)} of {filteredStores.length} stores
              </span>
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-xs font-bold text-[var(--text)] transition hover:bg-[var(--surface)] hover:text-[var(--color-primary)] disabled:opacity-40 disabled:hover:text-inherit disabled:hover:bg-[var(--surface-soft)] cursor-pointer disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {getPageNumbers().map((pageNum, idx) => {
                  if (pageNum === "...") {
                    return (
                      <span key={`dots-${idx}`} className="px-1 text-xs text-[var(--muted)]">
                        ...
                      </span>
                    );
                  }
                  
                  const isCurrent = currentPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition cursor-pointer",
                        isCurrent
                          ? "bg-[var(--color-primary)] text-white shadow-sm"
                          : "border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text)] hover:bg-[var(--surface)] hover:text-[var(--color-primary)]"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-xs font-bold text-[var(--text)] transition hover:bg-[var(--surface)] hover:text-[var(--color-primary)] disabled:opacity-40 disabled:hover:text-inherit disabled:hover:bg-[var(--surface-soft)] cursor-pointer disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}

          {!filteredStores.length && !isHydrating ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-5 py-6 text-sm text-[var(--muted)]">
              {searchQuery ? "No stores match your search query." : "No stores added yet. Use the modal above to create the first store."}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          titleId={titleId}
          descriptionId={descriptionId}
          className="max-h-[calc(100vh-2rem)] max-w-5xl overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-0 shadow-2xl sm:max-h-[calc(100vh-3rem)]"
        >
          <div className="grid gap-0 lg:grid-cols-[410px_1fr] h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] max-h-[850px] overflow-hidden">
            {/* Left Column - Live Preview & Checklist */}
            <div className="border-b border-[var(--border)] bg-gradient-to-br from-[var(--surface-soft)] via-[var(--surface)] to-[var(--surface-soft)]/30 p-6 lg:border-r lg:border-b-0 lg:p-8 flex flex-col justify-between overflow-y-auto">
              <div>
                <DialogHeader className="mb-6">
                  <span className="w-fit inline-flex items-center rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                    Store Editor
                  </span>
                  <DialogTitle id={titleId} className="text-lg font-bold tracking-tight text-[var(--text)] mt-3">
                    {editingStore ? "Update Store" : "Add New Store"}
                  </DialogTitle>
                  <DialogDescription id={descriptionId} className="text-xs text-[var(--muted)] mt-1">
                    Configure merchant metadata, brand settings, page copywriting, and trust settings.
                  </DialogDescription>
                </DialogHeader>

                {/* Live Preview Store Card */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Card Preview</span>
                  <div className="relative rounded-2xl border border-[var(--border)]/70 bg-[var(--surface)] p-4 shadow-md overflow-hidden group">
                    {/* Banner background decor */}
                    <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-r from-purple-500/10 via-violet-500/5 to-blue-500/10 border-b border-[var(--border)]/30" />
                    
                    {/* Floating Logo */}
                    <div className="relative mt-4 flex items-end gap-3.5 z-10">
                      {watchedLogoImage ? (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-sm">
                          <div className="relative h-full w-full">
                            <Image src={watchedLogoImage} alt="Store logo preview" fill className="object-contain" unoptimized />
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] font-black text-sm text-[var(--text)] shadow-sm">
                          {watchedLogoText?.slice(0, 2).toUpperCase() || watchedName?.slice(0, 2).toUpperCase() || "ST"}
                        </div>
                      )}
                      <div className="min-w-0 pb-0.5">
                        <h4 className="truncate text-sm font-bold text-[var(--text)]">{watchedName || "Store Name"}</h4>
                        <p className="text-[10px] text-[var(--muted)] truncate mt-0.5">/{watchedSlug || "store-slug"}</p>
                      </div>
                    </div>

                    {/* Metadata Badges */}
                    <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[9px] font-bold text-[var(--color-primary)] border border-[var(--color-primary)]/10">
                        {watchedCategory || "General"}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-[var(--surface-soft)] px-2 py-0.5 text-[9px] font-semibold text-[var(--muted)] border border-[var(--border)]">
                        {watchedCountryCode || "US"}
                      </span>
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border",
                        watchedTrustStatus === "Verified" || watchedTrustStatus === "Active"
                          ? "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400"
                          : watchedTrustStatus === "Trusted"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400"
                      )}>
                        {watchedTrustStatus}
                      </span>
                    </div>

                    {/* Editorial Summary */}
                    <p className="mt-3 text-[10px] text-[var(--muted)] leading-relaxed italic line-clamp-2 min-h-[30px]">
                      {watchedDescription || "Store description summary will appear here..."}
                    </p>

                    {/* Footer Stats block */}
                    <div className="mt-3.5 border-t border-[var(--border)]/40 pt-2.5 flex items-center justify-between text-[9px] font-semibold text-[var(--muted)]">
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active Offers
                      </span>
                      <span className="font-mono text-emerald-500 font-bold">0 Coupons</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Minimalist Publishing Checklist */}
              <div className="mt-6 border-t border-[var(--border)] pt-5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Requirements Checklist</span>
                <ul className="mt-3.5 space-y-2.5 text-xs text-[var(--muted)] font-medium">
                  <li className="flex items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full", watchedName && watchedSlug && watchedCategory ? "bg-purple-500" : "bg-[var(--border)]")} />
                    <span>Identity: Name, slug, & primary category</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full", watchedLogoImage ? "bg-blue-500" : "bg-[var(--border)]")} />
                    <span>Branding: Merchant logo uploads</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full", watchedDescription ? "bg-emerald-500" : "bg-[var(--border)]")} />
                    <span>Content: Editorial summary & store copy</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column - Tabbed Forms */}
            <div className="flex flex-col h-full bg-[var(--surface)] overflow-hidden">
              <form className="flex flex-col h-full overflow-hidden" onSubmit={handleSubmit(submitStore)}>
                
                {/* Tab Controls Row */}
                <div className="border-b border-[var(--border)] bg-[var(--surface-soft)]/20 px-6 pt-4 flex gap-1 overflow-x-auto scrollbar-none shrink-0">
                  {[
                    { id: "general", label: "General Details" },
                    { id: "branding", label: "Branding & Links" },
                    { id: "content", label: "Store Page & FAQs" }
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

                {/* Tab content panel wrapper */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* General Tab */}
                  {activeTab === "general" && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-0.5">Store Basics</h3>
                        <p className="text-[10px] text-[var(--muted)]">Specify the core identification and taxonomy mapping.</p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-1.5">
                          <label className="text-xs font-bold text-[var(--text)]">Store Name</label>
                          <Input
                            aria-invalid={Boolean(errors.name)}
                            placeholder="e.g. Nike Store"
                            className="rounded-lg bg-[var(--surface)]"
                            {...register("name")}
                          />
                          {errors.name ? (
                            <span className="text-[10px] font-semibold text-[var(--color-primary)]">{errors.name.message}</span>
                          ) : (
                            <span className="text-[9px] text-[var(--muted)]">The merchant name displayed in listings.</span>
                          )}
                        </div>

                        <div className="grid gap-1.5">
                          <label className="text-xs font-bold text-[var(--text)]">Slug</label>
                          <Input
                            aria-invalid={Boolean(errors.slug)}
                            placeholder="e.g. nike-store"
                            className="rounded-lg bg-[var(--surface)]"
                            {...register("slug", {
                              onChange: () => {
                                slugEditedRef.current = true;
                              },
                            })}
                          />
                          {errors.slug ? (
                            <span className="text-[10px] font-semibold text-[var(--color-primary)]">{errors.slug.message}</span>
                          ) : (
                            <span className="text-[9px] text-[var(--muted)]">Unique, URL-friendly key parameter.</span>
                          )}
                        </div>

                        <div className="grid gap-1.5">
                          <label className="text-xs font-bold text-[var(--text)]">Category</label>
                          <Controller
                            control={control}
                            name="category"
                            render={({ field }) => (
                              <CategoryCombobox
                                categories={categoryOptions}
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                error={errors.category?.message}
                              />
                            )}
                          />
                          {!errors.category && (
                            <span className="text-[9px] text-[var(--muted)]">Primary category placement.</span>
                          )}
                        </div>

                        <div className="grid gap-1.5">
                          <label className="text-xs font-bold text-[var(--text)]">Country</label>
                          <select
                            aria-label="Select country"
                            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs text-[var(--text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                            {...register("countryCode")}
                          >
                            {countries.map((country) => (
                              <option key={country.code} value={country.code}>
                                {country.code} - {country.name}
                              </option>
                            ))}
                          </select>
                          <span className="text-[9px] text-[var(--muted)]">Used for localized region sorting.</span>
                        </div>

                        <div className="grid gap-1.5 sm:col-span-2">
                          <label className="text-xs font-bold text-[var(--text)]">Trust Status</label>
                          <select
                            aria-label="Select trust status"
                            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs text-[var(--text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                            {...register("trustStatus")}
                          >
                            <option>Active</option>
                            <option>Verified</option>
                            <option>Trusted</option>
                            <option>Pending</option>
                          </select>
                          <span className="text-[9px] text-[var(--muted)]">Appends public trust rating credentials.</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Branding Tab */}
                  {activeTab === "branding" && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-0.5">Branding & Links</h3>
                        <p className="text-[10px] text-[var(--muted)]">Upload visuals and tracking attributes.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="grid gap-1.5">
                          <label className="text-xs font-bold text-[var(--text)]">Store Logo</label>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept={ACCEPTED_LOGO_TYPES.join(",")}
                            className="hidden"
                            onChange={handleFileInputChange}
                            aria-label="Upload store logo"
                          />
                          <input type="hidden" {...register("logoImage")} />
                          
                          <div
                            className={cn(
                              "rounded-xl border border-dashed p-4 transition-all duration-200 flex flex-col items-center justify-center text-center",
                              isDraggingLogo
                                ? "border-[var(--color-primary)] bg-[var(--surface-soft)]/30"
                                : "border-[var(--border)] bg-[var(--surface-soft)]/10 hover:border-[var(--border)]/80"
                            )}
                            onDragOver={(event) => {
                              event.preventDefault();
                              setIsDraggingLogo(true);
                            }}
                            onDragLeave={() => setIsDraggingLogo(false)}
                            onDrop={handleLogoDrop}
                          >
                            <svg viewBox="0 0 24 24" className="h-7 w-7 text-[var(--muted)] stroke-current mb-2" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <polyline points="21 15 16 10 5 21" />
                            </svg>
                            <p className="text-[11px] font-bold text-[var(--text)]">Drag & drop logo file here</p>
                            <p className="text-[10px] text-[var(--muted)] mt-0.5">Supports PNG, JPG, WEBP, SVG up to 2MB (Recommended: Square 200x200 px)</p>
                            
                            <div className="flex gap-2 mt-3">
                              <Button type="button" variant="outline" className="rounded-lg h-7 text-[10px] px-3 bg-[var(--surface)] hover:bg-[var(--surface-soft)] cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                {isUploadingLogo ? "Uploading..." : "Browse Logo"}
                              </Button>
                              {watchedLogoImage ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="rounded-lg h-7 text-[10px] px-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 cursor-pointer"
                                  disabled={isUploadingLogo}
                                  onClick={() => setValue("logoImage", "", { shouldDirty: true, shouldValidate: true })}
                                >
                                  Remove logo
                                </Button>
                              ) : null}
                            </div>
                          </div>
                          {errors.logoImage && <span className="text-[10px] font-semibold text-[var(--color-primary)]">{errors.logoImage.message}</span>}
                        </div>

                        {/* Sidebar Vertical Banner (Optional) */}
                        <div className="grid gap-1.5 border-t border-[var(--border)] pt-4 mt-2">
                          <label className="text-xs font-bold text-[var(--text)]">Sidebar Vertical Banner (Optional)</label>
                          <input
                            ref={bannerFileInputRef}
                            type="file"
                            accept={ACCEPTED_LOGO_TYPES.join(",")}
                            className="hidden"
                            onChange={handleBannerFileInputChange}
                            aria-label="Upload sidebar banner"
                          />
                           <div
                            className={cn(
                              "rounded-xl border border-dashed p-4 transition-all duration-200 flex flex-col items-center justify-center text-center",
                              isDraggingBanner
                                ? "border-[var(--color-primary)] bg-[var(--surface-soft)]/30"
                                : "border-[var(--border)] bg-[var(--surface-soft)]/10 hover:border-[var(--border)]/80"
                            )}
                            onDragOver={(event) => {
                              event.preventDefault();
                              setIsDraggingBanner(true);
                            }}
                            onDragLeave={() => setIsDraggingBanner(false)}
                            onDrop={handleBannerDrop}
                          >
                            {watchedSidebarBannerImage ? (
                              <div className="relative h-28 w-20 mb-2 border border-[var(--border)] rounded bg-[var(--surface-soft)] overflow-hidden">
                                <img
                                  src={watchedSidebarBannerImage}
                                  alt="Sidebar banner preview"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <svg viewBox="0 0 24 24" className="h-7 w-7 text-[var(--muted)] stroke-current mb-2" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <line x1="21" y1="15" x2="16" y2="10" />
                                <path d="M5 21l6-6" />
                              </svg>
                            )}
                            <p className="text-[11px] font-bold text-[var(--text)]">Drag & drop banner file here</p>
                            <p className="text-[10px] text-[var(--muted)] mt-0.5">Supports PNG, JPG, WEBP, SVG up to 2MB (Recommended: Vertical Ratio, e.g. 300x600 px)</p>
                            
                            <div className="flex gap-2 mt-3">
                              <Button type="button" variant="outline" className="rounded-lg h-7 text-[10px] px-3 bg-[var(--surface)] hover:bg-[var(--surface-soft)] cursor-pointer" onClick={() => bannerFileInputRef.current?.click()}>
                                {isUploadingBanner ? "Uploading..." : "Browse Banner"}
                              </Button>
                              {watchedSidebarBannerImage ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="rounded-lg h-7 text-[10px] px-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 cursor-pointer"
                                  disabled={isUploadingBanner}
                                  onClick={() => setValue("sidebarBannerImage", "", { shouldDirty: true, shouldValidate: true })}
                                >
                                  Remove banner
                                </Button>
                              ) : null}
                            </div>
                          </div>
                          {errors.sidebarBannerImage && <span className="text-[10px] font-semibold text-[var(--color-primary)]">{errors.sidebarBannerImage.message}</span>}
                        </div>

                        <div className="grid gap-1.5">
                          <label className="text-xs font-bold text-[var(--text)]">Or Paste Sidebar Banner Image URL (Optional)</label>
                          <Input
                            type="url"
                            placeholder="https://example.com/images/banner.jpg"
                            className="rounded-lg bg-[var(--surface)]"
                            {...register("sidebarBannerImage")}
                          />
                          <span className="text-[9px] text-[var(--muted)]">Paste an external image URL directly if you don't want to upload a file.</span>
                        </div>

                        <div className="grid gap-1.5">
                          <label className="text-xs font-bold text-[var(--text)]">Sidebar Banner Link (Optional)</label>
                          <Input
                            type="url"
                            placeholder="https://example.com/promo/banner-redirect"
                            className="rounded-lg bg-[var(--surface)]"
                            {...register("sidebarBannerUrl")}
                          />
                          <span className="text-[9px] text-[var(--muted)]">Redirect link when the sidebar banner is clicked.</span>
                        </div>

                        <div className="grid gap-1.5">
                          <label className="text-xs font-bold text-[var(--text)]">Affiliate Tracking Link</label>
                          <Input
                            type="url"
                            placeholder="https://example.com/track/store"
                            className="rounded-lg bg-[var(--surface)]"
                            {...register("affiliateLink")}
                          />
                          <span className="text-[9px] text-[var(--muted)]">Merchant tracking redirects (used for merchant CTA clicks).</span>
                        </div>

                        <div className="grid gap-1.5">
                          <label className="text-xs font-bold text-[var(--text)]">Logo Text Fallback</label>
                          <Input
                            aria-invalid={Boolean(errors.logoText)}
                            placeholder="Auto-generated from name"
                            className="rounded-lg bg-[var(--surface)]"
                            {...register("logoText", {
                              onChange: () => {
                                logoTextEditedRef.current = true;
                              },
                            })}
                          />
                          {errors.logoText ? (
                            <span className="text-[10px] font-semibold text-[var(--color-primary)]">{errors.logoText.message}</span>
                          ) : (
                            <span className="text-[9px] text-[var(--muted)]">Displayed if logo file upload is omitted.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Content Tab */}
                  {activeTab === "content" && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-0.5">Editorial Content</h3>
                        <p className="text-[10px] text-[var(--muted)]">Write clean copies and descriptive brand answers.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="grid gap-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[var(--text)]">Description (Card Summary)</label>
                            <span className="text-[9px] text-[var(--muted)]">{watchedDescription.length}/280</span>
                          </div>
                          <textarea
                            ref={(element) => {
                              descriptionRef.current = element;
                              descriptionField.ref(element);
                            }}
                            rows={3}
                            maxLength={280}
                            className="min-h-[80px] w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                            placeholder="A brief summary about the store brand."
                            name={descriptionField.name}
                            onBlur={descriptionField.onBlur}
                            onChange={descriptionField.onChange}
                          />
                          {errors.description && <span className="text-[10px] font-semibold text-[var(--color-primary)]">{errors.description.message}</span>}
                        </div>

                        <div className="grid gap-1.5">
                          <label className="text-xs font-bold text-[var(--text)]">Info Intro Title</label>
                          <Input className="rounded-lg bg-[var(--surface)]" placeholder="e.g. More Information On Carter's Deals" {...register("contentIntroTitle")} />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="grid gap-1.5">
                            <label className="text-xs font-bold text-[var(--text)]">Intro Paragraph 1</label>
                            <textarea className="min-h-[80px] w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] outline-none transition focus:border-[var(--color-primary)]" {...register("contentIntroParagraph1")} />
                          </div>

                          <div className="grid gap-1.5">
                            <label className="text-xs font-bold text-[var(--text)]">Intro Paragraph 2</label>
                            <textarea className="min-h-[80px] w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] outline-none transition focus:border-[var(--color-primary)]" {...register("contentIntroParagraph2")} />
                          </div>
                        </div>

                        <div className="grid gap-1.5">
                          <label className="text-xs font-bold text-[var(--text)]">Why Shop Items (One per line)</label>
                          <textarea className="min-h-[80px] w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] outline-none transition focus:border-[var(--color-primary)]" placeholder="e.g. Verified coupon codes&#10;Fast shipping" {...register("contentWhyItemsText")} />
                        </div>

                        <div className="grid gap-1.5">
                          <label className="text-xs font-bold text-[var(--text)]">Outro Paragraph</label>
                          <textarea className="min-h-[80px] w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] outline-none transition focus:border-[var(--color-primary)]" {...register("contentOutro")} />
                        </div>

                        {/* FAQs Section */}
                        <div className="border-t border-[var(--border)] pt-4 space-y-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Frequently Asked Questions</span>
                          
                          <div className="grid gap-3">
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/20 p-3 space-y-2">
                              <label className="grid gap-1 text-[11px] font-bold text-[var(--text)]">
                                FAQ 1: Question
                                <Input className="h-8.5 text-xs rounded-md bg-[var(--surface)]" placeholder="e.g. How often are codes verified?" {...register("faq1Question")} />
                              </label>
                              <label className="grid gap-1 text-[11px] font-bold text-[var(--text)]">
                                FAQ 1: Answer
                                <textarea className="min-h-[60px] text-xs rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[var(--text)] outline-none" {...register("faq1Answer")} />
                              </label>
                            </div>

                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/20 p-3 space-y-2">
                              <label className="grid gap-1 text-[11px] font-bold text-[var(--text)]">
                                FAQ 2: Question
                                <Input className="h-8.5 text-xs rounded-md bg-[var(--surface)]" {...register("faq2Question")} />
                              </label>
                              <label className="grid gap-1 text-[11px] font-bold text-[var(--text)]">
                                FAQ 2: Answer
                                <textarea className="min-h-[60px] text-xs rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[var(--text)] outline-none" {...register("faq2Answer")} />
                              </label>
                            </div>

                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/20 p-3 space-y-2">
                              <label className="grid gap-1 text-[11px] font-bold text-[var(--text)]">
                                FAQ 3: Question
                                <Input className="h-8.5 text-xs rounded-md bg-[var(--surface)]" {...register("faq3Question")} />
                              </label>
                              <label className="grid gap-1 text-[11px] font-bold text-[var(--text)]">
                                FAQ 3: Answer
                                <textarea className="min-h-[60px] text-xs rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[var(--text)] outline-none" {...register("faq3Answer")} />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Sticky Action Footer */}
                <div className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-4 flex justify-end gap-3 shrink-0">
                  <Button type="button" variant="outline" className="rounded-lg h-9 text-xs font-bold px-4 border-[var(--border)] hover:bg-[var(--surface-soft)]" onClick={closeModal} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-lg h-9 text-xs font-bold px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-sm"
                    disabled={isSubmitting || isUploadingLogo}
                    aria-label={editingStore ? "Update store" : "Save store"}
                  >
                    {isSubmitting ? "Saving..." : editingStore ? "Update Store" : "Save Store"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BulkStoreImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        stores={stores}
        categories={categories}
        countries={countries}
        onImported={loadStores}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title={deleteTarget?.slug === "__bulk__" ? "Delete selected stores" : "Delete store"}
        description={
          deleteTarget?.slug === "__bulk__"
            ? `Delete ${selectedStoreSlugs.length} selected stores and all linked offers?`
            : deleteTarget
              ? `Delete ${deleteTarget.name} and all linked offers?`
              : ""
        }
        confirmLabel={deleteTarget?.slug === "__bulk__" ? "Delete Selected" : "Delete Store"}
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirmed}
        isSubmitting={isDeleting}
      />
    </>
  );
}
