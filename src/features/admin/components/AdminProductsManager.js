"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ConfirmModal } from "@/components/ui/AppModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";

const initialForm = {
  title: "",
  description: "",
  image: "",
  price: "",
  originalPrice: "",
  ctaLabel: "View Product",
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
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState("");

  const visibleProducts = useMemo(() => {
    if (selectedStoreFilter === "all") {
      return products;
    }

    return products.filter((product) => product.storeSlug === selectedStoreFilter);
  }, [products, selectedStoreFilter]);

  async function loadData() {
    const [productsResponse, storesResponse] = await Promise.all([
      fetch("/api/products", { cache: "no-store" }),
      fetch("/api/stores", { cache: "no-store" }),
    ]);

    const [productsPayload, storesPayload] = await Promise.all([productsResponse.json(), storesResponse.json()]);
    setProducts(productsPayload.data || []);
    setStores(storesPayload.data || []);
  }

  useEffect(() => {
    let active = true;

    async function hydrateData() {
      const [productsResponse, storesResponse] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }),
        fetch("/api/stores", { cache: "no-store" }),
      ]);

      const [productsPayload, storesPayload] = await Promise.all([productsResponse.json(), storesResponse.json()]);

      if (active) {
        setProducts(productsPayload.data || []);
        setStores(storesPayload.data || []);
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
      ctaLabel: product.ctaLabel || "View Product",
      status: product.status || "Active",
      storeSlug: product.storeSlug,
      storeName: product.storeName,
    });
    setError("");
    setOpen(true);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    const nextState = { ...form, [name]: value };

    if (name === "storeSlug") {
      const matchedStore = stores.find((store) => store.slug === value);
      nextState.storeName = matchedStore?.name || "";
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
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Products</CardTitle>
            <CardDescription>Manage store-linked products that appear after coupons and deals on store pages.</CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={selectedStoreFilter}
              onChange={(event) => setSelectedStoreFilter(event.target.value)}
              className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text)] outline-none"
            >
              <option value="all">All stores</option>
              {stores.map((store) => (
                <option key={store.slug} value={store.slug}>
                  {store.name}
                </option>
              ))}
            </select>
            <Button type="button" variant="ghost" size="sm" className="h-10 w-10 rounded-lg border border-[var(--border)] px-0" onClick={loadData} aria-label="Refresh products">
              <RefreshIcon />
            </Button>
            <Button type="button" onClick={handleOpenCreate}>
              Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Edit/Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-[var(--text)]">{product.title}</p>
                      <p className="text-sm text-[var(--muted)]">{product.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>{product.storeName}</TableCell>
                  <TableCell>
                    {product.originalPrice ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-[var(--text)]">${product.price}</span>
                        <span className="text-sm text-[var(--muted)] line-through">${product.originalPrice}</span>
                      </div>
                    ) : (
                      `$${product.price}`
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => handleOpenEdit(product)}>
                        Edit
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="border border-[var(--border)]" onClick={() => setDeleteTarget(product)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!visibleProducts.length ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-5 py-6 text-sm text-[var(--muted)]">
              No products found. Add products and assign them to stores from the admin panel.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
            <DialogDescription>Create store-linked products that appear after offers on public store pages.</DialogDescription>
          </DialogHeader>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm text-[var(--muted)] md:col-span-2">
              Product Title
              <Input name="title" value={form.title} onChange={handleChange} placeholder="Nike Air Max 2026" />
            </label>
            <label className="grid gap-2 text-sm text-[var(--muted)] md:col-span-2">
              Description
              <textarea
                name="description"
                rows={4}
                value={form.description}
                onChange={handleChange}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--color-primary)]"
                placeholder="Short product description for the store page."
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              Store
              <select
                name="storeSlug"
                value={form.storeSlug}
                onChange={handleChange}
                className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm text-[var(--text)] outline-none focus:border-[var(--color-primary)]"
              >
                <option value="">Select store</option>
                {stores.map((store) => (
                  <option key={store.slug} value={store.slug}>
                    {store.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              Status
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm text-[var(--text)] outline-none focus:border-[var(--color-primary)]"
              >
                <option>Active</option>
                <option>Draft</option>
                <option>Out of stock</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              Price
              <Input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} placeholder="99.99" />
            </label>
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              Original Price
              <Input name="originalPrice" type="number" min="0" step="0.01" value={form.originalPrice} onChange={handleChange} placeholder="129.99" />
            </label>
            <label className="grid gap-2 text-sm text-[var(--muted)] md:col-span-2">
              Product Image
              <div className="grid gap-3">
                {form.image ? (
                  <div className="relative h-48 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]">
                    <Image src={form.image} alt="Product preview" fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] text-sm text-[var(--muted)]">
                    No product image uploaded yet.
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <label className="inline-flex cursor-pointer">
                    <input
                      type="file"
                      accept={ACCEPTED_IMAGE_TYPES.join(",")}
                      className="hidden"
                      onChange={(event) => handleImageSelection(event.target.files?.[0])}
                    />
                    <span className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--surface-soft)]">
                      {isUploadingImage ? "Uploading..." : "Upload from Cloudinary"}
                    </span>
                  </label>
                  {form.image ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-lg border border-[var(--border)]"
                      onClick={() => setForm((current) => ({ ...current, image: "" }))}
                      disabled={isUploadingImage}
                    >
                      Remove Image
                    </Button>
                  ) : null}
                </div>
                <Input name="image" value={form.image} onChange={handleChange} placeholder="Or paste image URL manually" />
              </div>
            </label>
            <label className="grid gap-2 text-sm text-[var(--muted)] md:col-span-2">
              CTA Label
              <Input name="ctaLabel" value={form.ctaLabel} onChange={handleChange} placeholder="View Product" />
              <span className="text-xs text-[var(--muted)]">Product page URL automatically generate hogi title aur selected store se.</span>
            </label>
            {error ? <p className="text-sm text-[var(--muted)] md:col-span-2">{error}</p> : null}
            <div className="flex gap-3 md:col-span-2 md:justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isUploadingImage} leadingIcon={isSubmitting ? <Spinner /> : null}>
                {isSubmitting ? "Saving Product..." : editingProduct ? "Update Product" : "Save Product"}
              </Button>
            </div>
          </form>
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
