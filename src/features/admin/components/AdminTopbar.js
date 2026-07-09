"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 animate-spin-once text-[var(--color-primary)]" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function NotificationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--muted)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--muted)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    setSearchValue(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchValue(val);
    const params = new URLSearchParams(searchParams);
    if (val) {
      params.set("search", val);
    } else {
      params.delete("search");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="relative min-w-[240px] flex-1 sm:flex-none">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">
        <SearchIcon />
      </span>
      <Input
        value={searchValue}
        onChange={handleSearchChange}
        className="pl-11 h-10 text-xs rounded-xl bg-[var(--surface-soft)] border-[var(--border)] focus:bg-[var(--surface)]"
        placeholder="Search components, stores, deals..."
      />
    </div>
  );
}

export default function AdminTopbar({ title, breadcrumbTrail = [] }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data || []);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("admin-theme") || "dark";
    setTheme(savedTheme);
    setMounted(true);
    
    fetchNotifications();
    // Poll every 10 seconds for real-time coupon feedback notifications
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleToggleNotifications = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      try {
        await fetch("/api/notifications", { method: "POST" });
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      } catch (err) {
        console.error("Failed to mark notifications as read:", err);
      }
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    const adminRoot = document.querySelector(".admin-root");
    
    if (adminRoot) {
      adminRoot.classList.add("theme-transition");
      if (nextTheme === "light") {
        adminRoot.classList.add("light");
      } else {
        adminRoot.classList.remove("light");
      }
      setTimeout(() => {
        adminRoot.classList.remove("theme-transition");
      }, 300);
    }
    
    setTheme(nextTheme);
    localStorage.setItem("admin-theme", nextTheme);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/80 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            {breadcrumbTrail.map((item, index) => (
              <div key={item} className="flex items-center gap-2">
                {index > 0 ? <ChevronRightIcon /> : null}
                <span>{item}</span>
              </div>
            ))}
          </div>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-[var(--text)]">{title}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap">
          <Suspense fallback={
            <div className="relative min-w-[240px] flex-1 sm:flex-none">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                <SearchIcon />
              </span>
              <Input className="pl-11 h-10 text-xs rounded-xl bg-[var(--surface-soft)] border-[var(--border)] focus:bg-[var(--surface)]" placeholder="Search components, stores, deals..." disabled />
            </div>
          }>
            <SearchBar />
          </Suspense>

          <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
            {/* Globe Button */}
            <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] hover:bg-[var(--surface)] transition duration-200 cursor-pointer shadow-sm" aria-label="Language Selector">
              <GlobeIcon />
            </button>

              {/* Notifications Button */}
              <div className="relative">
                <button
                  onClick={handleToggleNotifications}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] hover:bg-[var(--surface)] transition-all duration-200 cursor-pointer shadow-sm text-[var(--text)] active:scale-95"
                  aria-label="Notifications"
                >
                  <NotificationIcon />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-violet-600 text-[9px] font-black text-white shadow-md shadow-violet-500/50">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    
                    <div className="absolute right-0 mt-3 w-[360px] max-h-[420px] overflow-y-auto rounded-2xl border border-white/10 bg-[var(--surface)]/95 backdrop-blur-xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 origin-top-right transition-all duration-200 animate-in fade-in slide-in-from-top-2">
                      <div className="px-3.5 py-2.5 border-b border-white/10 mb-2 flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-[var(--muted)]">Recent Activity</span>
                        {unreadCount > 0 ? (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-violet-500/25 text-violet-400 border border-violet-500/30 px-2.5 py-0.5 rounded-md">
                            {unreadCount} New
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-wider text-white/30">
                            Up to date
                          </span>
                        )}
                      </div>
                      {notifications.length === 0 ? (
                        <div className="py-12 text-center text-xs text-[var(--muted)]/50 italic">
                          No notifications yet
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`relative p-3.5 rounded-xl border transition-all duration-200 text-left flex gap-3.5 ${
                                !n.read 
                                  ? "bg-white/[0.05] border-violet-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
                                  : "bg-transparent border-transparent hover:bg-white/[0.02]"
                              }`}
                            >
                              {/* Icon column */}
                              <div className="flex-shrink-0 mt-0.5">
                                {n.type === "contact" ? (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                                    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 stroke-current" fill="none" strokeWidth="2.5">
                                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                  </div>
                                ) : n.type === "subscriber" ? (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                                    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 stroke-current" fill="none" strokeWidth="2.5">
                                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                      <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                  </div>
                                ) : n.type === "social_click" ? (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]">
                                    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 stroke-current" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                      <polyline points="15 3 21 3 21 9" />
                                      <line x1="10" y1="14" x2="21" y2="3" />
                                    </svg>
                                  </div>
                                ) : n.feedback === "yes" ? (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 stroke-current" fill="none" strokeWidth="2.5">
                                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                                    </svg>
                                  </div>
                                ) : (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                                    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 stroke-current" fill="none" strokeWidth="2.5">
                                      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm12-7h3a2 2 0 0 1 2 2v7a2 2 0 0 1 2 2h-3" />
                                    </svg>
                                  </div>
                                )}
                              </div>

                              {/* Content column */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className={`text-[10.5px] font-black uppercase tracking-wider ${
                                    n.type === "contact"
                                      ? "text-amber-400"
                                      : n.type === "subscriber"
                                      ? "text-blue-400"
                                      : n.type === "social_click"
                                      ? "text-indigo-400"
                                      : n.feedback === "yes"
                                      ? "text-emerald-400"
                                      : "text-rose-400"
                                  }`}>
                                    {n.type === "contact"
                                      ? "New Contact Message"
                                      : n.type === "subscriber"
                                      ? "New Subscriber"
                                      : n.type === "social_click"
                                      ? "Social Visit"
                                      : n.feedback === "yes"
                                      ? "Coupon Works"
                                      : "Coupon Broken"}
                                  </span>
                                  <span className="text-[10px] font-bold text-[var(--muted)]/50">
                                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-sm font-black text-[var(--text)] leading-normal truncate">
                                  {n.type === "contact" ? `${n.name} (${n.email})` : n.type === "subscriber" ? n.email : n.storeName}
                                </p>
                                <p className="text-[11px] font-semibold text-[var(--muted)]/70 leading-normal truncate">
                                  {n.type === "contact"
                                    ? `Subject: ${n.subject || "General"}`
                                    : n.type === "subscriber"
                                    ? "Joined the newsletter list."
                                    : n.type === "social_click"
                                    ? `User visited ${n.platform} link.`
                                    : n.offerTitle}
                                </p>
                              </div>
                              
                              {/* Unread indicator dot */}
                              {!n.read && (
                                <span className="absolute top-4 right-4 h-1.5 w-1.5 rounded-full bg-violet-500" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text)] transition-all duration-300 hover:bg-[var(--surface)] active:scale-95 cursor-pointer shadow-sm hover:shadow"
              aria-label="Toggle Theme"
            >
              {!mounted ? (
                <div className="h-4 w-4 rounded-full border border-current opacity-20" />
              ) : theme === "light" ? (
                <SunIcon />
              ) : (
                <MoonIcon />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
