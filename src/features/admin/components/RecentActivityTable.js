"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";

export default function RecentActivityTable({ rows = [] }) {
  const [expanded, setExpanded] = useState(false);

  const displayedRows = expanded ? rows : rows.slice(0, 5);
  const hasMore = rows.length > 5;

  return (
    <Card className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <CardHeader className="p-6">
        <div>
          <CardTitle className="text-base font-bold tracking-tight text-[var(--text)]">Recent Offers Manager</CardTitle>
          <CardDescription className="text-[11px] text-[var(--muted)] mt-0.5">Real-time listing of incoming coupons and shopping deals.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0">
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <Table>
            <TableHeader className="bg-[var(--surface-soft)]/50">
              <TableRow className="border-b border-[var(--border)] hover:bg-transparent">
                <TableHead className="h-10 text-[10px] font-black uppercase tracking-wider text-[var(--muted)] px-4">#</TableHead>
                <TableHead className="h-10 text-[10px] font-black uppercase tracking-wider text-[var(--muted)] px-4">Coupon / Deal Description</TableHead>
                <TableHead className="h-10 text-[10px] font-black uppercase tracking-wider text-[var(--muted)] px-4">Store</TableHead>
                <TableHead className="h-10 text-[10px] font-black uppercase tracking-wider text-[var(--muted)] px-4">Type</TableHead>
                <TableHead className="h-10 text-[10px] font-black uppercase tracking-wider text-[var(--muted)] px-4">Source</TableHead>
                <TableHead className="h-10 text-[10px] font-black uppercase tracking-wider text-[var(--muted)] px-4 text-right">Added Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRows.length > 0 ? (
                displayedRows.map((row, index) => {
                  const isCoupon = row.type === "Coupon";
                  return (
                    <TableRow key={`${row.title}-${row.store}`} className="border-b border-[var(--border)]/50 last:border-0 hover:bg-[var(--surface-soft)]/60 transition-colors duration-150">
                      <TableCell className="text-xs text-[var(--muted)] py-3 px-4 font-mono">{(index + 1).toString().padStart(2, '0')}</TableCell>
                      <TableCell className="font-semibold text-[var(--text)] text-xs py-3 px-4 max-w-[280px] truncate">{row.title}</TableCell>
                      <TableCell className="text-[var(--text)]/80 text-xs py-3 px-4 capitalize font-medium">{row.store}</TableCell>
                      <TableCell className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${isCoupon
                            ? "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400"
                            : "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"
                          }`}>
                          {isCoupon ? "Coupon" : "Deal"}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <span className="text-[var(--muted)] text-[10px] font-bold uppercase tracking-wider bg-[var(--surface-soft)] px-2 py-0.5 rounded border border-[var(--border)]">{row.source || "Manual"}</span>
                      </TableCell>
                      <TableCell className="text-[var(--muted)] text-xs py-3 px-4 text-right font-semibold">{row.addedAt}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-xs text-[var(--muted)]/50 font-medium">
                    No recent activity records.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {hasMore && (
          <div className="mt-4 border-t border-[var(--border)] pt-4 text-center">
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
                  <span>See More ({rows.length - 5} offers)</span>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
