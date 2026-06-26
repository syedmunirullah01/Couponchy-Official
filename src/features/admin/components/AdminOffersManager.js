"use client";

import { useEffect, useRef, useState } from "react";
import { ConfirmModal } from "@/components/ui/AppModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import BulkCouponImportDialog from "@/features/admin/components/BulkCouponImportDialog";

const initialForm = {
  title: "",
  description: "",
  type: "Coupon",
  storeSlug: "",
  storeName: "",
  affiliateLink: "",
  source: "Manual",
  expiryDate: "",
  status: "Active",
  code: "",
};

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

export default function AdminOffersManager() {
  const [offers, setOffers] = useState([]);
  const [stores, setStores] = useState([]);
  const [open, setOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedOfferIds, setSelectedOfferIds] = useState([]);
  const [error, setError] = useState("");
  const affiliateEditedRef = useRef(false);

  async function loadData() {
    const [offersResponse, storesResponse] = await Promise.all([
      fetch("/api/offers", { cache: "no-store" }),
      fetch("/api/stores", { cache: "no-store" }),
    ]);

    const [offersPayload, storesPayload] = await Promise.all([offersResponse.json(), storesResponse.json()]);
    setOffers(offersPayload.data || []);
    setStores(storesPayload.data || []);
    setSelectedOfferIds((current) => current.filter((id) => (offersPayload.data || []).some((offer) => offer.id === id)));
  }

  useEffect(() => {
    let active = true;

    async function hydrateData() {
      const [offersResponse, storesResponse] = await Promise.all([
        fetch("/api/offers", { cache: "no-store" }),
        fetch("/api/stores", { cache: "no-store" }),
      ]);

      const [offersPayload, storesPayload] = await Promise.all([offersResponse.json(), storesResponse.json()]);

      if (active) {
        setOffers(offersPayload.data || []);
        setStores(storesPayload.data || []);
        setSelectedOfferIds([]);
      }
    }

    hydrateData();

    return () => {
      active = false;
    };
  }, []);

  function handleOpenCreate() {
    setEditingOffer(null);
    setForm(initialForm);
    affiliateEditedRef.current = false;
    setError("");
    setOpen(true);
  }

  function handleOpenEdit(offer) {
    setEditingOffer(offer);
    setForm({
      title: offer.title,
      description: offer.description || "",
      type: offer.type,
      storeSlug: offer.storeSlug,
      storeName: offer.storeName,
      affiliateLink: offer.affiliateLink || "",
      source: offer.source,
      expiryDate: offer.expiryDate,
      status: offer.status,
      code: offer.code || "",
    });
    affiliateEditedRef.current = Boolean(offer.affiliateLink);
    setError("");
    setOpen(true);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    const nextState = { ...form, [name]: value };

    if (name === "storeSlug") {
      const matchedStore = stores.find((store) => store.slug === value);
      nextState.storeName = matchedStore?.name || "";
      if (!affiliateEditedRef.current) {
        nextState.affiliateLink = matchedStore?.affiliateLink || "";
      }
    }

    if (name === "affiliateLink") {
      affiliateEditedRef.current = value.trim().length > 0;
    }

    setForm(nextState);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const endpoint = editingOffer ? `/api/offers/${editingOffer.id}` : "/api/offers";
    const method = editingOffer ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error || "Unable to save offer.");
      setIsSubmitting(false);
      return;
    }

    await loadData();
    setOpen(false);
    setForm(initialForm);
    setEditingOffer(null);
    affiliateEditedRef.current = false;
    setIsSubmitting(false);
  }

  function openDeleteModal(offer) {
    setDeleteTarget(offer);
  }

  function toggleOfferSelection(offerId) {
    setSelectedOfferIds((current) =>
      current.includes(offerId) ? current.filter((id) => id !== offerId) : [...current, offerId]
    );
  }

  function toggleSelectAll() {
    setSelectedOfferIds((current) => (current.length === offers.length ? [] : offers.map((offer) => offer.id)));
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget && !selectedOfferIds.length) {
      return;
    }

    setIsDeleting(true);
    const idsToDelete = deleteTarget?.id === "__bulk__" ? selectedOfferIds : deleteTarget ? [deleteTarget.id] : selectedOfferIds;
    const responses = await Promise.all(idsToDelete.map((id) => fetch(`/api/offers/${id}`, { method: "DELETE" })));

    if (responses.some((response) => !response.ok)) {
      setIsDeleting(false);
      return;
    }

    setDeleteTarget(null);
    setSelectedOfferIds([]);
    setIsDeleting(false);
    await loadData();
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Coupons & Deals</CardTitle>
            <CardDescription>Manage coupon codes and direct deals from one place.</CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {selectedOfferIds.length ? (
              <Button type="button" variant="outline" className="rounded-lg" onClick={() => setDeleteTarget({ id: "__bulk__", title: `${selectedOfferIds.length} selected offers` })}>
                Delete Selected ({selectedOfferIds.length})
              </Button>
            ) : null}
            <Button type="button" variant="ghost" size="sm" className="h-10 w-10 rounded-lg border border-[var(--border)] px-0" onClick={loadData} aria-label="Refresh offers">
              <RefreshIcon />
            </Button>
            <Button type="button" variant="outline" className="rounded-lg" onClick={() => setBulkImportOpen(true)}>
              Import CSV
            </Button>
            <Button type="button" onClick={handleOpenCreate}>
              Add Coupon / Deal
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
                      checked={offers.length > 0 && selectedOfferIds.length === offers.length}
                      onChange={toggleSelectAll}
                      aria-label="Select all offers"
                    />
                  </label>
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Edit/Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell>
                    <label className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border border-[var(--border)] bg-[var(--surface-soft)] accent-[var(--color-primary)]"
                        checked={selectedOfferIds.includes(offer.id)}
                        onChange={() => toggleOfferSelection(offer.id)}
                        aria-label={`Select ${offer.title}`}
                      />
                    </label>
                  </TableCell>
                  <TableCell className="font-medium">{offer.title}</TableCell>
                  <TableCell>{offer.type}</TableCell>
                  <TableCell>{offer.storeName}</TableCell>
                  <TableCell>{offer.source}</TableCell>
                  <TableCell>{offer.expiryDate}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{offer.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => handleOpenEdit(offer)}>
                        Edit
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="border border-[var(--border)]" onClick={() => openDeleteModal(offer)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOffer ? "Edit Coupon / Deal" : "Add Coupon / Deal"}</DialogTitle>
            <DialogDescription>Create or update coupon and deal records in the shared JSON catalog.</DialogDescription>
          </DialogHeader>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm text-[var(--muted)] md:col-span-2">
              Title
              <Input name="title" value={form.title} onChange={handleChange} placeholder="20% off premium supplements" />
            </label>
            <label className="grid gap-2 text-sm text-[var(--muted)] md:col-span-2">
              Description
              <textarea
                name="description"
                rows={4}
                value={form.description}
                onChange={handleChange}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--color-primary)]"
                placeholder="Short description for the offer."
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              Type
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm text-[var(--text)] outline-none focus:border-[var(--color-primary)]"
              >
                <option>Coupon</option>
                <option>Deal</option>
              </select>
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
              Affiliate Link
              <Input
                name="affiliateLink"
                value={form.affiliateLink}
                onChange={handleChange}
                placeholder="Auto-filled from selected store, or paste a custom tracking URL"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              Expiry Date
              <Input name="expiryDate" type="date" value={form.expiryDate} onChange={handleChange} />
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
                <option>Scheduled</option>
                <option>Ending soon</option>
                <option>Expired</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              Source
              <select
                name="source"
                value={form.source}
                onChange={handleChange}
                className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm text-[var(--text)] outline-none focus:border-[var(--color-primary)]"
              >
                <option>Manual</option>
                <option>Network</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm text-[var(--muted)] md:col-span-2">
              {form.type === "Deal" ? "Deal Code Optional" : "Coupon Code"}
              <Input name="code" value={form.code} onChange={handleChange} placeholder={form.type === "Deal" ? "Optional for direct deals" : "SAVE20"} />
            </label>
            {error ? <p className="text-sm text-[var(--muted)] md:col-span-2">{error}</p> : null}
            <div className="flex gap-3 md:col-span-2 md:justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingOffer ? "Update Coupon / Deal" : "Save Coupon / Deal"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <BulkCouponImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        stores={stores}
        offers={offers}
        onImported={loadData}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title={deleteTarget?.id === "__bulk__" ? "Delete selected offers" : "Delete offer"}
        description={
          deleteTarget?.id === "__bulk__"
            ? `Delete ${selectedOfferIds.length} selected offers from the catalog?`
            : deleteTarget
              ? `Delete "${deleteTarget.title}" from the catalog?`
              : ""
        }
        confirmLabel={deleteTarget?.id === "__bulk__" ? "Delete Selected" : "Delete Offer"}
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirmed}
        isSubmitting={isDeleting}
      />
    </>
  );
}
