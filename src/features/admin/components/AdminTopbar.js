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

  useEffect(() => {
    const savedTheme = localStorage.getItem("admin-theme") || "dark";
    setTheme(savedTheme);
    setMounted(true);
  }, []);

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
    <header className="border-b border-[var(--border)] bg-[var(--surface)]/80 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
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
            <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] hover:bg-[var(--surface)] transition duration-200 cursor-pointer shadow-sm" aria-label="Notifications">
              <NotificationIcon />
              <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
              <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
            </button>

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
