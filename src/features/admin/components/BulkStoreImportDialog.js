"use client";

import { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, useDialogA11yIds } from "@/components/ui/Dialog";
import { DEFAULT_COUNTRY_CODE, normalizeCountryCode } from "@/lib/countries";
import { cn } from "@/lib/utils";

const TEMPLATE_HEADERS = [
  "Store Name",
  "Slug",
  "Category",
  "Country",
  "Trust Status",
  "Affiliate Tracking Link",
];
const TRUST_STATUSES = new Set(["Verified", "Trusted", "Pending", "Active"]);
const REQUIRED_HEADERS = [
  "Store Name",
  "Slug",
  "Category",
  "Country",
  "Trust Status",
  "Affiliate Tracking Link",
];

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" className="stroke-current opacity-25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" className="stroke-current" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeValue(value) {
  return String(value || "").trim();
}

function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().replace(/^\uFEFF/, ""),
      complete: (results) => resolve(results),
      error: (error) => reject(error),
    });
  });
}

export default function BulkStoreImportDialog({ open, onOpenChange, stores, categories, countries, onImported }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileContent, setSelectedFileContent] = useState("");
  const [selectedZipFile, setSelectedZipFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingZip, setIsDraggingZip] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dryRunSummary, setDryRunSummary] = useState(null);
  const [finalSummary, setFinalSummary] = useState(null);
  const [validRows, setValidRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);
  const zipInputRef = useRef(null);
  const { titleId, descriptionId } = useDialogA11yIds();

  const existingSlugs = useMemo(() => new Set(stores.map((store) => store.slug)), [stores]);
  const categoryNameMap = useMemo(
    () => new Map((categories || []).map((category) => [String(category.name || "").trim().toLowerCase(), category])),
    [categories]
  );
  const allowedCountries = useMemo(
    () => new Set((countries || []).map((country) => normalizeCountryCode(country.code))),
    [countries]
  );
  const countriesMap = useMemo(() => {
    const map = new Map();
    (countries || []).forEach((c) => {
      const code = String(c.code || "").trim().toUpperCase();
      const name = String(c.name || "").trim().toLowerCase();
      map.set(code, code);
      map.set(name, code);
    });
    return map;
  }, [countries]);

  function resetState() {
    setSelectedFile(null);
    setSelectedFileContent("");
    setSelectedZipFile(null);
    setIsDragging(false);
    setIsDraggingZip(false);
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
      'Nike Store,nike-store,Fashion,US,Verified,https://example.com/track/nike',
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "couponchy-store-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result;
        if (text.includes("\uFFFD")) {
          // If UTF-8 parsing produced replacement characters, re-read with windows-1252 (common Excel encoding)
          const fallbackReader = new FileReader();
          fallbackReader.onload = () => resolve(fallbackReader.result);
          fallbackReader.onerror = () => reject(fallbackReader.error);
          fallbackReader.readAsText(file, "windows-1252");
        } else {
          resolve(text);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file, "UTF-8");
    });
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
      const content = await readFileAsText(file);

      setSelectedFile(file);
      setSelectedFileContent(content);
      setDryRunSummary(null);
      setFinalSummary(null);
      setValidRows([]);
      setErrors([]);
    } catch {
      toast.error("CSV file could not be read. Close the spreadsheet app, save the file, and select it again.");
    }
  }

  function selectZipFile(file) {
    if (!file) {
      return;
    }

    const isZipFile =
      file.type === "application/zip" ||
      file.type === "application/x-zip-compressed" ||
      file.name.toLowerCase().endsWith(".zip");

    if (!isZipFile) {
      toast.error("Only ZIP files are supported for logos.");
      return;
    }

    setSelectedZipFile(file);
    setFinalSummary(null);
  }

  async function validateCsv(file, fileContent) {
    const csvSource = fileContent || file;
    const results = await parseCsvFile(csvSource);
    const headers = Array.isArray(results.meta?.fields) ? results.meta.fields.map((field) => field.trim()) : [];
    const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));

    if (missingHeaders.length) {
      const headerErrors = missingHeaders.map((header) => ({
        rowNumber: 1,
        reason: `Missing required CSV header: "${header}"`,
      }));
      return {
        validRows: [],
        errors: headerErrors,
        summary: {
          totalRecords: 0,
          validRows: 0,
          duplicates: 0,
          validationErrors: headerErrors.length,
        },
      };
    }

    const parsedRows = Array.isArray(results.data) ? results.data : [];
    const nextErrors = [];
    const nextValidRows = [];
    const duplicateSlugs = new Set();
    const knownSlugs = new Set(existingSlugs);
    let duplicates = 0;

    parsedRows.forEach((row, index) => {
      const rowNumber = index + 2;
      const name = normalizeValue(row["Store Name"]);
      const incomingSlug = normalizeValue(row["Slug"]);
      const derivedSlug = slugify(incomingSlug || name);
      const category = normalizeValue(row["Category"]);
      const matchedCategory = categoryNameMap.get(category.toLowerCase());
      const trustStatus = normalizeValue(row["Trust Status"]);
      const affiliateLink = normalizeValue(row["Affiliate Tracking Link"]);
      
      const rawCountry = normalizeValue(row["Country"]);
      const countryCode = countriesMap.get(rawCountry.toUpperCase()) || countriesMap.get(rawCountry.toLowerCase()) || normalizeCountryCode(rawCountry);

      if (!name) {
        nextErrors.push({ rowNumber, reason: "Store Name is required." });
        return;
      }

      if (!incomingSlug) {
        nextErrors.push({ rowNumber, reason: "Slug is required." });
        return;
      }

      if (!derivedSlug) {
        nextErrors.push({ rowNumber, reason: "Slug could not be generated." });
        return;
      }

      if (incomingSlug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(incomingSlug)) {
        nextErrors.push({ rowNumber, reason: "Slug contains illegal characters." });
        return;
      }

      if (!category) {
        nextErrors.push({ rowNumber, reason: "Category is required." });
        return;
      }

      if (!matchedCategory) {
        nextErrors.push({ rowNumber, reason: `Category "${category}" must match an existing managed category.` });
        return;
      }

      if (!row["Country"]) {
        nextErrors.push({ rowNumber, reason: "Country is required." });
        return;
      }

      if (!allowedCountries.has(countryCode)) {
        nextErrors.push({ rowNumber, reason: `Country "${row["Country"]}" is not available in settings.` });
        return;
      }

      if (!trustStatus) {
        nextErrors.push({ rowNumber, reason: "Trust Status is required." });
        return;
      }

      if (!TRUST_STATUSES.has(trustStatus)) {
        nextErrors.push({ rowNumber, reason: `Trust Status must be one of: ${[...TRUST_STATUSES].join(", ")}` });
        return;
      }

      if (!affiliateLink) {
        nextErrors.push({ rowNumber, reason: "Affiliate Tracking Link is required." });
        return;
      }

      if (knownSlugs.has(derivedSlug) || duplicateSlugs.has(derivedSlug)) {
        duplicates += 1;
        duplicateSlugs.add(derivedSlug);
        return;
      }

      knownSlugs.add(derivedSlug);

      nextValidRows.push({
        name,
        slug: derivedSlug,
        category: matchedCategory.name,
        categorySlug: matchedCategory.slug,
        countryCode,
        description: `${name} deals and coupons updated by Couponchy.`,
        trustStatus,
        affiliateLink,
        logoText: name,
        logoFile: "",
        contentIntroTitle: "",
        contentIntroParagraph1: "",
        contentIntroParagraph2: "",
        contentWhyItemsText: "",
        contentOutro: "",
        faq1Question: "",
        faq1Answer: "",
        faq2Question: "",
        faq2Answer: "",
        faq3Question: "",
        faq3Answer: "",
      });
    });

    return {
      validRows: nextValidRows,
      errors: nextErrors,
      summary: {
        totalRecords: parsedRows.length,
        validRows: nextValidRows.length,
        duplicates,
        validationErrors: nextErrors.length,
      },
    };
  }

  async function runDryValidation() {
    if (!selectedFile) {
      toast.error("Choose a CSV file first.");
      return;
    }

    setIsValidating(true);
    setDryRunSummary(null);
    setFinalSummary(null);
    setValidRows([]);
    setErrors([]);

    try {
      const { validRows: nextValidRows, errors: nextErrors, summary } = await validateCsv(selectedFile, selectedFileContent);
      setValidRows(nextValidRows);
      setErrors(nextErrors);
      setDryRunSummary(summary);

      if (nextValidRows.length) {
        toast.success("Dry-run validation complete.");
      } else {
        toast.error("No valid store rows found.");
      }
    } catch (error) {
      toast.error(error.message || "Unable to validate CSV.");
    } finally {
      setIsValidating(false);
    }
  }

  async function handleImport() {
    if (!selectedFile && !selectedZipFile) {
      toast.error("Choose a CSV file or Logos ZIP folder first.");
      return;
    }

    setIsUploading(true);
    let rowsToImport = validRows;

    try {
      // If a CSV file is present, validate it if not already done
      if (selectedFile && !rowsToImport.length) {
        setIsValidating(true);
        const { validRows: nextValidRows, errors: nextErrors, summary } = await validateCsv(selectedFile, selectedFileContent);
        setValidRows(nextValidRows);
        setErrors(nextErrors);
        setDryRunSummary(summary);
        setIsValidating(false);

        if (!nextValidRows.length) {
          toast.error("No valid store rows found to import. Check validation errors below.");
          setIsUploading(false);
          return;
        }
        rowsToImport = nextValidRows;
      }

      const response = await fetch("/api/stores/bulk", {
        method: "POST",
        body: (() => {
          const formData = new FormData();
          if (selectedFile) {
            formData.append("rows", JSON.stringify(rowsToImport));
          }
          if (selectedZipFile) {
            formData.append("logosZip", selectedZipFile);
          }
          return formData;
        })(),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to import stores.");
      }

      setFinalSummary(payload.data);
      setErrors(payload.data.errors || []);

      if (payload.data.successfullyImported > 0) {
        await onImported?.();
        toast.success(`${payload.data.successfullyImported} stores imported.`);
      } else if (payload.data.matchedLogos > 0) {
        await onImported?.();
        toast.success(`${payload.data.matchedLogos} logos updated successfully.`);
      } else {
        toast.error("Import finished, but no new stores or logos were updated.");
      }
    } catch (error) {
      toast.error(error.message || "Unable to import stores.");
    } finally {
      setIsUploading(false);
      setIsValidating(false);
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
          <DialogTitle id={titleId} className="text-base font-bold tracking-tight text-[var(--text)] mt-3">Bulk Import Stores</DialogTitle>
          <DialogDescription id={descriptionId} className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
            Attach your stores CSV manifest and optional logos ZIP folder. Make sure category names match your store settings.
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

          {/* Store CSV File Slot */}
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
                  <h4 className="text-xs font-bold text-[var(--text)]">Store CSV File</h4>
                  <p className="text-[10px] text-[var(--muted)] truncate mt-0.5">
                    {selectedFile ? `${selectedFile.name} (${Math.max(1, Math.round(selectedFile.size / 1024))} KB)` : "Drop stores.csv here or browse"}
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

          <input
            ref={zipInputRef}
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            className="hidden"
            onChange={(event) => selectZipFile(event.target.files?.[0])}
          />

          {/* Logos ZIP File Slot */}
          <div 
            className={cn(
              "rounded-xl border p-4 transition-all duration-200",
              isDraggingZip ? "border-[var(--color-primary)] bg-[var(--surface-soft)]/40 shadow-sm" : "border-[var(--border)] bg-[var(--surface-soft)]/10 hover:border-[var(--border)]/80"
            )}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDraggingZip(true);
            }}
            onDragLeave={() => setIsDraggingZip(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDraggingZip(false);
              selectZipFile(event.dataTransfer.files?.[0]);
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 stroke-current" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    <line x1="12" y1="11" x2="12" y2="17" />
                    <line x1="9" y1="14" x2="15" y2="14" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[var(--text)]">Logos ZIP Folder (Optional)</h4>
                  <p className="text-[10px] text-[var(--muted)] truncate mt-0.5">
                    {selectedZipFile ? `${selectedZipFile.name} (${Math.max(1, Math.round(selectedZipFile.size / 1024))} KB)` : "Upload store logo images archive"}
                  </p>
                </div>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                className="rounded-lg text-[10px] font-bold px-3 h-7.5 border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shrink-0 cursor-pointer"
                onClick={() => zipInputRef.current?.click()}
              >
                {selectedZipFile ? "Change" : "Browse"}
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full rounded-xl text-xs font-bold h-9.5 border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-soft)] text-[var(--text)] cursor-pointer disabled:opacity-50" 
              disabled={!selectedFile || isValidating || isUploading} 
              onClick={runDryValidation}
            >
              {isValidating ? "Validating..." : "Run Validation"}
            </Button>
            <Button 
              type="button" 
              className="w-full rounded-xl text-xs font-bold h-9.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-sm cursor-pointer disabled:opacity-50" 
              disabled={(!selectedFile && !selectedZipFile) || isUploading || isValidating} 
              onClick={handleImport}
            >
              {isUploading ? "Importing..." : "Import Stores"}
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

            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/20 p-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)]">Total Rows</p>
                <p className="mt-1 text-base font-bold text-[var(--text)]">{(finalSummary || dryRunSummary).totalRecords}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/20 p-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)]">
                  {finalSummary ? "Imported" : "Valid Rows"}
                </p>
                <p className="mt-1 text-base font-bold text-[var(--text)]">
                  {finalSummary ? finalSummary.successfullyImported : dryRunSummary.validRows}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/20 p-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)]">Duplicates</p>
                <p className="mt-1 text-base font-bold text-[var(--text)]">
                  {finalSummary ? finalSummary.duplicatesSkipped : dryRunSummary.duplicates}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/20 p-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)]">Errors</p>
                <p className="mt-1 text-base font-bold text-[var(--text)]">
                  {finalSummary ? finalSummary.validationErrors : dryRunSummary.validationErrors}
                </p>
              </div>
              {finalSummary ? (
                <>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/20 p-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)]">Matched Logos</p>
                    <p className="mt-1 text-base font-bold text-[var(--text)]">{finalSummary.matchedLogos}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/20 p-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)]">Missing Logos</p>
                    <p className="mt-1 text-base font-bold text-[var(--text)]">{finalSummary.missingLogos}</p>
                  </div>
                </>
              ) : null}
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
