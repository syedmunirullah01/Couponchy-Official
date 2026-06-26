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
        className="max-w-[1080px] rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-0"
      >
        <div className="grid gap-0 lg:grid-cols-[0.74fr_1.26fr]">
          <div className="border-b border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-soft),var(--surface))] p-6 lg:border-r lg:border-b-0 lg:p-8">
            <DialogHeader className="mb-7">
              <Badge className="w-fit border border-[var(--color-primary)]/20 bg-[var(--surface)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--color-primary)]">
                Bulk import
              </Badge>
              <DialogTitle id={titleId}>Bulk Import Coupons</DialogTitle>
              <DialogDescription id={descriptionId}>Upload CSV, review the dry run, then import the batch.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Card className="rounded-[24px] border-[var(--border)] bg-[var(--surface)] shadow-none">
                <CardContent className="p-5">
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Step 01</p>
                      <p className="mt-2 text-sm font-medium text-[var(--text)]">Attach `offers.csv`</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Step 02</p>
                      <p className="mt-2 text-sm font-medium text-[var(--text)]">Review the dry validation report</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Step 03</p>
                      <p className="mt-2 text-sm font-medium text-[var(--text)]">Import approved coupon rows</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[24px] border-[var(--border)] bg-[var(--surface)] shadow-none">
                <CardContent className="space-y-4 p-5">
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Template</span>
                      <span className="text-sm font-medium text-[var(--text)]">CSV</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Validation</span>
                      <span className="text-sm font-medium text-[var(--text)]">Client + API</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Affiliate</span>
                      <span className="text-sm font-medium text-[var(--text)]">Store fallback</span>
                    </div>
                  </div>

                  <Button type="button" variant="outline" className="w-full rounded-xl" onClick={downloadTemplate}>
                    Download CSV Template
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-4 p-6 lg:p-8">
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-soft)]/35 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">Import assets</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">CSV only</p>
                </div>
                {selectedFile ? <Badge variant="outline">Ready</Badge> : null}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => {
                  void selectFile(event.target.files?.[0]);
                }}
              />

              <div
                className={cn(
                  "rounded-[22px] border border-dashed p-5 transition",
                  isDragging ? "border-[var(--color-primary)] bg-[var(--surface)]" : "border-[var(--border)] bg-[var(--surface)]"
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
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-base font-semibold text-[var(--text)]">Coupons CSV</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">Drop file here or browse manually</p>
                  </div>
                  <Button type="button" variant="outline" className="min-w-[148px] rounded-xl bg-[var(--surface-soft)] px-4" onClick={() => fileInputRef.current?.click()}>
                    Select CSV
                  </Button>
                </div>
              </div>

              {selectedFile ? (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--text)]">{selectedFile.name}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{Math.max(1, Math.round(selectedFile.size / 1024))} KB</p>
                  </div>
                  <Badge variant="outline">CSV</Badge>
                </div>
              ) : null}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Button type="button" variant="outline" className="w-full rounded-xl" disabled={isValidating || isUploading} onClick={runDryValidation}>
                  {isValidating ? (
                    <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                      <Spinner />
                      Validating...
                    </span>
                  ) : (
                    "Run Dry Validation"
                  )}
                </Button>
                <Button type="button" className="w-full rounded-xl" disabled={!dryRunSummary?.validRows || isUploading || isValidating} onClick={handleImport}>
                  {isUploading ? (
                    <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                      <Spinner />
                      Importing...
                    </span>
                  ) : (
                    "Import Coupons"
                  )}
                </Button>
              </div>
            </div>

            {(dryRunSummary || finalSummary) ? (
              <Card className="rounded-[24px] border-[var(--border)] bg-[var(--surface)] shadow-none">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--text)]">{finalSummary ? "Import Summary" : "Dry Run Summary"}</p>
                    <Badge variant={finalSummary ? "success" : "outline"}>{finalSummary ? "Completed" : "Preview"}</Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Total Records</p>
                      <p className="mt-2 text-xl font-semibold text-[var(--text)]">{(finalSummary || dryRunSummary).totalRecords}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{finalSummary ? "Successfully Added" : "Valid Rows"}</p>
                        <Badge variant="success" size="sm">{finalSummary ? finalSummary.successfullyAdded : dryRunSummary.validRows}</Badge>
                      </div>
                      <p className="mt-2 text-xl font-semibold text-[var(--text)]">{finalSummary ? finalSummary.successfullyAdded : dryRunSummary.validRows}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Duplicates</p>
                        <Badge variant="warning" size="sm">{finalSummary ? finalSummary.skippedDuplicates : dryRunSummary.duplicates}</Badge>
                      </div>
                      <p className="mt-2 text-xl font-semibold text-[var(--text)]">{finalSummary ? finalSummary.skippedDuplicates : dryRunSummary.duplicates}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Errors</p>
                        <Badge variant="destructive" size="sm">{finalSummary ? finalSummary.failed : dryRunSummary.validationErrors}</Badge>
                      </div>
                      <p className="mt-2 text-xl font-semibold text-[var(--text)]">{finalSummary ? finalSummary.failed : dryRunSummary.validationErrors}</p>
                    </div>
                  </div>

                  {errors.length ? (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Errors</p>
                      <div className="mt-3 max-h-40 space-y-2 overflow-y-auto text-sm text-[var(--muted)]">
                        {errors.map((error, index) => (
                          <p key={`${error.rowNumber}-${index}`}>
                            Row {error.rowNumber}: {error.reason}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {finalSummary ? (
                    <div className="flex justify-end">
                      <Button type="button" className="rounded-xl" onClick={handleCloseAndRefresh}>
                        Close and Refresh
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
