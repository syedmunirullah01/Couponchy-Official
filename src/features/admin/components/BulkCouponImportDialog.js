"use client";

import { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, useDialogA11yIds } from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";

const TEMPLATE_HEADERS = ["storeSlug", "title", "description", "type", "code", "expiryDate", "status", "source", "affiliateLink"];
const REQUIRED_FIELDS = ["storeSlug", "title", "type"];

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" className="stroke-current opacity-25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" className="stroke-current" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function isValidDateString(value) {
  if (!value) {
    return true;
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
    const [month, day, year] = value.split("/").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function normalizeExpiryDate(value) {
  const normalized = normalizeCsvValue(value);

  if (!normalized) {
    return "";
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(normalized)) {
    const [month, day, year] = normalized.split("/").map(Number);
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return normalized;
}

function normalizeCsvValue(value) {
  return String(value || "").trim();
}

function buildDuplicateKey({ storeSlug, title, type, description, expiryDate, status, affiliateLink }) {
  return [
    storeSlug.toLowerCase(),
    type.toLowerCase(),
    title.trim().toLowerCase(),
    normalizeCsvValue(description).toLowerCase(),
    normalizeCsvValue(expiryDate).toLowerCase(),
    normalizeCsvValue(status).toLowerCase(),
    normalizeCsvValue(affiliateLink).toLowerCase(),
  ].join("::");
}

function normalizeType(value) {
  const normalized = normalizeCsvValue(value).toLowerCase();
  return normalized === "deal" ? "Deal" : normalized === "coupon" ? "Coupon" : "";
}

function normalizeStatus(value) {
  const normalized = normalizeCsvValue(value).toLowerCase();

  if (normalized === "expired") {
    return "Expired";
  }

  if (normalized === "scheduled") {
    return "Scheduled";
  }

  if (normalized === "ending soon") {
    return "Ending soon";
  }

  return "Active";
}

function parseCsvFile(input) {
  return new Promise((resolve, reject) => {
    Papa.parse(input, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().replace(/^\uFEFF/, ""),
      complete: (results) => resolve(results),
      error: (error) => reject(error),
    });
  });
}

export default function BulkCouponImportDialog({ open, onOpenChange, stores, offers = [], onImported }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileContent, setSelectedFileContent] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dryRunSummary, setDryRunSummary] = useState(null);
  const [finalSummary, setFinalSummary] = useState(null);
  const [validRows, setValidRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);
  const { titleId, descriptionId } = useDialogA11yIds();

  const storesBySlug = useMemo(() => new Map(stores.map((store) => [store.slug, store])), [stores]);
  const existingDuplicateKeys = useMemo(
    () =>
      new Set(
        offers.map((offer) =>
          buildDuplicateKey({
            storeSlug: offer.storeSlug,
            title: offer.title,
            type: offer.type,
            description: offer.description,
            expiryDate: offer.expiryDate,
            status: offer.status,
            affiliateLink: offer.affiliateLink,
          })
        )
      ),
    [offers]
  );

  function resetState() {
    setSelectedFile(null);
    setSelectedFileContent("");
    setSummaryState();
    setIsDragging(false);
  }

  function setSummaryState() {
    setDryRunSummary(null);
    setFinalSummary(null);
    setValidRows([]);
    setErrors([]);
  }

  function handleOpenChange(nextOpen) {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      resetState();
    }
  }

  function downloadTemplate() {
    const csv = [
      TEMPLATE_HEADERS.join(","),
      "nike-store,Spring launch coupon,Use this on selected sneakers,Coupon,NIKE20,2026-04-30,Active,Manual,https://example.com/track/nike",
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "couponchy-bulk-coupons-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function selectFile(file) {
    if (!file) {
      return;
    }

    const isCsvFile = file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv");
    if (!isCsvFile) {
      toast.error("Only CSV files are supported.");
      return;
    }

    try {
      const content = await file.text();
      setSelectedFile(file);
      setSelectedFileContent(content);
      setSummaryState();
    } catch {
      toast.error("CSV file could not be read. Save and close the spreadsheet, then select it again.");
    }
  }

  async function runDryValidation() {
    if (!selectedFile) {
      toast.error("Choose a CSV file first.");
      return;
    }

    setIsValidating(true);
    setSummaryState();

    try {
      const results = await parseCsvFile(selectedFileContent || selectedFile);
      const headers = Array.isArray(results.meta?.fields) ? results.meta.fields.map((field) => field.trim()) : [];
      const missingHeaders = REQUIRED_FIELDS.filter((header) => !headers.includes(header));

      if (missingHeaders.length) {
        const headerErrors = missingHeaders.map((header) => ({
          rowNumber: 1,
          reason: `Missing required CSV header: ${header}`,
        }));

        setErrors(headerErrors);
        setDryRunSummary({
          totalRecords: 0,
          validRows: 0,
          duplicates: 0,
          validationErrors: headerErrors.length,
        });
        toast.error("CSV template headers are invalid.");
        return;
      }

      const parsedRows = Array.isArray(results.data) ? results.data : [];
      const clientErrors = [];
      const nextValidRows = [];
      const csvDuplicateKeys = new Set();
      let duplicates = 0;

      let fallbackStoreSlug = "";

      parsedRows.forEach((row, index) => {
        const rowNumber = index + 2;
        const storeSlug = normalizeCsvValue(row.storeSlug).toLowerCase() || fallbackStoreSlug;
        const title = normalizeCsvValue(row.title);
        const description = normalizeCsvValue(row.description);
        const type = normalizeType(row.type);
        const code = normalizeCsvValue(row.code);
        const expiryDate = normalizeExpiryDate(row.expiryDate);
        const status = normalizeStatus(row.status);
        const source = normalizeCsvValue(row.source) || "Manual";
        const affiliateLink = normalizeCsvValue(row.affiliateLink);

        if (storeSlug) {
          fallbackStoreSlug = storeSlug;
        }

        const missingField = REQUIRED_FIELDS.find((field) => !({ storeSlug, title, type })[field]);
        if (missingField) {
          clientErrors.push({ rowNumber, reason: `Missing required field: ${missingField}` });
          return;
        }

        if (type === "Coupon" && !code) {
          clientErrors.push({ rowNumber, reason: "Coupon rows require a code." });
          return;
        }

        if (!isValidDateString(expiryDate)) {
          clientErrors.push({ rowNumber, reason: "Expiry date must use YYYY-MM-DD or MM/DD/YYYY format." });
          return;
        }

        const store = storesBySlug.get(storeSlug);
        if (!store) {
          clientErrors.push({ rowNumber, reason: `Store "${storeSlug}" does not exist.` });
          return;
        }

        const duplicateKey = buildDuplicateKey({
          storeSlug,
          title,
          type,
          description,
          expiryDate,
          status,
          affiliateLink: affiliateLink || store.affiliateLink || "",
        });
        if (existingDuplicateKeys.has(duplicateKey)) {
          duplicates += 1;
          clientErrors.push({ rowNumber, reason: "This offer already exists in the catalog." });
          return;
        }

        if (csvDuplicateKeys.has(duplicateKey)) {
          duplicates += 1;
          clientErrors.push({ rowNumber, reason: "Duplicate offer content found within the same CSV file." });
          return;
        }

        csvDuplicateKeys.add(duplicateKey);
        nextValidRows.push({
          storeSlug,
          title,
          description,
          type,
          code,
          expiryDate,
          status,
          source,
          affiliateLink: affiliateLink || store.affiliateLink || "",
        });
      });

      setValidRows(nextValidRows);
      setErrors(clientErrors);
      setDryRunSummary({
        totalRecords: parsedRows.length,
        validRows: nextValidRows.length,
        duplicates,
        validationErrors: clientErrors.length,
      });

      if (nextValidRows.length) {
        toast.success("Dry-run validation complete.");
      } else {
        toast.error("No valid coupon rows found.");
      }
    } catch (error) {
      toast.error(error.message || "Unable to validate CSV.");
    } finally {
      setIsValidating(false);
    }
  }

  async function handleImport() {
    if (!validRows.length) {
      toast.error("Run validation first.");
      return;
    }

    setIsUploading(true);

    try {
      const response = await fetch("/api/offers/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validRows }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to import coupons.");
      }

      setFinalSummary(payload.data);
      setErrors(payload.data.errors || []);

      if (payload.data.successfullyAdded > 0) {
        await onImported?.();
        toast.success(`${payload.data.successfullyAdded} coupons/deals imported.`);
      } else {
        toast.error("Import finished, but no new coupons were added.");
      }
    } catch (error) {
      toast.error(error.message || "Unable to import coupons.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleCloseAndRefresh() {
    await onImported?.();
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        titleId={titleId}
        descriptionId={descriptionId}
        className="relative max-w-[520px] rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl overflow-hidden"
      >
        <button
          type="button"
          onClick={() => handleOpenChange(false)}
          className="absolute top-5 right-5 z-50 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-soft)] active:scale-95 transition cursor-pointer"
          aria-label="Close dialog"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <DialogHeader className="mb-6 pr-8">
          <span className="w-fit inline-flex items-center rounded-full bg-purple-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-600 border border-purple-500/20 dark:text-purple-400">
            Bulk Import
          </span>
          <DialogTitle id={titleId} className="text-base font-bold tracking-tight text-[var(--text)] mt-3">Bulk Import Coupons</DialogTitle>
          <DialogDescription id={descriptionId} className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
            Attach your coupons CSV spreadsheet to batch-populate offers. Make sure storeSlug matching is accurate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              void selectFile(event.target.files?.[0]);
            }}
          />

          {/* Coupons CSV File Slot */}
          <div 
            className={cn(
              "rounded-xl border p-4 transition-all duration-200",
              isDragging ? "border-[var(--color-primary)] bg-[var(--surface-soft)]/40 shadow-sm" : "border-[var(--border)] bg-[var(--surface-soft)]/10 hover:border-[var(--border)]/80"
            )}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              void selectFile(event.dataTransfer.files?.[0]);
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 stroke-current" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[var(--text)]">Coupons CSV File</h4>
                  <p className="text-[10px] text-[var(--muted)] truncate mt-0.5">
                    {selectedFile ? `${selectedFile.name} (${Math.max(1, Math.round(selectedFile.size / 1024))} KB)` : "Drop offers.csv here or browse"}
                  </p>
                </div>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                className="rounded-lg text-[10px] font-bold px-3 h-7.5 border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shrink-0 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? "Change" : "Browse"}
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full rounded-xl text-xs font-bold h-9.5 border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-soft)] text-[var(--text)] cursor-pointer disabled:opacity-50" 
              disabled={isValidating || isUploading} 
              onClick={runDryValidation}
            >
              {isValidating ? "Validating..." : "Run Validation"}
            </Button>
            <Button 
              type="button" 
              className="w-full rounded-xl text-xs font-bold h-9.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-sm cursor-pointer disabled:opacity-50" 
              disabled={!dryRunSummary?.validRows || isUploading || isValidating} 
              onClick={handleImport}
            >
              {isUploading ? "Importing..." : "Import Coupons"}
            </Button>
          </div>
        </div>

        {(dryRunSummary || finalSummary) ? (
          <div className="mt-6 border-t border-[var(--border)] pt-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-bold text-[var(--text)] uppercase tracking-wider">{finalSummary ? "Import Summary" : "Dry Run Summary"}</p>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider border ${
                finalSummary 
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400" 
                  : "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"
              }`}>
                {finalSummary ? "Success" : "Verified"}
              </span>
            </div>

            <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/20 p-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)]">Total Rows</p>
                <p className="mt-1 text-base font-bold text-[var(--text)]">{(finalSummary || dryRunSummary).totalRecords}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/20 p-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)]">
                  {finalSummary ? "Imported" : "Valid Rows"}
                </p>
                <p className="mt-1 text-base font-bold text-[var(--text)]">
                  {finalSummary ? finalSummary.successfullyAdded : dryRunSummary.validRows}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/20 p-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)]">Duplicates</p>
                <p className="mt-1 text-base font-bold text-[var(--text)]">
                  {finalSummary ? finalSummary.skippedDuplicates : dryRunSummary.duplicates}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/20 p-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)]">Errors</p>
                <p className="mt-1 text-base font-bold text-[var(--text)]">
                  {finalSummary ? finalSummary.failed : dryRunSummary.validationErrors}
                </p>
              </div>
            </div>

            {errors.length ? (
              <div className="rounded-xl border border-red-500/15 bg-red-500/5 p-4 mt-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-2">Errors Trace</p>
                <div className="max-h-32 space-y-1.5 overflow-y-auto text-[11px] font-semibold text-[var(--text)]/80">
                  {errors.map((error, index) => (
                    <p key={`${error.rowNumber}-${index}`}>
                      <span className="text-red-500 font-mono">Row {error.rowNumber}:</span> {error.reason}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            {finalSummary ? (
              <div className="flex justify-end pt-2">
                <Button type="button" className="rounded-xl text-xs font-bold h-9 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-4 cursor-pointer" onClick={handleCloseAndRefresh}>
                  Close and Refresh
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex justify-center border-t border-[var(--border)] pt-4">
          <button 
            type="button" 
            onClick={downloadTemplate} 
            className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[var(--color-primary)] hover:underline cursor-pointer bg-transparent border-0 outline-none p-0"
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3 stroke-current" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download CSV Template Manifest
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
