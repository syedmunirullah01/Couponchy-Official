"use client";

import { useEffect, useRef, useState } from "react";
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

const eventSchema = z.object({
  name: z.string().trim().min(1, "Event name is required."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase and URL-friendly."),
  keyword: z.string().trim().min(1, "Keyword is required."),
  seoTitle: z.string().trim().optional().or(z.literal("")),
  seoDescription: z.string().trim().optional().or(z.literal("")),
  shortDescription: z.string().trim().optional().or(z.literal("")),
  longDescription: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["enabled", "disabled"]),
});

const defaultValues = {
  name: "",
  slug: "",
  keyword: "",
  seoTitle: "",
  seoDescription: "",
  shortDescription: "",
  longDescription: "",
  status: "enabled",
};

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

export default function AdminEventsManager() {
  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
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
    resolver: zodResolver(eventSchema),
    defaultValues,
  });

  const watchedName = watch("name");
  const watchedSlug = watch("slug");
  const watchedKeyword = watch("keyword");
  const watchedStatus = watch("status");

  async function loadEvents(showRefreshState = false) {
    if (showRefreshState) {
      setIsRefreshing(true);
    }

    try {
      const response = await fetch("/api/events", { cache: "no-store" });
      const payload = await response.json();
      setEvents(payload.data || []);
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (!slugEditedRef.current) {
      setValue("slug", slugify(watchedName || ""), { shouldValidate: true });
    }
  }, [watchedName, setValue]);

  function openCreateModal() {
    slugEditedRef.current = false;
    setEditingEvent(null);
    reset(defaultValues);
    setOpen(true);
  }

  function openEditModal(eventItem) {
    slugEditedRef.current = true;
    setEditingEvent(eventItem);
    reset({
      name: eventItem.name,
      slug: eventItem.slug,
      keyword: eventItem.keyword,
      seoTitle: eventItem.seoTitle || "",
      seoDescription: eventItem.seoDescription || "",
      shortDescription: eventItem.shortDescription || "",
      longDescription: eventItem.longDescription || "",
      status: eventItem.status || "enabled",
    });
    setOpen(true);
  }

  async function submitEvent(values) {
    const endpoint = editingEvent ? `/api/events/${editingEvent.slug}` : "/api/events";
    const method = editingEvent ? "PUT" : "POST";
    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await response.json();

    if (!response.ok) {
      toast.error(payload.error || "Unable to save event.");
      return;
    }

    await loadEvents();
    setOpen(false);
    setEditingEvent(null);
    reset(defaultValues);
    toast.success(editingEvent ? "Event updated." : "Event created.");
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/events/${deleteTarget.slug}`, { method: "DELETE" });
      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.error || "Unable to delete event.");
        return;
      }

      await loadEvents();
      setDeleteTarget(null);
      toast.success("Event deleted.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Events Management</CardTitle>
            <CardDescription>Manage seasonal or campaign landing pages that appear next to Exclusive in the public navbar.</CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 w-10 rounded-lg border border-[var(--border)] px-0"
              onClick={() => loadEvents(true)}
              aria-label="Refresh events"
              disabled={isRefreshing}
            >
              <RefreshIcon />
            </Button>
            <Button type="button" onClick={openCreateModal}>
              Add Event
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Keyword</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Edit/Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((eventItem) => (
                <TableRow key={eventItem.slug}>
                  <TableCell className="font-medium text-[var(--text)]">{eventItem.name}</TableCell>
                  <TableCell className="text-[var(--muted)]">/events/{eventItem.slug}</TableCell>
                  <TableCell>{eventItem.keyword}</TableCell>
                  <TableCell>
                    <Badge variant={eventItem.status === "enabled" ? "success" : "outline"}>{eventItem.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(eventItem)}>
                        Edit
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="border border-[var(--border)]" onClick={() => setDeleteTarget(eventItem)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!events.length ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-5 py-6 text-sm text-[var(--muted)]">
              No events added yet. Create one to power dynamic campaign landing pages like Christmas, Eid, or Easter Sale.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          titleId={titleId}
          descriptionId={descriptionId}
          className="max-w-5xl rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-0"
        >
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-soft),var(--surface))] p-6 lg:border-r lg:border-b-0 lg:p-8">
              <DialogHeader className="mb-6">
                <Badge className="w-fit border border-[var(--color-primary)]/20 bg-[var(--surface)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--color-primary)]">
                  Event editor
                </Badge>
                <DialogTitle id={titleId}>{editingEvent ? "Update Event" : "Add New Event"}</DialogTitle>
                <DialogDescription id={descriptionId}>
                  Create campaign pages that follow the Exclusive page structure while using event-specific naming and keyword matching.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">Preview</p>
                  <p className="mt-4 text-lg font-semibold text-[var(--text)]">{watchedName || "Event name preview"}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">/events/{watchedSlug || "event-slug"}</p>
                  <p className="mt-4 text-sm text-[var(--muted)]">
                    Keyword: <span className="text-[var(--text)]">{watchedKeyword || "event keyword"}</span>
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Status: <span className="capitalize text-[var(--text)]">{watchedStatus}</span>
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                  <p className="text-sm font-semibold text-[var(--text)]">How it works</p>
                  <p className="mt-3 text-sm text-[var(--muted)]">
                    The public page title comes from the event name, while the event keyword is used to find matching active offers.
                  </p>
                </div>
              </div>
            </div>

            <form className="grid gap-5 bg-[var(--surface)] p-6 lg:p-8" onSubmit={handleSubmit(submitEvent)}>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-[var(--muted)]">
                  <span className="font-medium text-[var(--text)]">Event Name</span>
                  <Input placeholder="Christmas" className="rounded-lg bg-[var(--surface)]" {...register("name")} />
                  {errors.name ? <span className="text-sm text-[var(--color-primary)]">{errors.name.message}</span> : null}
                </label>

                <label className="grid gap-2 text-sm text-[var(--muted)]">
                  <span className="font-medium text-[var(--text)]">Slug</span>
                  <Input
                    placeholder="christmas"
                    className="rounded-lg bg-[var(--surface)]"
                    {...register("slug", {
                      onChange: () => {
                        slugEditedRef.current = true;
                      },
                    })}
                  />
                  {errors.slug ? <span className="text-sm text-[var(--color-primary)]">{errors.slug.message}</span> : null}
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-[var(--muted)]">
                  <span className="font-medium text-[var(--text)]">Event Keyword</span>
                  <Input placeholder="christmas" className="rounded-lg bg-[var(--surface)]" {...register("keyword")} />
                  <span className="text-xs text-[var(--muted)]">Used to find matching active offers on the event page.</span>
                  {errors.keyword ? <span className="text-sm text-[var(--color-primary)]">{errors.keyword.message}</span> : null}
                </label>

                <label className="grid gap-2 text-sm text-[var(--muted)]">
                  <span className="font-medium text-[var(--text)]">Status</span>
                  <select className="h-11 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text)] outline-none" {...register("status")}>
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </label>
              </div>

              <label className="grid gap-2 text-sm text-[var(--muted)]">
                <span className="font-medium text-[var(--text)]">SEO Title</span>
                <Input placeholder="Best Christmas Discount Deals & Coupon Codes 2026" className="rounded-lg bg-[var(--surface)]" {...register("seoTitle")} />
              </label>

              <label className="grid gap-2 text-sm text-[var(--muted)]">
                <span className="font-medium text-[var(--text)]">SEO Description</span>
                <textarea rows={3} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none" {...register("seoDescription")} />
              </label>

              <label className="grid gap-2 text-sm text-[var(--muted)]">
                <span className="font-medium text-[var(--text)]">Short Description</span>
                <textarea rows={4} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none" {...register("shortDescription")} />
              </label>

              <label className="grid gap-2 text-sm text-[var(--muted)]">
                <span className="font-medium text-[var(--text)]">Long Description</span>
                <textarea rows={5} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none" {...register("longDescription")} />
              </label>

              <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" className="rounded-lg" onClick={() => setOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" className="rounded-lg" disabled={isSubmitting} leadingIcon={isSubmitting ? <Spinner /> : null}>
                  {isSubmitting ? (editingEvent ? "Updating Event..." : "Saving Event...") : editingEvent ? "Update Event" : "Save Event"}
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
        title="Delete event"
        description={deleteTarget ? `Delete ${deleteTarget.name}? This will remove the public event page link as well.` : ""}
        confirmLabel="Delete Event"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirmed}
        isSubmitting={isDeleting}
      />
    </>
  );
}
