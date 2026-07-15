"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/Button";

function getRelativeTime(dateString) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${diffDay}d ago`;
  } catch (e) {
    return "just now";
  }
}

export default function AdminNotificationsManager() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Ignored IP Addresses States
  const [ignoredIps, setIgnoredIps] = useState([]);
  const [clientIp, setClientIp] = useState("");
  const [newIp, setNewIp] = useState("");
  const [submittingIp, setSubmittingIp] = useState(false);
  
  // Filtering and Sorting States
  const [selectedDate, setSelectedDate] = useState(""); // YYYY-MM-DD
  const [sortOrder, setSortOrder] = useState("newest"); // newest | oldest
  const [searchQuery, setSearchQuery] = useState(""); // search by brand name

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { method: "POST" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    }
  }, []);

  const fetchIgnoredIps = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ignored-ips");
      if (res.ok) {
        const data = await res.json();
        setIgnoredIps(data.ignoredIps || []);
        setClientIp(data.clientIp || "");
      }
    } catch (err) {
      console.error("Failed to fetch ignored IPs:", err);
    }
  }, []);

  const handleAddIp = async (e) => {
    e.preventDefault();
    if (!newIp.trim()) return;

    setSubmittingIp(true);
    try {
      const res = await fetch("/api/admin/ignored-ips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", ip: newIp.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setIgnoredIps(data.ignoredIps || []);
        setNewIp("");
      }
    } catch (err) {
      console.error("Failed to add ignored IP:", err);
    } finally {
      setSubmittingIp(false);
    }
  };

  const handleRemoveIp = async (ipToRemove) => {
    try {
      const res = await fetch("/api/admin/ignored-ips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", ip: ipToRemove }),
      });
      if (res.ok) {
        const data = await res.json();
        setIgnoredIps(data.ignoredIps || []);
      }
    } catch (err) {
      console.error("Failed to remove ignored IP:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchIgnoredIps();

    // Mark as read after loading the page
    const timer = setTimeout(() => {
      markAllAsRead();
    }, 2000);

    // Poll every 10 seconds to keep fresh
    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchNotifications, fetchIgnoredIps, markAllAsRead]);

  // Filter & Sort Notifications
  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    // Filter by Date (YYYY-MM-DD)
    if (selectedDate) {
      result = result.filter((n) => {
        if (!n.createdAt) return false;
        return n.createdAt.startsWith(selectedDate);
      });
    }

    // Filter by Search Query (Brand Name)
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter((n) => {
        return (
          n.storeName?.toLowerCase().includes(query) ||
          n.offerTitle?.toLowerCase().includes(query) ||
          n.platform?.toLowerCase().includes(query)
        );
      });
    }

    // Sort by Date
    result.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [notifications, selectedDate, searchQuery, sortOrder]);

  // Group filtered notifications by type
  const socialClicks = useMemo(() => filteredNotifications.filter((n) => n.type === "social_click"), [filteredNotifications]);
  const affiliateClicks = useMemo(() => filteredNotifications.filter((n) => n.type === "affiliate_click"), [filteredNotifications]);
  const feedbacks = useMemo(() => filteredNotifications.filter((n) => n.type === "feedback"), [filteredNotifications]);

  // Stats calculation
  const stats = useMemo(() => {
    const positiveFeedback = feedbacks.filter((f) => f.feedback === "yes").length;
    const negativeFeedback = feedbacks.filter((f) => f.feedback === "no").length;

    return {
      socialTotal: socialClicks.length,
      affiliateTotal: affiliateClicks.length,
      feedbackTotal: feedbacks.length,
      positiveFeedback,
      negativeFeedback,
    };
  }, [socialClicks, affiliateClicks, feedbacks]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Controls & Filter Section */}
      <div className="flex flex-col lg:flex-row lg:items-stretch gap-4">
        
        {/* Title Block */}
        <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider">Store Performance Activity Tracker</h2>
            <p className="text-[11px] text-[var(--muted)] mt-0.5">Real-time tracking of social links, affiliate redirects, and coupon feedback votes.</p>
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl h-9 text-xs px-4 bg-[var(--surface)] hover:bg-[var(--surface-soft)] cursor-pointer"
              onClick={() => fetchNotifications(true)}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <button
              type="button"
              className="rounded-xl h-9 text-xs px-4 bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary)]/90 disabled:bg-[var(--surface-soft)] disabled:text-[var(--muted)] disabled:border disabled:border-[var(--border)] disabled:cursor-not-allowed cursor-pointer font-bold transition-all duration-200"
              onClick={markAllAsRead}
              disabled={notifications.every((n) => n.read)}
            >
              Mark All Read
            </button>
          </div>
        </div>

        {/* Search, Date Filter & Sort Block */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-4 flex-1">
          <div className="grid gap-1.5 w-full">
            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--muted)]">Search Brand</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search store/platform..."
                className="h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/20 px-3 text-xs text-[var(--text)] outline-none focus:border-[var(--color-primary)] placeholder-white/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="h-9 px-3 rounded-xl border border-[var(--border)] text-xs text-red-500 hover:bg-red-500/10 cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-1.5 w-full">
            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--muted)]">Filter by Date</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/20 px-3 text-xs text-[var(--text)] outline-none focus:border-[var(--color-primary)]"
              />
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate("")}
                  className="h-9 px-3 rounded-xl border border-[var(--border)] text-xs text-red-500 hover:bg-red-500/10 cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-1.5 w-full">
            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--muted)]">Sort Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/20 px-3 text-xs text-[var(--text)] outline-none focus:border-[var(--color-primary)]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-[var(--muted)]">Social Clicks</p>
          <p className="text-2xl font-black text-[#8b5cf6] mt-1">{stats.socialTotal}</p>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-[var(--muted)]">Affiliate Redirects</p>
          <p className="text-2xl font-black text-[#3b82f6] mt-1">{stats.affiliateTotal}</p>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-[var(--muted)]">Worked Votes</p>
          <p className="text-2xl font-black text-emerald-500 mt-1">{stats.positiveFeedback}</p>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-[var(--muted)]">Failed Votes</p>
          <p className="text-2xl font-black text-red-500 mt-1">{stats.negativeFeedback}</p>
        </div>
      </div>

      {/* Exclude IP Addresses Section */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-red-500/10 text-red-500 text-[10px]">IP</span>
              Exclude IP Addresses from Affiliate Redirects
            </h3>
            <p className="text-[11px] text-[var(--muted)] mt-0.5">Clicks originating from these IP addresses will not trigger "Affiliate Redirect" notifications.</p>
          </div>
          {/* Add IP Form */}
          <form onSubmit={handleAddIp} className="flex items-center gap-2 lg:max-w-md w-full">
            <input
              type="text"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              placeholder="e.g. 192.168.1.1"
              className="h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/20 px-3 text-xs text-[var(--text)] outline-none focus:border-[var(--color-primary)] placeholder-white/30 font-mono"
            />
            <button
              type="submit"
              className="rounded-xl h-9 text-xs px-4 bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary)]/90 disabled:bg-[var(--surface-soft)] disabled:text-[var(--muted)] cursor-pointer font-bold transition-all duration-200 whitespace-nowrap"
              disabled={submittingIp || !newIp.trim()}
            >
              Exclude IP
            </button>
          </form>
        </div>

        {/* Display Current Client IP Helper */}
        {clientIp && (
          <div className="mt-3 text-[10px] text-[var(--muted)]">
            Your current IP: <span 
              onClick={() => setNewIp(clientIp)}
              className="font-bold text-[var(--color-primary)] cursor-pointer hover:underline font-mono"
              title="Click to insert into input field"
            >
              {clientIp}
            </span> (Click to use)
          </div>
        )}

        {/* Ignored IPs List */}
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          {ignoredIps.length === 0 ? (
            <p className="text-[11px] text-[var(--muted)] italic">No IP addresses are currently ignored.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {ignoredIps.map((ip) => (
                <div key={ip} className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)]/30 px-3 py-1.5 text-xs text-[var(--text)]">
                  <span className="font-mono text-[11px]">{ip}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveIp(ip)}
                    className="text-red-500 hover:text-red-400 font-bold hover:bg-red-500/10 h-5 w-5 rounded-md flex items-center justify-center transition-colors duration-200 cursor-pointer"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3 Column Layout */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        
        {/* Column 1: Social Clicks */}
        <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm h-[65vh]">
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-[#8b5cf6]/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#8b5cf6]/10 text-[#8b5cf6]">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                </svg>
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-[var(--text)]">Social Profile Clicks</span>
            </div>
            <span className="rounded-full bg-[#8b5cf6]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#8b5cf6]">
              {socialClicks.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {socialClicks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-[var(--muted)] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider">No Clicks</p>
                <p className="text-[10px] mt-1">Social link redirects will appear here.</p>
              </div>
            ) : (
              socialClicks.map((n) => (
                <div
                  key={n.id}
                  className={`relative rounded-xl border p-3 transition-all duration-200 hover:scale-[1.01] ${
                    n.read 
                      ? "border-[var(--border)] bg-[var(--surface-soft)]/20" 
                      : "border-[#8b5cf6]/20 bg-[#8b5cf6]/[0.02]"
                  }`}
                >
                  {!n.read && <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-[#8b5cf6] animate-pulse" />}
                  <p className="text-xs font-bold text-[var(--text)] pr-4">
                    Visited <span className="text-[#8b5cf6]">{n.platform}</span>
                  </p>
                  <p className="text-[11px] text-[var(--muted)] mt-1">
                    Store: <span className="font-semibold text-[var(--text)]">{n.storeName}</span>
                  </p>
                  <p className="text-[9px] text-[var(--muted)] mt-2 font-medium">
                    {getRelativeTime(n.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Affiliate Redirects */}
        <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm h-[65vh]">
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-[#3b82f6]/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#3b82f6]/10 text-[#3b82f6]">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
                </svg>
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-[var(--text)]">Affiliate Redirects</span>
            </div>
            <span className="rounded-full bg-[#3b82f6]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#3b82f6]">
              {affiliateClicks.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {affiliateClicks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-[var(--muted)] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider">No Redirects</p>
                <p className="text-[10px] mt-1">Merchant coupon/deal clicks will appear here.</p>
              </div>
            ) : (
              affiliateClicks.map((n) => (
                <div
                  key={n.id}
                  className={`relative rounded-xl border p-3 transition-all duration-200 hover:scale-[1.01] ${
                    n.read 
                      ? "border-[var(--border)] bg-[var(--surface-soft)]/20" 
                      : "border-[#3b82f6]/20 bg-[#3b82f6]/[0.02]"
                  }`}
                >
                  {!n.read && <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-[#3b82f6] animate-pulse" />}
                  <p className="text-xs font-bold text-[var(--text)] pr-4">
                    Affiliate Redirect to Brand
                  </p>
                  <p className="text-[11px] text-[var(--muted)] mt-1">
                    Store: <span className="font-semibold text-[var(--text)]">{n.storeName}</span>
                  </p>
                  <p className="text-[10px] text-[var(--muted)] mt-1.5 line-clamp-2 leading-relaxed">
                    Offer: <span className="font-semibold text-[var(--text)]">{n.offerTitle}</span>
                  </p>
                  <p className="text-[9px] text-[var(--muted)] mt-2 font-medium">
                    {getRelativeTime(n.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Coupon Feedback */}
        <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm h-[65vh]">
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-[#10b981]/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#10b981]/10 text-[#10b981]">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-[var(--text)]">Coupon Feedback Votes</span>
            </div>
            <span className="rounded-full bg-[#10b981]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#10b981]">
              {feedbacks.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {feedbacks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-[var(--muted)] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider">No Feedback</p>
                <p className="text-[10px] mt-1">User vote logs will appear here.</p>
              </div>
            ) : (
              feedbacks.map((n) => (
                <div
                  key={n.id}
                  className={`relative rounded-xl border p-3 transition-all duration-200 hover:scale-[1.01] ${
                    n.read 
                      ? "border-[var(--border)] bg-[var(--surface-soft)]/20" 
                      : "border-[#10b981]/20 bg-[#10b981]/[0.02]"
                  }`}
                >
                  {!n.read && <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-[#10b981] animate-pulse" />}
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
                      n.feedback === "yes" 
                        ? "bg-emerald-500/10 text-emerald-500" 
                        : "bg-red-500/10 text-red-500"
                    }`}>
                      {n.feedback === "yes" ? "WORKED" : "FAILED"}
                    </span>
                    <span className="text-xs font-bold text-[var(--text)] truncate pr-4">{n.storeName}</span>
                  </div>
                  <p className="text-[10px] text-[var(--muted)] mt-1.5 line-clamp-2 leading-relaxed">
                    Offer: <span className="font-semibold text-[var(--text)]">{n.offerTitle}</span>
                  </p>
                  <p className="text-[9px] text-[var(--muted)] mt-2 font-medium">
                    {getRelativeTime(n.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--muted);
        }
      `}</style>
    </div>
  );
}
