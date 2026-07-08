"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

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

export default function AdminSubscribersManager() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/subscribers");
      const json = await res.json();
      if (res.ok && json.data) {
        // Sort newest first
        const sorted = [...json.data].sort((a, b) => new Date(b.subscribedAt) - new Date(a.subscribedAt));
        setSubscribers(sorted);
      }
    } catch (err) {
      console.error("Failed to load subscribers", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/admin/subscribers?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSubscribers(subscribers.filter((s) => s.id !== id));
        setDeletingId(null);
      }
    } catch (err) {
      console.error("Failed to delete subscriber", err);
    }
  };

  const exportCSV = () => {
    if (!subscribers.length) return;
    const headers = ["ID", "Email", "Subscription Date"];
    const rows = subscribers.map((sub) => [
      sub.id,
      sub.email,
      new Date(sub.subscribedAt).toLocaleString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map(val => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "couponchy_newsletter_subscribers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = subscribers.filter((sub) =>
    sub.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-md">
        <div>
          <h2 className="text-xl font-black text-[var(--text)]">Newsletter Subscribers</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Manage your permanent database of subscribed newsletter emails ({filtered.length} shown).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSubscribers}
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

      {/* Search Panel */}
      <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <div className="relative w-full max-w-md">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 stroke-current" fill="none" strokeWidth="2.5">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search subscriber emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] pl-11 pr-4 text-xs font-medium text-[var(--text)] outline-none focus:border-[var(--color-primary)]/40 transition-all placeholder:text-[var(--muted)]"
          />
        </div>
      </div>

      {/* Main Grid/Table */}
      <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-soft)]/40 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--muted)]">
                <th className="py-4 px-6">Email Address</th>
                <th className="py-4 px-6">Date Subscribed</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs text-[var(--text)]">
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-[var(--muted)] font-bold italic">
                    Loading subscribers list...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-[var(--muted)] font-bold italic">
                    {searchQuery ? "No subscribers match your search filter." : "No newsletter subscribers found."}
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[var(--surface-soft)]/20 transition-colors duration-150">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3.5">
                        {/* Glowing envelope icon box */}
                        <div className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl border border-[var(--color-primary)]/10 bg-[var(--color-primary)]/5 text-[var(--color-primary)] shadow-sm">
                          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 stroke-current" fill="none" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-[var(--text)] truncate leading-normal">{sub.email}</p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                            <span className="text-[10px] font-semibold text-[var(--muted)]/60">Subscribed</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2.5">
                        {/* Calendar stamp icon */}
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--muted)]/50 stroke-current shrink-0" fill="none" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-[var(--text)]">
                            {new Date(sub.subscribedAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-[9.5px] font-bold text-[var(--muted)]/65 mt-0.5 uppercase tracking-wider">
                            {getRelativeTime(sub.subscribedAt)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {deletingId === sub.id ? (
                        <div className="inline-flex items-center gap-2 justify-end">
                          <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">Confirm Delete?</span>
                          <button
                            onClick={() => handleDelete(sub.id)}
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
                        <button
                          onClick={() => setDeletingId(sub.id)}
                          className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all duration-200 active:scale-95 shadow-sm cursor-pointer"
                          title="Remove subscriber"
                        >
                          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 stroke-current" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
