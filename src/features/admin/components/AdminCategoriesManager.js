"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/AppModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, useDialogA11yIds } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { cn } from "@/lib/utils";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase and URL-friendly."),
  description: z.string().trim().max(180, "Description must stay under 180 characters.").optional().or(z.literal("")),
});

const defaultValues = {
  name: "",
  slug: "",
  description: "",
};

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

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminCategoriesManager() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const [categories, setCategories] = useState([]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    const lowerQuery = searchQuery.toLowerCase();
    return categories.filter((category) => {
      const name = (category.name || "").toLowerCase();
      const slug = (category.slug || "").toLowerCase();
      const desc = (category.description || "").toLowerCase();
      return name.includes(lowerQuery) || slug.includes(lowerQuery) || desc.includes(lowerQuery);
    });
  }, [categories, searchQuery]);

  const [stores, setStores] = useState([]);
  const [isHydrating, setIsHydrating] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const slugEditedRef = useRef(false);
  const { titleId, descriptionId } = useDialogA11yIds();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues,
  });

  const watchedName = watch("name");
  const watchedSlug = watch("slug");
  const watchedDescription = watch("description");

  const categoryStoreCounts = useMemo(
    () =>
      stores.reduce((accumulator, store) => {
        const key = store.categorySlug || slugify(store.category || "");
        accumulator[key] = (accumulator[key] || 0) + 1;
        return accumulator;
      }, {}),
    [stores]
  );

  async function loadData(showRefreshState = false) {
    if (showRefreshState) {
      setIsRefreshing(true);
    } else {
      setIsHydrating(true);
    }

    try {
      const [categoriesResponse, storesResponse] = await Promise.all([
        fetch("/api/categories", { cache: "no-store" }),
        fetch("/api/stores", { cache: "no-store" }),
      ]);
      const [categoriesPayload, storesPayload] = await Promise.all([categoriesResponse.json(), storesResponse.json()]);

      setCategories(categoriesPayload.data || []);
      setStores(storesPayload.data || []);
    } finally {
      setIsHydrating(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!slugEditedRef.current) {
      setValue("slug", slugify(watchedName || ""), { shouldValidate: true });
    }
  }, [setValue, watchedName]);

  function openCreateModal() {
    slugEditedRef.current = false;
    setEditingCategory(null);
    reset(defaultValues);
    setOpen(true);
  }

  function openEditModal(category) {
    slugEditedRef.current = false;
    setEditingCategory(category);
    reset({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
    });
    setOpen(true);
  }

  async function submitCategory(values) {
    const endpoint = editingCategory ? `/api/categories/${editingCategory.slug}` : "/api/categories";
    const method = editingCategory ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await response.json();

    if (!response.ok) {
      toast.error(payload.error || "Unable to save category.");
      return;
    }

    await loadData();
    setOpen(false);
    setEditingCategory(null);
    slugEditedRef.current = false;
    reset(defaultValues);
    toast.success(editingCategory ? "Category updated." : "Category created.");
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/categories/${deleteTarget.slug}`, { method: "DELETE" });
      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.error || "Unable to delete category.");
        return;
      }

      await loadData();
      setDeleteTarget(null);
      toast.success("Category deleted.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-center sm:justify-between p-6">
          <div>
            <CardTitle className="text-base font-bold tracking-tight text-[var(--text)]">Categories Management</CardTitle>
            <CardDescription className="text-xs text-[var(--muted)] mt-0.5">Manage the taxonomy used by stores and public catalog routes.</CardDescription>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 w-10 rounded-xl border border-[var(--border)] px-0 text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
              onClick={() => loadData(true)}
              aria-label="Refresh categories"
              disabled={isRefreshing}
            >
              <RefreshIcon />
            </Button>
            <Button
              type="button"
              className="rounded-xl font-bold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-sm transition-all duration-200 px-5 h-10 text-xs cursor-pointer"
              onClick={openCreateModal}
            >
              Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {filteredCategories.length ? (
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
              <Table>
                <TableHeader className="bg-[var(--surface-soft)]/50">
                  <TableRow className="border-b border-[var(--border)] hover:bg-transparent">
                    <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-3">Category</TableHead>
                    <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-3">Slug</TableHead>
                    <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-3">Description</TableHead>
                    <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-3">Linked Stores</TableHead>
                    <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-3">Edit/Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <TableRow key={category.slug} className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--surface-soft)]/30 transition-colors duration-150">
                      {/* Category Name */}
                      <TableCell className="px-3 py-3">
                        <span className="text-xs font-bold text-[var(--color-primary)]">{category.name}</span>
                      </TableCell>
                      {/* Slug */}
                      <TableCell className="px-3 py-3">
                        <span className="font-mono text-[11px] text-[var(--color-primary)]/70">/{category.slug}</span>
                      </TableCell>
                      {/* Description */}
                      <TableCell className="px-3 py-3 max-w-[280px]">
                        <span className={cn(
                          "text-xs",
                          category.description ? "text-[var(--muted)]" : "italic text-[var(--muted)]/50"
                        )}>
                          {category.description || "No description added yet."}
                        </span>
                      </TableCell>
                      {/* Linked Stores count */}
                      <TableCell className="px-3 py-3">
                        <span className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--muted)] min-w-[28px]">
                          {categoryStoreCounts[category.slug] || 0}
                        </span>
                      </TableCell>
                      {/* Actions */}
                      <TableCell className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-lg border border-[var(--border)] p-0 text-[var(--muted)] hover:text-[var(--color-primary)] hover:bg-[var(--surface-soft)] cursor-pointer"
                            onClick={() => openEditModal(category)}
                            aria-label={`Edit ${category.name}`}
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
                            onClick={() => setDeleteTarget(category)}
                            aria-label={`Delete ${category.name}`}
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
          ) : null}

          {!filteredCategories.length && !isHydrating ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-6 py-10 text-center">
              <h3 className="text-sm font-bold text-[var(--text)]">
                {searchQuery ? "No matching categories" : "No categories yet"}
              </h3>
              <p className="mt-2 text-xs text-[var(--muted)]">
                {searchQuery ? "Try a different search query." : "Create the first category to structure store taxonomy."}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          titleId={titleId}
          descriptionId={descriptionId}
          className="max-h-[calc(100vh-2rem)] max-w-4xl overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-0 shadow-2xl sm:max-h-[calc(100vh-3rem)]"
        >
          <div className="grid gap-0 lg:grid-cols-[380px_1fr] h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] max-h-[700px] overflow-hidden">
            {/* Left Column - Live Preview & Checklist */}
            <div className="border-b border-[var(--border)] bg-gradient-to-br from-[var(--surface-soft)] via-[var(--surface)] to-[var(--surface-soft)]/30 p-6 lg:border-r lg:border-b-0 lg:p-8 flex flex-col justify-between overflow-y-auto">
              <div>
                <DialogHeader className="mb-6">
                  <span className="w-fit inline-flex items-center rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                    Taxonomy Editor
                  </span>
                  <DialogTitle id={titleId} className="text-lg font-bold tracking-tight text-[var(--text)] mt-3">
                    {editingCategory ? "Update Category" : "Add New Category"}
                  </DialogTitle>
                  <DialogDescription id={descriptionId} className="text-xs text-[var(--muted)] mt-1">
                    Keep store grouping consistent across the dashboard and public catalog.
                  </DialogDescription>
                </DialogHeader>

                {/* Live Preview Card */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Live Preview</span>
                  <div className="relative rounded-2xl border border-[var(--border)]/70 bg-[var(--surface)] p-5 shadow-md overflow-hidden">
                    {/* Category icon placeholder */}
                    <div className="h-10 w-10 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center mb-3">
                      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--color-primary)] stroke-current" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 7h16M4 12h16M4 17h16" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-bold text-[var(--text)] truncate">
                      {watchedName || <span className="italic text-[var(--muted)]/60 font-normal">Category name preview</span>}
                    </h4>
                    <p className="mt-1 font-mono text-[11px] text-[var(--color-primary)]/70">
                      /{watchedSlug || "category-slug"}
                    </p>
                    <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed line-clamp-3 min-h-[48px]">
                      {watchedDescription || "Optional description helps admins understand the taxonomy intent."}
                    </p>
                    <div className="mt-3 pt-3 border-t border-[var(--border)]/50">
                      <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--muted)]">
                        0 stores linked
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="mt-6 border-t border-[var(--border)] pt-5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Requirements Checklist</span>
                <ul className="mt-3.5 space-y-2.5 text-xs text-[var(--muted)] font-medium">
                  <li className="flex items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", watchedName ? "bg-purple-500" : "bg-[var(--border)]")} />
                    <span>Category name provided</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", watchedSlug ? "bg-blue-500" : "bg-[var(--border)]")} />
                    <span>URL-safe slug generated</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", watchedDescription ? "bg-emerald-500" : "bg-[var(--border)]")} />
                    <span>Description added (optional)</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="flex flex-col h-full bg-[var(--surface)] overflow-hidden">
              <form className="flex flex-col h-full overflow-hidden" onSubmit={handleSubmit(submitCategory)}>
                <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-5">
                  <label className="grid gap-2 text-sm text-[var(--muted)]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">Category Name</span>
                    <Input
                      placeholder="Fashion"
                      className="h-11 rounded-xl border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                      {...register("name")}
                    />
                    {errors.name ? <span className="text-xs text-red-500">{errors.name.message}</span> : null}
                  </label>

                  <label className="grid gap-2 text-sm text-[var(--muted)]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">Slug</span>
                    <Input
                      placeholder="fashion"
                      className="h-11 rounded-xl border-[var(--border)] bg-[var(--surface-soft)] px-4 font-mono text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                      {...register("slug", {
                        onChange: () => {
                          slugEditedRef.current = true;
                        },
                      })}
                    />
                    <span className="text-[11px] text-[var(--muted)]">Used in admin taxonomy and public store route grouping.</span>
                    {errors.slug ? <span className="text-xs text-red-500">{errors.slug.message}</span> : null}
                  </label>

                  <label className="grid gap-2 text-sm text-[var(--muted)]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">Description</span>
                    <textarea
                      rows={5}
                      maxLength={180}
                      className="min-h-[120px] w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                      placeholder="Optional notes about the stores that belong to this category."
                      {...register("description")}
                    />
                    <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
                      <span>Optional internal guidance for admins.</span>
                      <span className={cn(watchedDescription.length > 150 ? "text-amber-500" : "")}>{watchedDescription.length}/180</span>
                    </div>
                    {errors.description ? <span className="text-xs text-red-500">{errors.description.message}</span> : null}
                  </label>
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--surface-soft)]/50 px-6 py-4 lg:px-8">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-[var(--border)] px-5 h-10 text-xs font-bold text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                    onClick={() => setOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-xl font-bold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-sm transition-all duration-200 px-5 h-10 text-xs cursor-pointer"
                    disabled={isSubmitting}
                    leadingIcon={isSubmitting ? <Spinner /> : null}
                  >
                    {isSubmitting
                      ? editingCategory ? "Updating..." : "Saving..."
                      : editingCategory ? "Update Category" : "Save Category"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setDeleteTarget(null);
          }
        }}
        title="Delete category"
        description={
          deleteTarget
            ? `Delete ${deleteTarget.name}? This will be blocked automatically if any stores are still linked to it.`
            : ""
        }
        confirmLabel="Delete Category"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirmed}
        isSubmitting={isDeleting}
      />
    </>
  );
}
