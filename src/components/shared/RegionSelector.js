"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const REGIONS = [
  { code: "US", label: "United States", flag: "🇺🇸" },
  { code: "DE", label: "Germany", flag: "🇩🇪" },
  { code: "UK", label: "United Kingdom", flag: "🇬🇧" },
  { code: "AU", label: "Australia", flag: "🇦🇺" },
  { code: "JP", label: "Japan", flag: "🇯🇵" },
  { code: "FR", label: "France", flag: "🇫🇷" },
];

const STORAGE_KEY = "couponchy-region";

function ChevronIcon({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-4 w-4 transition-transform", open ? "rotate-180" : "rotate-0")}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function RegionSelector() {
  const [open, setOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState(() => {
    if (typeof window === "undefined") {
      return REGIONS[0].code;
    }

    const savedRegion = window.localStorage.getItem(STORAGE_KEY);
    return savedRegion && REGIONS.some((region) => region.code === savedRegion) ? savedRegion : REGIONS[0].code;
  });
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const activeRegion = REGIONS.find((region) => region.code === selectedCode) || REGIONS[0];

  function handleSelect(code) {
    setSelectedCode(code);
    window.localStorage.setItem(STORAGE_KEY, code);
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative hidden lg:block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 items-center gap-2.5 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-3 text-left text-[var(--text)] transition hover:border-[var(--color-primary)]/30 hover:bg-[var(--surface-soft)]"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select region"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] text-sm">
          {activeRegion.flag}
        </span>
        <span className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Region</span>
          <span className="text-sm font-semibold text-[var(--text)]">{activeRegion.code}</span>
        </span>
        <span className="ml-0.5 text-[var(--muted)]">
          <ChevronIcon open={open} />
        </span>
      </button>

      <div
        className={cn(
          "absolute right-0 top-[calc(100%+10px)] z-50 w-56 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[0_24px_80px_var(--page-bg)] transition",
          open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
        )}
      >
        <div className="border-b border-[var(--border)] px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Choose region</p>
        </div>
        <div className="mt-2 grid gap-1">
          {REGIONS.map((region) => {
            const isActive = region.code === activeRegion.code;

            return (
              <button
                key={region.code}
                type="button"
                onClick={() => handleSelect(region.code)}
                className={cn(
                  "flex items-center justify-between rounded-[16px] px-3 py-2.5 text-left transition",
                  isActive
                    ? "border border-[var(--color-primary)]/30 bg-[var(--surface-soft)]"
                    : "border border-transparent hover:border-[var(--border)] hover:bg-[var(--surface-soft)]"
                )}
              >
                <span className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-base">
                    {region.flag}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold text-[var(--text)]">{region.code}</span>
                    <span className="text-xs text-[var(--muted)]">{region.label}</span>
                  </span>
                </span>
                {isActive ? (
                  <span className="rounded-full border border-[var(--color-primary)]/30 bg-[var(--surface)] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                    Live
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
