"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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
import { DEFAULT_COUNTRY_CODE, SUPPORTED_COUNTRIES, sanitizeCountryList } from "@/lib/countries";

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
    .min(20, "Description should be at least 20 characters.")
    .max(280, "Description must stay under 280 characters."),
  trustStatus: z.enum(["Verified", "Trusted", "Pending", "Active"]),
  logoText: z
    .string()
    .trim()
    .max(24, "Logo text should stay concise.")
    .optional()
    .or(z.literal("")),
  affiliateLink: z.string().trim().optional().or(z.literal("")),
  logoImage: z.string().optional().or(z.literal("")),
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
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState(SUPPORTED_COUNTRIES);
  const [open, setOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [isHydrating, setIsHydrating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedStoreSlugs, setSelectedStoreSlugs] = useState([]);
  const slugEditedRef = useRef(false);
  const logoTextEditedRef = useRef(false);
  const fileInputRef = useRef(null);
  const descriptionRef = useRef(null);
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
  const watchedDescription = watch("description");
  const watchedLogoImage = watch("logoImage");
  const watchedLogoText = watch("logoText");

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
    setEditingStore(null);
    reset(defaultValues);
    setOpen(true);
  }

  function openEditModal(store) {
    slugEditedRef.current = true;
    logoTextEditedRef.current = true;
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

  async function submitStore(values) {
    const selectedCategory = getCategoryOptionMap(categories)[values.category];

    if (!selectedCategory) {
      toast.error("Select a managed category before saving the store.");
      return;
    }

    const endpoint = editingStore ? `/api/stores/${editingStore.slug}` : "/api/stores";
    const method = editingStore ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
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
    setSelectedStoreSlugs((current) => (current.length === stores.length ? [] : stores.map((store) => store.slug)));
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
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Stores Management</CardTitle>
            <CardDescription>Manage merchant details, slugs, trust signals, and offer coverage.</CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {selectedStoreSlugs.length ? (
              <Button type="button" variant="outline" className="rounded-lg" onClick={() => setDeleteTarget({ slug: "__bulk__", name: `${selectedStoreSlugs.length} selected stores` })}>
                Delete Selected ({selectedStoreSlugs.length})
              </Button>
            ) : null}
            <Button type="button" variant="ghost" size="sm" className="h-10 w-10 rounded-lg border border-[var(--border)] px-0" onClick={loadStores} aria-label="Refresh stores">
              <RefreshIcon />
            </Button>
            <Button type="button" variant="outline" className="rounded-lg" onClick={() => setBulkImportOpen(true)}>
              Bulk Import Stores
            </Button>
            <Button type="button" onClick={openCreateModal}>
              Add New Store
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">
                  <label className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border border-[var(--border)] bg-[var(--surface-soft)] accent-[var(--color-primary)]"
                      checked={stores.length > 0 && selectedStoreSlugs.length === stores.length}
                      onChange={toggleSelectAllStores}
                      aria-label="Select all stores"
                    />
                  </label>
                </TableHead>
                <TableHead>Store Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Offers Count</TableHead>
                <TableHead>Trust</TableHead>
                <TableHead>Edit/Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store) => (
                <TableRow key={store.slug}>
                  <TableCell>
                    <label className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border border-[var(--border)] bg-[var(--surface-soft)] accent-[var(--color-primary)]"
                        checked={selectedStoreSlugs.includes(store.slug)}
                        onChange={() => toggleStoreSelection(store.slug)}
                        aria-label={`Select ${store.name}`}
                      />
                    </label>
                  </TableCell>
                  <TableCell className="font-medium">{store.name}</TableCell>
                  <TableCell className="text-[var(--muted)]">/{store.slug}</TableCell>
                  <TableCell>{store.category}</TableCell>
                  <TableCell>{store.countryCode || DEFAULT_COUNTRY_CODE}</TableCell>
                  <TableCell>{store.offersCount}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{store.trustStatus}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(store)}>
                        Edit
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="border border-[var(--border)]" onClick={() => openDeleteModal(store)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!stores.length && !isHydrating ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-5 py-6 text-sm text-[var(--muted)]">
              No stores added yet. Use the modal above to create the first store.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          titleId={titleId}
          descriptionId={descriptionId}
          className="max-h-[calc(100vh-2rem)] max-w-5xl overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-0 sm:max-h-[calc(100vh-3rem)]"
        >
          <div className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-h-[calc(100vh-3rem)] lg:grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-soft),var(--surface))] p-6 lg:border-r lg:border-b-0 lg:p-8">
              <DialogHeader className="mb-8">
                <Badge className="w-fit border border-[var(--color-primary)]/20 bg-[var(--surface)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--color-primary)]">
                  Store editor
                </Badge>
                <DialogTitle id={titleId}>{editingStore ? "Update Store" : "Add New Store"}</DialogTitle>
                <DialogDescription id={descriptionId}>
                  Capture clean catalog metadata, upload a logo, and keep the store page ready for coupons and deals.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">Live preview</p>
                  <div className="mt-5 flex items-center gap-4">
                    {watchedLogoImage ? (
                      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-2">
                        <div className="relative h-full w-full overflow-hidden rounded-xl">
                          <Image src={watchedLogoImage} alt="Uploaded store logo preview" fill className="object-contain" unoptimized />
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-2 text-center text-xs font-bold text-[var(--text)]">
                        {watchedLogoText || watchedName || "LOGO"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold text-[var(--text)]">{watchedName || "Store name preview"}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">/{watchedSlug || "store-slug"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                  <p className="text-sm font-semibold text-[var(--text)]">Publishing checklist</p>
                  <div className="mt-4 space-y-3 text-sm text-[var(--muted)]">
                    <p>Name, slug, and category are required.</p>
                    <p>Logo uploads accept PNG, JPG, WEBP, or SVG up to 2MB.</p>
                    <p>Description should stay concise and editorial.</p>
                  </div>
                </div>
              </div>
            </div>

            <form className="grid gap-5 bg-[var(--surface)] p-6 lg:p-8" onSubmit={handleSubmit(submitStore)}>
              <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/35 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)]">Store basics</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">Clean naming, taxonomy, and trust settings.</p>
                  </div>
                  <Badge className="border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                    Required
                  </Badge>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="grid gap-2 text-sm text-[var(--muted)]">
                      <span className="font-medium text-[var(--text)]">Store Name</span>
                      <Input
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={errors.name ? "store-name-error" : "store-name-helper"}
                        placeholder="Nike Store"
                        className="rounded-lg bg-[var(--surface)]"
                        {...register("name")}
                      />
                    </label>
                    <div className="min-h-[20px] text-xs">
                      {errors.name ? (
                        <span id="store-name-error" className="text-sm text-[var(--color-primary)]">
                          {errors.name.message}
                        </span>
                      ) : (
                        <span id="store-name-helper" className="text-[var(--muted)]">
                          Store name appears in the public catalog.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className="grid gap-2 text-sm text-[var(--muted)]">
                      <span className="font-medium text-[var(--text)]">Slug</span>
                      <Input
                        aria-invalid={Boolean(errors.slug)}
                        aria-describedby={errors.slug ? "store-slug-error" : "store-slug-helper"}
                        placeholder="nike-store"
                        className="rounded-lg bg-[var(--surface)]"
                        {...register("slug", {
                          onChange: () => {
                            slugEditedRef.current = true;
                          },
                        })}
                      />
                    </label>
                    <div className="min-h-[20px] text-xs">
                      {errors.slug ? (
                        <span id="store-slug-error" className="text-sm text-[var(--color-primary)]">
                          {errors.slug.message}
                        </span>
                      ) : (
                        <span id="store-slug-helper" className="text-[var(--muted)]">
                          Auto-generated from the store name until you edit it manually.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <div className="grid gap-2 text-sm text-[var(--muted)]">
                      <span className="font-medium text-[var(--text)]">Category</span>
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
                    </div>
                    <div className="min-h-[20px] text-xs">
                      {errors.category ? (
                        <span className="text-sm text-[var(--color-primary)]">{errors.category.message}</span>
                      ) : (
                        <span className="text-[var(--muted)]">Select the primary catalog grouping.</span>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className="grid gap-2 text-sm text-[var(--muted)]">
                      <span className="font-medium text-[var(--text)]">Country</span>
                      <select
                        aria-label="Select country"
                        className="h-11 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(139, 92, 246,0.16)]"
                        {...register("countryCode")}
                      >
                        {countries.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.code} - {country.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="min-h-[20px] text-xs text-[var(--muted)]">Used for country-based storefront filtering.</div>
                  </div>

                  <div className="grid gap-2">
                    <label className="grid gap-2 text-sm text-[var(--muted)]">
                      <span className="font-medium text-[var(--text)]">Trust Status</span>
                      <select
                        aria-label="Select trust status"
                        className="h-11 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(139, 92, 246,0.16)]"
                        {...register("trustStatus")}
                      >
                        <option>Active</option>
                        <option>Verified</option>
                        <option>Trusted</option>
                        <option>Pending</option>
                      </select>
                    </label>
                    <div className="min-h-[20px] text-xs text-[var(--muted)]">Controls public confidence messaging.</div>
                  </div>
              </div>
              </section>

              <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/35 p-4 sm:p-5">
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">Branding</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">Upload a store logo and keep a fallback text mark for compact slots.</p>
                </div>

              <div className="grid gap-2 text-sm text-[var(--muted)]">
                <span className="font-medium text-[var(--text)]">Store Logo</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_LOGO_TYPES.join(",")}
                  className="hidden"
                  onChange={handleFileInputChange}
                  aria-label="Upload store logo"
                />
                <div
                  className={cn(
                    "rounded-2xl border border-dashed p-5 transition",
                    isDraggingLogo
                      ? "border-[var(--color-primary)] bg-[var(--surface)]"
                      : "border-[var(--border)] bg-[var(--surface)]"
                  )}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDraggingLogo(true);
                  }}
                  onDragLeave={() => setIsDraggingLogo(false)}
                  onDrop={handleLogoDrop}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-[var(--muted)]">
                      <p className="font-medium text-[var(--text)]">Drag and drop a logo, or browse files.</p>
                      <p className="mt-1">Supported: PNG, JPG, WEBP, SVG up to 2MB.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button type="button" variant="outline" className="rounded-lg bg-[var(--surface-soft)]" onClick={() => fileInputRef.current?.click()}>
                        {isUploadingLogo ? (
                          <>
                            <Spinner />
                            Uploading...
                          </>
                        ) : (
                          "Upload Image"
                        )}
                      </Button>
                      {watchedLogoImage ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text)] hover:bg-[var(--surface)]"
                          disabled={isUploadingLogo}
                          onClick={() => setValue("logoImage", "", { shouldDirty: true, shouldValidate: true })}
                        >
                          Remove Image
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
                {errors.logoImage ? <span className="text-sm text-[var(--color-primary)]">{errors.logoImage.message}</span> : null}
              </div>

              <label className="grid gap-2 text-sm text-[var(--muted)]">
                <span className="font-medium text-[var(--text)]">Affiliate Link</span>
                <Input
                  type="url"
                  placeholder="https://example.com/track/store"
                  className="rounded-lg bg-[var(--surface)]"
                  {...register("affiliateLink")}
                />
                <span className="text-xs text-[var(--muted)]">Used for store CTA links when available.</span>
              </label>

              <label className="grid gap-2 text-sm text-[var(--muted)]">
                <span className="font-medium text-[var(--text)]">Logo Text Fallback</span>
                <Input
                  aria-invalid={Boolean(errors.logoText)}
                  placeholder="Auto-generated from store name"
                  className="rounded-lg bg-[var(--surface)]"
                  {...register("logoText", {
                    onChange: () => {
                      logoTextEditedRef.current = true;
                    },
                  })}
                />
                <span className="text-xs text-[var(--muted)]">Used when no image is uploaded, and kept as a fallback for compact UI slots.</span>
                {errors.logoText ? <span className="text-sm text-[var(--color-primary)]">{errors.logoText.message}</span> : null}
              </label>
              </section>

              <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/35 p-4 sm:p-5">
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">Editorial copy</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">Keep the public store page summary concise and scannable.</p>
                </div>

              <label className="grid gap-2 text-sm text-[var(--muted)]">
                <span className="font-medium text-[var(--text)]">Description</span>
                <textarea
                  ref={(element) => {
                    descriptionRef.current = element;
                    descriptionField.ref(element);
                  }}
                  rows={4}
                  maxLength={280}
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby={errors.description ? "store-description-error" : undefined}
                  className="min-h-[124px] w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(139, 92, 246,0.16)]"
                  placeholder="Write a concise editorial summary for the store page."
                  name={descriptionField.name}
                  onBlur={descriptionField.onBlur}
                  onChange={descriptionField.onChange}
                />
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>Lightweight editorial copy with auto-resize.</span>
                  <span>{watchedDescription.length}/280</span>
                </div>
                {errors.description ? (
                  <span id="store-description-error" className="text-sm text-[var(--color-primary)]">
                    {errors.description.message}
                  </span>
                ) : null}
              </label>
              </section>

              <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/35 p-4 sm:p-5">
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">Store page content</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">Optional custom content for the info section and FAQs. Leave blank to use default template copy.</p>
                </div>

                <div className="grid gap-5">
                  <label className="grid gap-2 text-sm text-[var(--muted)]">
                    <span className="font-medium text-[var(--text)]">Intro Title</span>
                    <Input className="rounded-lg bg-[var(--surface)]" placeholder="More Information On Carter's Deals" {...register("contentIntroTitle")} />
                  </label>

                  <label className="grid gap-2 text-sm text-[var(--muted)]">
                    <span className="font-medium text-[var(--text)]">Intro Paragraph 1</span>
                    <textarea className="min-h-[110px] w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(139, 92, 246,0.16)]" {...register("contentIntroParagraph1")} />
                  </label>

                  <label className="grid gap-2 text-sm text-[var(--muted)]">
                    <span className="font-medium text-[var(--text)]">Intro Paragraph 2</span>
                    <textarea className="min-h-[110px] w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(139, 92, 246,0.16)]" {...register("contentIntroParagraph2")} />
                  </label>

                  <label className="grid gap-2 text-sm text-[var(--muted)]">
                    <span className="font-medium text-[var(--text)]">Why Items</span>
                    <textarea className="min-h-[120px] w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(139, 92, 246,0.16)]" placeholder={"One bullet per line"} {...register("contentWhyItemsText")} />
                  </label>

                  <label className="grid gap-2 text-sm text-[var(--muted)]">
                    <span className="font-medium text-[var(--text)]">Outro</span>
                    <textarea className="min-h-[100px] w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(139, 92, 246,0.16)]" {...register("contentOutro")} />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm text-[var(--muted)]">
                      <span className="font-medium text-[var(--text)]">FAQ 1 Question</span>
                      <Input className="rounded-lg bg-[var(--surface)]" {...register("faq1Question")} />
                    </label>
                    <label className="grid gap-2 text-sm text-[var(--muted)]">
                      <span className="font-medium text-[var(--text)]">FAQ 1 Answer</span>
                      <textarea className="min-h-[100px] w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(139, 92, 246,0.16)]" {...register("faq1Answer")} />
                    </label>

                    <label className="grid gap-2 text-sm text-[var(--muted)]">
                      <span className="font-medium text-[var(--text)]">FAQ 2 Question</span>
                      <Input className="rounded-lg bg-[var(--surface)]" {...register("faq2Question")} />
                    </label>
                    <label className="grid gap-2 text-sm text-[var(--muted)]">
                      <span className="font-medium text-[var(--text)]">FAQ 2 Answer</span>
                      <textarea className="min-h-[100px] w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(139, 92, 246,0.16)]" {...register("faq2Answer")} />
                    </label>

                    <label className="grid gap-2 text-sm text-[var(--muted)]">
                      <span className="font-medium text-[var(--text)]">FAQ 3 Question</span>
                      <Input className="rounded-lg bg-[var(--surface)]" {...register("faq3Question")} />
                    </label>
                    <label className="grid gap-2 text-sm text-[var(--muted)]">
                      <span className="font-medium text-[var(--text)]">FAQ 3 Answer</span>
                      <textarea className="min-h-[100px] w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(139, 92, 246,0.16)]" {...register("faq3Answer")} />
                    </label>
                  </div>
                </div>
              </section>

              <div className="sticky bottom-0 flex flex-col gap-3 border-t border-[var(--border)] bg-[var(--surface)] pt-5 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" className="rounded-lg" onClick={closeModal} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-lg shadow-[0_10px_30px_rgba(139, 92, 246,0.14)]"
                  disabled={isSubmitting || isUploadingLogo}
                  aria-label={editingStore ? "Update store" : "Save store"}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner />
                      Saving Store...
                    </>
                  ) : editingStore ? (
                    "Update Store"
                  ) : (
                    "Save Store"
                  )}
                </Button>
              </div>
            </form>
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
