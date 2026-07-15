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
import { cn } from "@/lib/utils";

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
  countryCode: z.string().trim().min(1, "Country target is required."),
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
  countryCode: "GLOBAL",
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
  const [countries, setCountries] = useState([]);
  const [selectedCountryFilter, setSelectedCountryFilter] = useState("all");
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
  const watchedCountryCode = watch("countryCode");

  const filteredEvents = useMemo(() => {
    if (selectedCountryFilter === "all") {
      return events;
    }
    return events.filter((e) => (e.countryCode || "GLOBAL") === selectedCountryFilter);
  }, [events, selectedCountryFilter]);

  async function loadEvents(showRefreshState = false) {
    if (showRefreshState) {
      setIsRefreshing(true);
    }

    try {
      const [eventsRes, countriesRes] = await Promise.all([
        fetch("/api/events", { cache: "no-store" }),
        fetch("/api/public/countries", { cache: "no-store" }),
      ]);
      const [eventsPayload, countriesPayload] = await Promise.all([
        eventsRes.json(),
        countriesRes.json(),
      ]);
      setEvents(eventsPayload.data || []);
      setCountries(countriesPayload.data || []);
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
      countryCode: eventItem.countryCode || "GLOBAL",
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
        <CardHeader className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-center sm:justify-between p-6">
          <div>
            <CardTitle className="text-base font-bold tracking-tight text-[var(--text)]">Events Management</CardTitle>
            <CardDescription className="text-xs text-[var(--muted)] mt-0.5">Manage seasonal or campaign landing pages that appear next to Exclusive in the public navbar.</CardDescription>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <select
              value={selectedCountryFilter}
              onChange={(event) => setSelectedCountryFilter(event.target.value)}
              className="h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-xs font-bold text-[var(--text)] outline-none cursor-pointer focus:border-[var(--color-primary)]"
            >
              <option value="all">All Countries</option>
              <option value="GLOBAL">Global Only</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 w-10 rounded-xl border border-[var(--border)] px-0 text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
              onClick={() => loadEvents(true)}
              aria-label="Refresh events"
              disabled={isRefreshing}
            >
              <RefreshIcon />
            </Button>
            <Button
              type="button"
              className="rounded-xl font-bold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-sm transition-all duration-200 px-5 h-10 text-xs cursor-pointer"
              onClick={openCreateModal}
            >
              Add Event
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {filteredEvents.length ? (
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
              <Table>
                <TableHeader className="bg-[var(--surface-soft)]/50">
                  <TableRow className="border-b border-[var(--border)] hover:bg-transparent">
                    <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-3">Event Name</TableHead>
                    <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-3">Slug</TableHead>
                    <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-3">Country</TableHead>
                    <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-3">Keyword</TableHead>
                    <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-3">Status</TableHead>
                    <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-3">Edit/Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((eventItem) => (
                    <TableRow key={eventItem.slug} className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--surface-soft)]/30 transition-colors duration-150">
                      {/* Event Name */}
                      <TableCell className="px-3 py-3">
                        <span className="text-xs font-bold text-[var(--color-primary)]">{eventItem.name}</span>
                      </TableCell>
                      {/* Slug */}
                      <TableCell className="px-3 py-3">
                        <span className="font-mono text-[11px] text-[var(--color-primary)]/70">/events/{eventItem.slug}</span>
                      </TableCell>
                      {/* Country badge */}
                      <TableCell className="px-3 py-3">
                        <span className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide",
                          (eventItem.countryCode || "GLOBAL") === "GLOBAL"
                            ? "border-purple-500/20 bg-purple-500/10 text-purple-400"
                            : "border-blue-500/20 bg-blue-500/10 text-blue-400"
                        )}>
                          {(eventItem.countryCode || "GLOBAL") === "GLOBAL" ? "Global" : eventItem.countryCode}
                        </span>
                      </TableCell>
                      {/* Keyword */}
                      <TableCell className="px-3 py-3">
                        <span className="font-mono text-xs text-[var(--muted)]">{eventItem.keyword}</span>
                      </TableCell>
                      {/* Status badge */}
                      <TableCell className="px-3 py-3">
                        <span className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide",
                          eventItem.status === "enabled"
                            ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                            : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)]"
                        )}>
                          {eventItem.status?.toUpperCase()}
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
                            onClick={() => openEditModal(eventItem)}
                            aria-label={`Edit ${eventItem.name}`}
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
                            onClick={() => setDeleteTarget(eventItem)}
                            aria-label={`Delete ${eventItem.name}`}
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
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-6 py-10 text-center">
              <h3 className="text-sm font-bold text-[var(--text)]">No events yet</h3>
              <p className="mt-2 text-xs text-[var(--muted)]">Create one to power dynamic campaign landing pages like Christmas, Eid, or Easter Sale.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          titleId={titleId}
          descriptionId={descriptionId}
          className="max-h-[calc(100vh-2rem)] max-w-5xl overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-0 shadow-2xl sm:max-h-[calc(100vh-3rem)]"
        >
          <div className="grid gap-0 lg:grid-cols-[380px_1fr] h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] max-h-[820px] overflow-hidden">
            {/* Left Column - Preview & Checklist */}
            <div className="border-b border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-soft),var(--surface))] p-6 lg:border-r lg:border-b-0 lg:p-8 flex flex-col justify-between overflow-y-auto">
              <div>
                <DialogHeader className="mb-6">
                  <Badge className="w-fit border border-[var(--color-primary)]/20 bg-[var(--surface)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--color-primary)]">
                    Event editor
                  </Badge>
                  <DialogTitle id={titleId} className="text-lg font-bold tracking-tight text-[var(--text)] mt-3">
                    {editingEvent ? "Update Event" : "Add New Event"}
                  </DialogTitle>
                  <DialogDescription id={descriptionId} className="text-xs text-[var(--muted)] mt-1">
                    Create campaign pages that follow the Exclusive page structure while using event-specific naming and keyword matching.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">Preview</p>
                    <p className="mt-4 text-base font-bold text-[var(--text)]">{watchedName || "Event name preview"}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">/events/{watchedSlug || "event-slug"}</p>
                    <p className="mt-4 text-xs text-[var(--muted)]">
                      Keyword: <span className="text-[var(--text)]">{watchedKeyword || "event keyword"}</span>
                    </p>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      Status: <span className="capitalize text-[var(--text)]">{watchedStatus}</span>
                    </p>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      Country Target: <span className="text-[var(--text)]">{(watchedCountryCode || "GLOBAL") === "GLOBAL" ? "Global" : watchedCountryCode}</span>
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                    <p className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">How it works</p>
                    <p className="mt-2.5 text-xs text-[var(--muted)] leading-relaxed">
                      The public page title comes from the event name, while the event keyword is used to find matching active offers.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Scrollable Form */}
            <form
              className="flex flex-col justify-between h-full bg-[var(--surface)] overflow-hidden"
              onSubmit={handleSubmit(submitEvent)}
            >
              {/* Scrollable Form Content */}
              <div className="flex-1 p-6 lg:p-8 space-y-5 overflow-y-auto">
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="grid gap-2 text-xs text-[var(--muted)]">
                    <span className="font-bold uppercase tracking-wider text-[var(--text)]">Event Name</span>
                    <Input placeholder="Christmas" className="rounded-xl bg-[var(--surface-soft)] h-11 px-4 text-sm" {...register("name")} />
                    {errors.name ? <span className="text-xs text-red-500">{errors.name.message}</span> : null}
                  </label>

                  <label className="grid gap-2 text-xs text-[var(--muted)]">
                    <span className="font-bold uppercase tracking-wider text-[var(--text)]">Slug</span>
                    <Input
                      placeholder="christmas"
                      className="rounded-xl bg-[var(--surface-soft)] h-11 px-4 text-sm"
                      {...register("slug", {
                        onChange: () => {
                          slugEditedRef.current = true;
                        },
                      })}
                    />
                    {errors.slug ? <span className="text-xs text-red-500">{errors.slug.message}</span> : null}
                  </label>
                </div>

                <label className="grid gap-2 text-xs text-[var(--muted)]">
                  <span className="font-bold uppercase tracking-wider text-[var(--text)]">Event Keyword</span>
                  <Input placeholder="christmas" className="rounded-xl bg-[var(--surface-soft)] h-11 px-4 text-sm" {...register("keyword")} />
                  <span className="text-[10px] text-[var(--muted)] leading-tight">Used to find matching active offers on the event page.</span>
                  {errors.keyword ? <span className="text-xs text-red-500">{errors.keyword.message}</span> : null}
                </label>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="grid gap-2 text-xs text-[var(--muted)]">
                    <span className="font-bold uppercase tracking-wider text-[var(--text)]">Status</span>
                    <select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm text-[var(--text)] outline-none w-full" {...register("status")}>
                      <option value="enabled">Enabled</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </label>

                  <label className="grid gap-2 text-xs text-[var(--muted)]">
                    <span className="font-bold uppercase tracking-wider text-[var(--text)]">Country Target</span>
                    <select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm text-[var(--text)] outline-none w-full" {...register("countryCode")}>
                      <option value="GLOBAL">Global (All Countries)</option>
                      {countries.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                    {errors.countryCode ? <span className="text-xs text-red-500">{errors.countryCode.message}</span> : null}
                  </label>
                </div>


                <label className="grid gap-2 text-xs text-[var(--muted)]">
                  <span className="font-bold uppercase tracking-wider text-[var(--text)]">SEO Title</span>
                  <Input placeholder="Best Christmas Discount Deals & Coupon Codes 2026" className="rounded-xl bg-[var(--surface-soft)] h-11 px-4 text-sm" {...register("seoTitle")} />
                </label>

                <label className="grid gap-2 text-xs text-[var(--muted)]">
                  <span className="font-bold uppercase tracking-wider text-[var(--text)]">SEO Description</span>
                  <textarea rows={3} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none" {...register("seoDescription")} />
                </label>

                <label className="grid gap-2 text-xs text-[var(--muted)]">
                  <span className="font-bold uppercase tracking-wider text-[var(--text)]">Short Description</span>
                  <textarea rows={3} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none" {...register("shortDescription")} />
                </label>

                <label className="grid gap-2 text-xs text-[var(--muted)]">
                  <span className="font-bold uppercase tracking-wider text-[var(--text)]">Long Description</span>
                  <textarea rows={4} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none" {...register("longDescription")} />
                </label>
              </div>

              {/* Sticky Footer */}
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
                  {isSubmitting ? "Saving..." : editingEvent ? "Update Event" : "Save Event"}
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
