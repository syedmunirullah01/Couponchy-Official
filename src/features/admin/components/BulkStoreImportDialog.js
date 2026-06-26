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
  "name",
  "slug",
  "category",
  "countryCode",
  "description",
  "trustStatus",
  "affiliateLink",
  "logoText",
  "logoFile",
  "contentIntroTitle",
  "contentIntroParagraph1",
  "contentIntroParagraph2",
  "contentWhyItemsText",
  "contentOutro",
  "faq1Question",
  "faq1Answer",
  "faq2Question",
  "faq2Answer",
  "faq3Question",
  "faq3Answer",
];
const TRUST_STATUSES = new Set(["Verified", "Trusted", "Pending", "Active"]);
const REQUIRED_HEADERS = ["name"];

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
      'Nike Store,nike-store,Fashion,US,"Editorial summary for the Nike page with at least twenty characters.",Active,https://example.com/track/nike,Nike,nike.png,More Information On Nike Deals,"Nike intro paragraph one.","Nike intro paragraph two.","Verified deals\\nCoupon codes\\nStore updates","Nike outro copy","How often are Nike offers updated?","Offers are reviewed regularly.","Are Nike deals verified?","Couponchy tracks trust signals.","Can I use both deals and coupons?","Yes, both can appear on the store page."',
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
      const csvSource = selectedFileContent || selectedFile;
      const results = await parseCsvFile(csvSource);
      const headers = Array.isArray(results.meta?.fields) ? results.meta.fields.map((field) => field.trim()) : [];
      const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));

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
      const nextErrors = [];
      const nextValidRows = [];
      const duplicateSlugs = new Set();
      const knownSlugs = new Set(existingSlugs);
      let duplicates = 0;

      parsedRows.forEach((row, index) => {
        const rowNumber = index + 2;
        const name = normalizeValue(row.name);
        const incomingSlug = normalizeValue(row.slug);
        const derivedSlug = slugify(incomingSlug || name);
        const category = normalizeValue(row.category) || "General";
        const matchedCategory = categoryNameMap.get(category.toLowerCase());
        const description = normalizeValue(row.description);
        const trustStatus = normalizeValue(row.trustStatus);
        const affiliateLink = normalizeValue(row.affiliateLink);
        const logoText = normalizeValue(row.logoText);
        const logoFile = normalizeValue(row.logoFile);
        const countryCode = normalizeCountryCode(row.countryCode || row.country);

        if (!name) {
          nextErrors.push({ rowNumber, reason: "Store name is required." });
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

        if (!matchedCategory) {
          nextErrors.push({ rowNumber, reason: "Category must match an existing managed category." });
          return;
        }

        if (description.length < 20) {
          nextErrors.push({ rowNumber, reason: "Description should be at least 20 characters." });
          return;
        }

        if (!allowedCountries.has(countryCode)) {
          nextErrors.push({ rowNumber, reason: "Country code is not available in settings." });
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
          description,
          trustStatus: TRUST_STATUSES.has(trustStatus) ? trustStatus : "Active",
          affiliateLink,
          logoText: logoText || name,
          logoFile,
          contentIntroTitle: normalizeValue(row.contentIntroTitle),
          contentIntroParagraph1: normalizeValue(row.contentIntroParagraph1),
          contentIntroParagraph2: normalizeValue(row.contentIntroParagraph2),
          contentWhyItemsText: normalizeValue(row.contentWhyItemsText).replace(/\\n/g, "\n"),
          contentOutro: normalizeValue(row.contentOutro),
          faq1Question: normalizeValue(row.faq1Question),
          faq1Answer: normalizeValue(row.faq1Answer),
          faq2Question: normalizeValue(row.faq2Question),
          faq2Answer: normalizeValue(row.faq2Answer),
          faq3Question: normalizeValue(row.faq3Question),
          faq3Answer: normalizeValue(row.faq3Answer),
        });
      });

      setValidRows(nextValidRows);
      setErrors(nextErrors);
      setDryRunSummary({
        totalRecords: parsedRows.length,
        validRows: nextValidRows.length,
        duplicates,
        validationErrors: nextErrors.length,
      });

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
    if (!validRows.length) {
      toast.error("Run validation first.");
      return;
    }

    setIsUploading(true);

    try {
      const response = await fetch("/api/stores/bulk", {
        method: "POST",
        body: (() => {
          const formData = new FormData();
          formData.append("rows", JSON.stringify(validRows));
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
      } else {
        toast.error("Import finished, but no new stores were created.");
      }
    } catch (error) {
      toast.error(error.message || "Unable to import stores.");
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
              <DialogTitle id={titleId}>Bulk Import Stores</DialogTitle>
              <DialogDescription id={descriptionId}>Upload assets, review the batch, then import.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Card className="rounded-[24px] border-[var(--border)] bg-[var(--surface)] shadow-none">
                <CardContent className="p-5">
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Step 01</p>
                      <p className="mt-2 text-sm font-medium text-[var(--text)]">Attach `stores.csv`</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Step 02</p>
                      <p className="mt-2 text-sm font-medium text-[var(--text)]">Optionally add `logos.zip`</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Step 03</p>
                      <p className="mt-2 text-sm font-medium text-[var(--text)]">Run validation and import</p>
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
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Slug</span>
                      <span className="text-sm font-medium text-[var(--text)]">Auto if empty</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Country</span>
                      <span className="text-sm font-medium text-[var(--text)]">Required</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Category</span>
                      <span className="text-sm font-medium text-[var(--text)]">Must match admin category</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Logos ZIP</span>
                      <span className="text-sm font-medium text-[var(--text)]">Optional</span>
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
                  <p className="mt-1 text-xs text-[var(--muted)]">CSV required, ZIP optional</p>
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
                    <p className="text-base font-semibold text-[var(--text)]">Store CSV</p>
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

              <input
                ref={zipInputRef}
                type="file"
                accept=".zip,application/zip,application/x-zip-compressed"
                className="hidden"
                onChange={(event) => selectZipFile(event.target.files?.[0])}
              />

              <div
                className={cn(
                  "mt-4 rounded-[22px] border border-dashed p-5 transition",
                  isDraggingZip ? "border-[var(--color-primary)] bg-[var(--surface)]" : "border-[var(--border)] bg-[var(--surface)]"
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
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-base font-semibold text-[var(--text)]">Logos ZIP</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">Optional, matched using `logoFile`</p>
                  </div>
                  <Button type="button" variant="outline" className="min-w-[148px] rounded-xl bg-[var(--surface-soft)] px-4" onClick={() => zipInputRef.current?.click()}>
                    Select ZIP
                  </Button>
                </div>
              </div>

              {selectedZipFile ? (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--text)]">{selectedZipFile.name}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{Math.max(1, Math.round(selectedZipFile.size / 1024))} KB</p>
                  </div>
                  <Badge variant="outline">ZIP</Badge>
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
                    "Import Stores"
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

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Total Records</p>
                      <p className="mt-2 text-xl font-semibold text-[var(--text)]">{(finalSummary || dryRunSummary).totalRecords}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                          {finalSummary ? "Successfully Imported" : "Valid Rows"}
                        </p>
                        <Badge variant="success" size="sm">
                          {finalSummary ? finalSummary.successfullyImported : dryRunSummary.validRows}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xl font-semibold text-[var(--text)]">
                        {finalSummary ? finalSummary.successfullyImported : dryRunSummary.validRows}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Duplicates Skipped</p>
                        <Badge variant="warning" size="sm">
                          {finalSummary ? finalSummary.duplicatesSkipped : dryRunSummary.duplicates}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xl font-semibold text-[var(--text)]">
                        {finalSummary ? finalSummary.duplicatesSkipped : dryRunSummary.duplicates}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Validation Errors</p>
                        <Badge variant="destructive" size="sm">
                          {finalSummary ? finalSummary.validationErrors : dryRunSummary.validationErrors}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xl font-semibold text-[var(--text)]">
                        {finalSummary ? finalSummary.validationErrors : dryRunSummary.validationErrors}
                      </p>
                    </div>
                    {finalSummary ? (
                      <>
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Matched Logos</p>
                            <Badge variant="success" size="sm">{finalSummary.matchedLogos}</Badge>
                          </div>
                          <p className="mt-2 text-xl font-semibold text-[var(--text)]">{finalSummary.matchedLogos}</p>
                        </div>
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Missing Logos</p>
                            <Badge variant="warning" size="sm">{finalSummary.missingLogos}</Badge>
                          </div>
                          <p className="mt-2 text-xl font-semibold text-[var(--text)]">{finalSummary.missingLogos}</p>
                        </div>
                      </>
                    ) : null}
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
