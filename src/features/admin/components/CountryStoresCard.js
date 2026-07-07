"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { SUPPORTED_COUNTRIES } from "@/lib/countries";

export default function CountryStoresCard({ stores = [] }) {
  const [expanded, setExpanded] = useState(false);

  // Group stores count by country code
  const countsByCountry = {};
  stores.forEach((store) => {
    const code = (store.countryCode || "US").toUpperCase();
    countsByCountry[code] = (countsByCountry[code] || 0) + 1;
  });

  // Map to listed countries in SUPPORTED_COUNTRIES
  const countryData = SUPPORTED_COUNTRIES.map((c) => ({
    code: c.code,
    name: c.name,
    flag: c.flag,
    count: countsByCountry[c.code] || 0,
  })).sort((a, b) => b.count - a.count); // Show most active countries first

  const maxCount = Math.max(...countryData.map((c) => c.count)) || 1;
  const totalListedStores = stores.length || 1;

  const displayedCountries = expanded ? countryData : countryData.slice(0, 5);
  const hasMore = countryData.length > 5;

  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-orange-500",
    "bg-red-500",
    "bg-pink-500",
    "bg-teal-500",
  ];

  return (
    <Card className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm flex flex-col justify-between h-fit">
      <div>
        <div className="border-b border-[var(--border)] pb-4">
          <CardTitle className="text-base font-bold tracking-tight text-[var(--text)]">Active Country Hubs</CardTitle>
          <CardDescription className="text-xs text-[var(--muted)] mt-0.5">Store listing breakdown by listed countries.</CardDescription>
        </div>

        <div className="mt-4 space-y-3.5">
          {displayedCountries.map((country, index) => {
            const percentWidth = Math.max(8, Math.round((country.count / maxCount) * 100));

            return (
              <div key={country.code} className="flex items-center justify-between text-xs transition-all duration-200">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="text-base" role="img" aria-label={country.name}>
                    {country.flag}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[var(--text)] truncate">{country.name}</p>
                    <div className="mt-1.5 h-1.5 w-3/4 rounded-full bg-[var(--surface-soft)] border border-[var(--border)] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors[index % colors.length]} transition-all duration-500`}
                        style={{ width: `${percentWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-right pl-3">
                  <span className="font-bold text-[var(--text)]">
                    {country.count.toString().padStart(2, "0")}
                  </span>
                  <span className="text-[10px] text-[var(--muted)] font-medium ml-1">stores</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {hasMore && (
        <div className="mt-6 border-t border-[var(--border)] pt-4 text-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition cursor-pointer select-none"
          >
            {expanded ? (
              <>
                <span>See Less</span>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                </svg>
              </>
            ) : (
              <>
                <span>See More ({countryData.length - 5} countries)</span>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </Card>
  );
}
