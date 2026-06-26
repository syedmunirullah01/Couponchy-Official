"use client";

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

export default function AdminTopbar({ title, breadcrumbTrail = [] }) {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--page-bg)]/80 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
            {breadcrumbTrail.map((item, index) => (
              <div key={item} className="flex items-center gap-2">
                {index > 0 ? <ChevronRightIcon /> : null}
                <span>{item}</span>
              </div>
            ))}
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--text)]">{title}</h2>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-[260px] flex-1 sm:flex-none">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">
              <SearchIcon />
            </span>
            <Input className="pl-11" placeholder="Search stores, coupons, deals, or networks" />
          </div>
        </div>
      </div>
    </header>
  );
}
