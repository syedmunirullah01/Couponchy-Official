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
import { cn } from "@/lib/utils";

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
  position: 0,
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
      position: offer.position || 0,
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
        <CardHeader className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 lg:flex-row lg:items-center lg:justify-between p-6">
          <div>
            <CardTitle className="text-base font-bold tracking-tight text-[var(--text)]">Coupons & Deals</CardTitle>
            <CardDescription className="text-xs text-[var(--muted)] mt-0.5">Manage coupon codes and direct deals from one place.</CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button 
              type="button" 
              variant="outline" 
              className={cn(
                "h-10 rounded-xl font-bold transition-all duration-200 px-4 flex items-center gap-1.5 text-xs",
                selectedOfferIds.length 
                  ? "border border-red-500/25 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-600 cursor-pointer"
                  : "border border-[var(--border)] bg-[var(--surface-soft)]/20 text-[var(--muted)]/40 cursor-not-allowed opacity-50"
              )}
              disabled={!selectedOfferIds.length}
              onClick={() => setDeleteTarget({ id: "__bulk__", title: `${selectedOfferIds.length} selected offers` })}
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 stroke-current" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              Delete Selected {selectedOfferIds.length ? `(${selectedOfferIds.length})` : ""}
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-10 w-10 rounded-xl border border-[var(--border)] px-0 bg-[var(--surface)] hover:bg-[var(--surface-soft)] transition" onClick={loadData} aria-label="Refresh offers">
              <RefreshIcon />
            </Button>
            <Button type="button" variant="outline" className="rounded-xl font-bold bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface)] transition px-4 py-2 text-xs cursor-pointer h-10" onClick={() => setBulkImportOpen(true)}>
              Import CSV
            </Button>
            <Button type="button" className="rounded-xl font-bold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-sm transition-all duration-200 px-4 py-2 cursor-pointer text-xs h-10" onClick={handleOpenCreate}>
              Add Coupon / Deal
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <Table>
              <TableHeader className="bg-[var(--surface-soft)]/50">
                <TableRow className="border-b border-[var(--border)] hover:bg-transparent">
                  <TableHead className="w-14 h-10 px-4 text-center">
                    <label className="flex items-center justify-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 appearance-none rounded-full border-2 border-[var(--muted)]/60 bg-[var(--surface-soft)] checked:bg-[var(--color-primary)] checked:border-[var(--color-primary)] focus:outline-none transition-all cursor-pointer relative after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-transparent checked:after:bg-white"
                        checked={offers.length > 0 && selectedOfferIds.length === offers.length}
                        onChange={toggleSelectAll}
                        aria-label="Select all offers"
                      />
                    </label>
                  </TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-4">Title</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-4">Type</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-4">Store</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-4">Source</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-4">Expiry Date</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-4">Status</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-4">Edit/Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id} className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--surface-soft)]/30 transition-colors duration-150">
                    <TableCell className="w-14 h-10 px-4 text-center">
                      <label className="flex items-center justify-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4 appearance-none rounded-full border-2 border-[var(--muted)]/60 bg-[var(--surface-soft)] checked:bg-[var(--color-primary)] checked:border-[var(--color-primary)] focus:outline-none transition-all cursor-pointer relative after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-transparent checked:after:bg-white"
                          checked={selectedOfferIds.includes(offer.id)}
                          onChange={() => toggleOfferSelection(offer.id)}
                          aria-label={`Select ${offer.title}`}
                        />
                      </label>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs font-semibold text-[var(--text)]">{offer.title}</TableCell>
                    <TableCell className="px-4 py-3 text-xs font-semibold text-[var(--muted)]">{offer.type}</TableCell>
                    <TableCell className="px-4 py-3 text-xs font-semibold text-[var(--text)]">{offer.storeName}</TableCell>
                    <TableCell className="px-4 py-3 text-xs text-[var(--muted)]">{offer.source}</TableCell>
                    <TableCell className="px-4 py-3 text-xs font-mono text-[var(--muted)]">{offer.expiryDate}</TableCell>
                    <TableCell className="px-4 py-3 text-xs">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                        offer.status === "Active"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : offer.status === "Scheduled"
                          ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          : "bg-red-500/10 text-red-600 border-red-500/20"
                      )}>
                        {offer.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 rounded-lg border border-[var(--border)] p-0 text-[var(--muted)] hover:text-[var(--color-primary)] hover:bg-[var(--surface-soft)] cursor-pointer"
                          onClick={() => handleOpenEdit(offer)}
                          aria-label={`Edit ${offer.title}`}
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
                          onClick={() => openDeleteModal(offer)}
                          aria-label={`Delete ${offer.title}`}
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
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              Position / Sort Order
              <Input
                name="position"
                type="number"
                value={form.position}
                onChange={handleChange}
                placeholder="0 (Lower shows first)"
              />
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
