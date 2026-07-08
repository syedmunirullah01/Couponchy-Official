"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, useDialogA11yIds } from "@/components/ui/Dialog";

function getRelativeTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AdminContactsManager() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("all");
  const [deletingId, setDeletingId] = useState(null);
  const [activeMessage, setActiveMessage] = useState(null);
  const { titleId, descriptionId } = useDialogA11yIds();

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/contacts");
      const json = await res.json();
      if (res.ok && json.data) {
        // Sort newest first
        const sorted = [...json.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setContacts(sorted);
      }
    } catch (err) {
      console.error("Failed to load contact submissions", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/admin/contacts?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setContacts(contacts.filter((c) => c.id !== id));
        setDeletingId(null);
        if (activeMessage?.id === id) {
          setActiveMessage(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete contact submission", err);
    }
  };

  const exportCSV = () => {
    if (!contacts.length) return;
    const headers = ["ID", "Name", "Email", "Subject", "Message", "Submission Date"];
    const rows = contacts.map((c) => [
      c.id,
      c.name,
      c.email,
      c.subject,
      c.message.replace(/\n/g, " "),
      new Date(c.createdAt).toLocaleString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map(val => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "couponchy_contact_submissions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.message.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSubject =
        selectedSubjectFilter === "all" ||
        c.subject.toLowerCase() === selectedSubjectFilter.toLowerCase();

      return matchesSearch && matchesSubject;
    });
  }, [contacts, searchQuery, selectedSubjectFilter]);

  const getSubjectBadge = (subject) => {
    const s = String(subject || "").toLowerCase();
    if (s === "support") {
      return (
        <span className="inline-flex items-center rounded-lg bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-400 border border-blue-500/20">
          Support
        </span>
      );
    }
    if (s === "coupon") {
      return (
        <span className="inline-flex items-center rounded-lg bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
          Coupon Submit
        </span>
      );
    }
    if (s === "partnership") {
      return (
        <span className="inline-flex items-center rounded-lg bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-400 border border-violet-500/20">
          Partnership
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-lg bg-zinc-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] border border-[var(--border)]">
        {subject || "Other"}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-md">
        <div>
          <h2 className="text-xl font-black text-[var(--text)]">Contact Messages</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Manage your permanent database of user queries, suggestions, and submissions ({filtered.length} shown).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchContacts}
            className="h-10 px-5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-xs font-bold text-[var(--text)] hover:bg-[var(--surface)] transition duration-200 active:scale-95 disabled:opacity-40"
            disabled={loading}
          >
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="h-10 px-5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-sm active:scale-95 disabled:bg-[var(--surface-soft)] disabled:text-[var(--muted)]/50 disabled:border disabled:border-[var(--border)] disabled:pointer-events-none disabled:opacity-60"
            disabled={!filtered.length}
          >
            Export to CSV
          </button>
        </div>
      </div>

      {/* Search & Subject Filter Panel */}
      <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 stroke-current" fill="none" strokeWidth="2.5">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search name, email, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] pl-11 pr-4 text-xs font-medium text-[var(--text)] outline-none focus:border-[var(--color-primary)]/40 transition-all placeholder:text-[var(--muted)]"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--muted)] mr-2">Subjects:</span>
          {[
            { id: "all", label: "All Subjects" },
            { id: "support", label: "Support" },
            { id: "coupon", label: "Coupon Submit" },
            { id: "partnership", label: "Partnership" },
            { id: "other", label: "Other" },
          ].map((chip) => {
            const isSelected = selectedSubjectFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setSelectedSubjectFilter(chip.id)}
                className={`h-7 px-3.5 rounded-lg text-[10px] font-bold transition-all duration-200 active:scale-95 cursor-pointer border ${
                  isSelected
                    ? "bg-[var(--color-primary)]/15 border-[var(--color-primary)]/30 text-[var(--color-primary)] font-black"
                    : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid/Table */}
      <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-soft)]/40 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--muted)]">
                <th className="py-4 px-6">Sender Details</th>
                <th className="py-4 px-6">Subject & Date</th>
                <th className="py-4 px-6">Message Preview</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs text-[var(--text)]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[var(--muted)] font-bold italic">
                    Loading submissions list...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[var(--muted)] font-bold italic">
                    {searchQuery || selectedSubjectFilter !== "all"
                      ? "No submissions match your filter settings."
                      : "No contact submissions found."}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const initials = c.name
                    ? c.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "U";

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-[var(--surface-soft)]/20 transition-colors duration-150 cursor-pointer"
                      onClick={() => setActiveMessage(c)}
                    >
                      {/* Sender details */}
                      <td className="py-4.5 px-6">
                        <div className="flex items-center gap-3.5">
                          {/* Circle Avatar */}
                          <div className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-full border border-[var(--color-primary)]/10 bg-[var(--color-primary)]/5 text-[var(--color-primary)] font-black text-xs shadow-sm">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-[var(--text)] truncate leading-normal">{c.name}</p>
                            <p className="text-[10px] font-semibold text-[var(--muted)]/70 truncate mt-0.5">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      {/* Subject & Date */}
                      <td className="py-4.5 px-6">
                        <div className="space-y-1.5">
                          {getSubjectBadge(c.subject)}
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--muted)]/75">
                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 stroke-current" fill="none" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span>{getRelativeTime(c.createdAt)}</span>
                          </div>
                        </div>
                      </td>
                      {/* Message Preview */}
                      <td className="py-4.5 px-6 max-w-[280px]">
                        <p className="font-semibold text-xs text-[var(--text)] leading-relaxed truncate block max-w-[260px]">
                          {c.message}
                        </p>
                      </td>
                      {/* Action buttons */}
                      <td className="py-4.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        {deletingId === c.id ? (
                          <div className="inline-flex items-center gap-2 justify-end">
                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">Delete?</span>
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="rounded-lg bg-rose-500 px-3 py-1.5 text-[10px] font-black uppercase text-white hover:bg-rose-600 active:scale-95 shadow-sm transition-all"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-[10px] font-bold text-[var(--text)] hover:bg-[var(--surface)] active:scale-95 transition-all"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2.5">
                            <button
                              onClick={() => setActiveMessage(c)}
                              className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-all duration-200 active:scale-95 shadow-sm cursor-pointer"
                              title="Read full message"
                            >
                              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 stroke-current" fill="none" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeletingId(c.id)}
                              className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all duration-200 active:scale-95 shadow-sm cursor-pointer"
                              title="Delete submission"
                            >
                              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 stroke-current" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Reader Dialog */}
      <Dialog open={Boolean(activeMessage)} onOpenChange={(next) => { if (!next) setActiveMessage(null); }}>
        <DialogContent
          titleId={titleId}
          descriptionId={descriptionId}
          className="max-w-2xl rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl overflow-y-auto"
        >
          {activeMessage && (
            <div className="space-y-6">
              <DialogHeader className="border-b border-[var(--border)] pb-4.5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Message Details</span>
                  {getSubjectBadge(activeMessage.subject)}
                </div>
                <DialogTitle id={titleId} className="text-xl font-black text-[var(--text)] mt-3">
                  Inquiry from {activeMessage.name}
                </DialogTitle>
                <DialogDescription id={descriptionId} className="text-xs text-[var(--muted)] mt-1.5 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 stroke-current" fill="none" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>
                    Received on {new Date(activeMessage.createdAt).toLocaleString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </DialogDescription>
              </DialogHeader>

              {/* Sender Info Card */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/50 p-4.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--muted)] uppercase tracking-wider">Sender Name:</span>
                  <span className="font-black text-[var(--text)]">{activeMessage.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-[var(--border)]/50 pt-2">
                  <span className="font-bold text-[var(--muted)] uppercase tracking-wider">Sender Email:</span>
                  <a
                    href={`mailto:${activeMessage.email}`}
                    className="font-black text-[var(--color-primary)] hover:underline"
                  >
                    {activeMessage.email}
                  </a>
                </div>
              </div>

              {/* Message Box */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Message Body</span>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm min-h-[140px] select-text">
                  <p className="text-sm font-semibold text-[var(--text)] leading-relaxed whitespace-pre-wrap">
                    {activeMessage.message}
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3.5 border-t border-[var(--border)] pt-4.5">
                <button
                  onClick={() => setActiveMessage(null)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-5 h-10 text-xs font-bold text-[var(--text)] hover:bg-[var(--surface)] active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Close Reader
                </button>
                <a
                  href={`mailto:${activeMessage.email}?subject=Re: ${activeMessage.subject || "Your message to Couponchy"}`}
                  className="inline-flex items-center gap-2 rounded-xl font-bold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-sm transition-all duration-200 px-5 h-10 text-xs cursor-pointer active:scale-95"
                >
                  Reply via Email
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
