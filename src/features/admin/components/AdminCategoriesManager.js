"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const [categories, setCategories] = useState([]);
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
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Categories Management</CardTitle>
            <CardDescription>Manage the taxonomy used by stores and public catalog routes.</CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 w-10 rounded-lg border border-[var(--border)] px-0"
              onClick={() => loadData(true)}
              aria-label="Refresh categories"
              disabled={isRefreshing}
            >
              <RefreshIcon />
            </Button>
            <Button type="button" onClick={openCreateModal}>
              Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Linked Stores</TableHead>
                <TableHead>Edit/Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.slug}>
                  <TableCell>
                    <p className="font-medium text-[var(--text)]">{category.name}</p>
                  </TableCell>
                  <TableCell className="text-[var(--muted)]">/{category.slug}</TableCell>
                  <TableCell className="max-w-[320px] text-sm text-[var(--muted)]">
                    {category.description || "No description added yet."}
                  </TableCell>
                  <TableCell>{categoryStoreCounts[category.slug] || 0}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(category)}>
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="border border-[var(--border)]"
                        onClick={() => setDeleteTarget(category)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!categories.length && !isHydrating ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-5 py-6 text-sm text-[var(--muted)]">
              No categories added yet. Create the first category to structure store taxonomy.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          titleId={titleId}
          descriptionId={descriptionId}
          className="max-w-2xl rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-0"
        >
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-soft),var(--surface))] p-6 lg:border-r lg:border-b-0 lg:p-8">
              <DialogHeader className="mb-6">
                <Badge className="w-fit border border-[var(--color-primary)]/20 bg-[var(--surface)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--color-primary)]">
                  Taxonomy editor
                </Badge>
                <DialogTitle id={titleId}>{editingCategory ? "Update Category" : "Add New Category"}</DialogTitle>
                <DialogDescription id={descriptionId}>
                  Keep store grouping consistent across the dashboard and public catalog.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">Preview</p>
                  <p className="mt-4 text-lg font-semibold text-[var(--text)]">{watchedName || "Category name preview"}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">/{watchedSlug || "category-slug"}</p>
                  <p className="mt-4 text-sm text-[var(--muted)]">
                    {watchedDescription || "Optional description helps admins understand the taxonomy intent."}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                  <p className="text-sm font-semibold text-[var(--text)]">Safety note</p>
                  <p className="mt-3 text-sm text-[var(--muted)]">
                    Category slug updates automatically sync linked stores so existing route patterns stay aligned.
                  </p>
                </div>
              </div>
            </div>

            <form className="grid gap-5 bg-[var(--surface)] p-6 lg:p-8" onSubmit={handleSubmit(submitCategory)}>
              <label className="grid gap-2 text-sm text-[var(--muted)]">
                <span className="font-medium text-[var(--text)]">Category Name</span>
                <Input placeholder="Fashion" className="rounded-lg bg-[var(--surface)]" {...register("name")} />
                {errors.name ? <span className="text-sm text-[var(--color-primary)]">{errors.name.message}</span> : null}
              </label>

              <label className="grid gap-2 text-sm text-[var(--muted)]">
                <span className="font-medium text-[var(--text)]">Slug</span>
                <Input
                  placeholder="fashion"
                  className="rounded-lg bg-[var(--surface)]"
                  {...register("slug", {
                    onChange: () => {
                      slugEditedRef.current = true;
                    },
                  })}
                />
                <span className="text-xs text-[var(--muted)]">Used in admin taxonomy and store route grouping.</span>
                {errors.slug ? <span className="text-sm text-[var(--color-primary)]">{errors.slug.message}</span> : null}
              </label>

              <label className="grid gap-2 text-sm text-[var(--muted)]">
                <span className="font-medium text-[var(--text)]">Description</span>
                <textarea
                  rows={5}
                  maxLength={180}
                  className="min-h-[132px] w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(139, 92, 246,0.16)]"
                  placeholder="Optional notes about the stores that belong to this category."
                  {...register("description")}
                />
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>Optional internal guidance for admins.</span>
                  <span>{watchedDescription.length}/180</span>
                </div>
                {errors.description ? <span className="text-sm text-[var(--color-primary)]">{errors.description.message}</span> : null}
              </label>

              <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" className="rounded-lg" onClick={() => setOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-lg"
                  disabled={isSubmitting}
                  leadingIcon={isSubmitting ? <Spinner /> : null}
                >
                  {isSubmitting ? (editingCategory ? "Updating Category..." : "Saving Category...") : editingCategory ? "Update Category" : "Save Category"}
                </Button>
              </div>
            </form>
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
