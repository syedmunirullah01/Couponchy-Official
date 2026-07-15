"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/AppModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import AdminUsersManager from "@/features/admin/components/AdminUsersManager";
import { DEFAULT_COUNTRY_CODE, SUPPORTED_COUNTRIES, sanitizeCountryList } from "@/lib/countries";
import { cn } from "@/lib/utils";

const initialState = {
  general: {
    siteName: "Couponchy",
    tagline: "Smart shopping, better saving.",
    supportEmail: "support@couponchy.com",
    countries: SUPPORTED_COUNTRIES,
    customHeadScript: "",
    customBodyStartScript: "",
    customBodyEndScript: "",
    logoUrl: "",
    faviconUrl: "",
  },
  affiliate: {
    cjEnabled: true,
    cjAccount: "",
    rakutenEnabled: true,
    rakutenAccount: "",
    impactEnabled: true,
    impactAccount: "",
    syncFrequency: "Every 6 hours",
  },
  social: {
    facebook: "",
    instagram: "",
    x: "",
    tiktok: "",
    youtube: "",
    discord: "",
    pinterest: "",
    defaultShareText: "Verified coupons and deals from Couponchy.",
  },
  seo: {
    titleTemplate: "%s | Couponchy",
    metaDescription: "Verified coupons, deals, and store offers updated daily.",
    ogTitle: "Couponchy",
    ogDescription: "Discover verified coupons and deals for top stores.",
    robots: "index,follow",
    autoGenerateStoreMetadata: true,
    storeMetaTitleTemplate: "%store% %best_discount%% Off Discount & Coupon Codes %year%",
    storeMetaDescriptionTemplate:
      "Save with %offers_count% verified %store% coupon codes and deals on Couponchy. Best current offer: %best_offer%. Updated for %year%.",
  },
};

const tabs = [
  { key: "general", label: "General" },
  { key: "countries", label: "Countries" },
  { key: "affiliate", label: "Affiliate Networks" },
  { key: "social", label: "Social Media" },
  { key: "seo", label: "SEO Defaults" },
  { key: "verification", label: "Verification Files" },
  { key: "users", label: "Users & Roles" },
];

function SectionField({ label, children, hint }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">{label}</span>
      {children}
      {hint ? <span className="text-[11px] text-[var(--muted)] leading-relaxed">{hint}</span> : null}
    </label>
  );
}

function SettingsCard({ title, description, children, onSaveLabel = "Save" }) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-center sm:justify-between p-6">
        <div>
          <CardTitle className="text-base font-bold tracking-tight text-[var(--text)]">{title}</CardTitle>
          <CardDescription className="text-xs text-[var(--muted)] mt-0.5">{description}</CardDescription>
        </div>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] px-5 text-xs font-bold text-white shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:pointer-events-none flex-shrink-0"
          onClick={onSaveLabel.onClick}
          disabled={onSaveLabel.disabled}
        >
          {onSaveLabel.label}
        </button>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 p-6">
        {children}
      </CardContent>
    </Card>
  );
}

function SettingsSection({ title, description, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/30 overflow-hidden ${className}`}>
      <div className="border-b border-[var(--border)]/60 bg-[var(--surface-soft)]/50 px-5 py-3.5">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">{title}</p>
        {description ? <p className="mt-0.5 text-[11px] text-[var(--muted)]">{description}</p> : null}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ScriptTextarea({ value, onChange, placeholder }) {
  return (
    <textarea
      rows={6}
      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 font-mono text-xs text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      spellCheck={false}
    />
  );
}

export default function AdminSettingsPanel() {
  const [settings, setSettings] = useState(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [savingSection, setSavingSection] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  const [newCountryCode, setNewCountryCode] = useState("");
  const [newCountryName, setNewCountryName] = useState("");
  const [countryDeleteTarget, setCountryDeleteTarget] = useState(null);

  // Verification files state
  const [verificationFiles, setVerificationFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteTargetFile, setDeleteTargetFile] = useState(null);
  const [uploadingAsset, setUploadingAsset] = useState("");
  const [updatingFile, setUpdatingFile] = useState(null);
  const updateFileInputRef = useRef(null);

  async function handleBrandingUpload(e, type) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    setUploadingAsset(type);
    try {
      const res = await fetch("/api/uploads/branding", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        updateSection("general", `${type}Url`, data.data.secureUrl);
        toast.success(`${type === "logo" ? "Logo" : "Favicon"} uploaded successfully.`);
      } else {
        toast.error(data.error || `Failed to upload ${type}.`);
      }
    } catch (err) {
      toast.error(`Failed to upload ${type}.`);
    } finally {
      setUploadingAsset("");
      e.target.value = "";
    }
  }

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load settings.");
        }

        if (active) {
          setSettings(payload.data);
        }
      } catch (error) {
        toast.error(error.message);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  async function loadVerificationFiles() {
    try {
      const res = await fetch("/api/settings/verification");
      const data = await res.json();
      if (res.ok) {
        setVerificationFiles(data.data || []);
      } else {
        toast.error(data.error || "Failed to load verification files.");
      }
    } catch (err) {
      toast.error("Failed to load verification files.");
    }
  }

  useEffect(() => {
    if (activeTab === "verification") {
      loadVerificationFiles();
    }
  }, [activeTab]);

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const res = await fetch("/api/settings/verification", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("File uploaded successfully.");
        loadVerificationFiles();
      } else {
        toast.error(data.error || "Failed to upload file.");
      }
    } catch (err) {
      toast.error("Failed to upload file.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  async function handleDeleteFileConfirmed() {
    if (!deleteTargetFile) return;

    setIsUploading(true);
    try {
      const res = await fetch(`/api/settings/verification?filename=${encodeURIComponent(deleteTargetFile.name)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("File deleted successfully.");
        loadVerificationFiles();
      } else {
        toast.error(data.error || "Failed to delete file.");
      }
    } catch (err) {
      toast.error("Failed to delete file.");
    } finally {
      setIsUploading(false);
      setDeleteTargetFile(null);
    }
  }

  async function handleDownloadFile(fileName) {
    try {
      const response = await fetch(`/${fileName}`);
      if (!response.ok) throw new Error("Failed to download file");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Failed to download file.");
    }
  }

  function triggerUpdateFile(file) {
    setUpdatingFile(file);
    if (updateFileInputRef.current) {
      updateFileInputRef.current.click();
    }
  }

  async function handleUpdateFileChange(e) {
    const file = e.target.files?.[0];
    if (!file || !updatingFile) return;

    const getExtension = (name) => {
      const parts = name.split(".");
      return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : "";
    };

    if (getExtension(file.name) !== getExtension(updatingFile.name)) {
      toast.error(`File extension must match the original: ${getExtension(updatingFile.name)}`);
      setUpdatingFile(null);
      e.target.value = "";
      return;
    }

    const renamedFile = new File([file], updatingFile.name, { type: file.type });
    const formData = new FormData();
    formData.append("file", renamedFile);

    setIsUploading(true);
    try {
      const res = await fetch("/api/settings/verification", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`File "${updatingFile.name}" updated successfully.`);
        loadVerificationFiles();
      } else {
        toast.error(data.error || "Failed to update file.");
      }
    } catch (err) {
      toast.error("Failed to update file.");
    } finally {
      setIsUploading(false);
      setUpdatingFile(null);
      e.target.value = "";
    }
  }

  function updateSection(section, field, value) {
    setSettings((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  }

  const countries = useMemo(
    () => sanitizeCountryList(settings.general?.countries || SUPPORTED_COUNTRIES),
    [settings.general?.countries]
  );

  async function persistGeneralSettings(nextGeneral, successMessage = "General settings saved.") {
    try {
      setSavingSection("general");
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          general: {
            ...nextGeneral,
            countries: sanitizeCountryList(nextGeneral?.countries || SUPPORTED_COUNTRIES),
          },
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to save settings.");
      }

      setSettings(payload.data);
      toast.success(successMessage);
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    } finally {
      setSavingSection("");
    }
  }

  async function handleAddCountry() {
    const code = newCountryCode.trim().toUpperCase();
    const name = newCountryName.trim();

    if (!/^[A-Z]{2}$/.test(code)) {
      toast.error("Country code must be 2 letters.");
      return;
    }

    if (!name) {
      toast.error("Country name is required.");
      return;
    }

    if (countries.some((country) => country.code === code)) {
      toast.error("This country code already exists.");
      return;
    }

    const nextCountries = sanitizeCountryList([...countries, { code, name }]);
    const didSave = await persistGeneralSettings(
      {
        ...settings.general,
        countries: nextCountries,
      },
      "Country added."
    );

    if (didSave) {
      setNewCountryCode("");
      setNewCountryName("");
    }
  }

  async function handleRemoveCountryConfirmed() {
    if (!countryDeleteTarget) {
      return;
    }

    if (countryDeleteTarget.code === DEFAULT_COUNTRY_CODE) {
      toast.error("Default country cannot be removed.");
      return;
    }

    await persistGeneralSettings(
      {
        ...settings.general,
        countries: countries.filter((country) => country.code !== countryDeleteTarget.code),
      },
      "Country removed."
    );
    setCountryDeleteTarget(null);
  }

  async function saveSection(sectionKey, sectionName) {
    try {
      setSavingSection(sectionKey);
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [sectionKey]: settings[sectionKey] }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to save settings.");
      }

      setSettings(payload.data);
      toast.success(`${sectionName} settings saved.`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingSection("");
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-sm text-[var(--muted)]">Loading settings...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-center sm:justify-between p-6">
          <div>
            <CardTitle className="text-base font-bold tracking-tight text-[var(--text)]">Settings</CardTitle>
            <CardDescription className="text-xs text-[var(--muted)] mt-0.5">Organize platform settings by area and save each section independently.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-150",
                  activeTab === tab.key
                    ? "bg-[var(--color-primary)] text-white shadow-sm"
                    : "border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--color-primary)]/40"
                )}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {activeTab === "general" ? (
        <SettingsCard
          title="General"
          description="Core brand and platform defaults."
          onSaveLabel={{
            onClick: () => saveSection("general", "General"),
            disabled: savingSection === "general",
            label: savingSection === "general" ? "Saving..." : "Save",
          }}
        >
          <div className="grid gap-4 md:col-span-2">
            <SettingsSection title="Brand Basics" description="Primary platform identity and contact defaults.">
              <div className="grid gap-4 md:grid-cols-2">
                <SectionField label="Site Name">
                  <Input
                    value={settings.general.siteName}
                    onChange={(event) => updateSection("general", "siteName", event.target.value)}
                  />
                </SectionField>
                <SectionField label="Tagline">
                  <Input
                    value={settings.general.tagline}
                    onChange={(event) => updateSection("general", "tagline", event.target.value)}
                  />
                </SectionField>
                <SectionField label="Support Email">
                  <Input
                    type="email"
                    value={settings.general.supportEmail}
                    onChange={(event) => updateSection("general", "supportEmail", event.target.value)}
                  />
                </SectionField>
              </div>
            </SettingsSection>

            <SettingsSection
              title="Branding Assets"
              description="Manage and upload your custom brand logo and website favicon."
            >
              <div className="grid gap-6 md:grid-cols-2">
                {/* Logo Manager */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">Brand Logo</h4>
                    <p className="text-[10px] text-[var(--muted)] mt-0.5">Recommended: 200x50 px, transparent PNG or SVG. Max 1MB.</p>
                  </div>

                  <div className="flex h-16 w-full items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-soft)] overflow-hidden">
                    {settings.general.logoUrl ? (
                      <img src={settings.general.logoUrl} alt="Logo Preview" className="h-10 object-contain" />
                    ) : (
                      <span className="text-[11px] text-[var(--muted)] italic">Using default BrandMark logo</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <label className={cn(
                      "relative inline-flex h-9 items-center justify-center rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] px-4 text-xs font-bold text-white shadow-sm transition duration-200 cursor-pointer",
                      uploadingAsset !== "" && "opacity-50 pointer-events-none"
                    )}>
                      {uploadingAsset === "logo" ? "Uploading..." : "Upload Logo"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleBrandingUpload(e, "logo")}
                        disabled={uploadingAsset !== ""}
                        className="hidden"
                      />
                    </label>

                    {settings.general.logoUrl && (
                      <>
                        <a
                          href={settings.general.logoUrl}
                          download="logo"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-xs font-bold text-[var(--text)] hover:bg-[var(--surface)] transition duration-200"
                        >
                          Download
                        </a>
                        <button
                          type="button"
                          onClick={() => updateSection("general", "logoUrl", "")}
                          className="inline-flex h-9 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 px-4 text-xs font-bold text-red-500 hover:bg-red-500/10 transition duration-200 cursor-pointer"
                        >
                          Reset
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Favicon Manager */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">Favicon Icon</h4>
                    <p className="text-[10px] text-[var(--muted)] mt-0.5">Recommended: 32x32 px or 512x512 px, PNG or SVG. Max 500KB.</p>
                  </div>

                  <div className="flex h-16 w-full items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-soft)] overflow-hidden">
                    {settings.general.faviconUrl ? (
                      <img src={settings.general.faviconUrl} alt="Favicon Preview" className="h-8 w-8 object-contain" />
                    ) : (
                      <img src="/favicon.ico" alt="Default Favicon" className="h-8 w-8 object-contain opacity-50" />
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <label className={cn(
                      "relative inline-flex h-9 items-center justify-center rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] px-4 text-xs font-bold text-white shadow-sm transition duration-200 cursor-pointer",
                      uploadingAsset !== "" && "opacity-50 pointer-events-none"
                    )}>
                      {uploadingAsset === "favicon" ? "Uploading..." : "Upload Favicon"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleBrandingUpload(e, "favicon")}
                        disabled={uploadingAsset !== ""}
                        className="hidden"
                      />
                    </label>

                    <a
                      href={settings.general.faviconUrl || "/favicon.ico"}
                      download="favicon"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-xs font-bold text-[var(--text)] hover:bg-[var(--surface)] transition duration-200"
                    >
                      Download Current
                    </a>

                    {settings.general.faviconUrl && (
                      <button
                        type="button"
                        onClick={() => updateSection("general", "faviconUrl", "")}
                        className="inline-flex h-9 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 px-4 text-xs font-bold text-red-500 hover:bg-red-500/10 transition duration-200 cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </SettingsSection>

            <SettingsSection
              title="Custom Scripts"
              description="Manage verification tags, analytics, chat widgets, and other third-party snippets from one place."
            >
              <div className="grid gap-4">
                <SectionField
                  label="Head Script"
                  hint="Loads inside the document head. Useful for verification tags and early-loading analytics."
                >
                  <ScriptTextarea
                    value={settings.general.customHeadScript}
                    onChange={(event) => updateSection("general", "customHeadScript", event.target.value)}
                    placeholder={`<script>console.log("Head script")</script>`}
                  />
                </SectionField>
                <div className="grid gap-4 lg:grid-cols-2">
                  <SectionField
                    label="Body Start Script"
                    hint="Appears right after the opening body tag. Good for noscript tags and tag manager body snippets."
                  >
                    <ScriptTextarea
                      value={settings.general.customBodyStartScript}
                      onChange={(event) => updateSection("general", "customBodyStartScript", event.target.value)}
                      placeholder={`<script>console.log("Body start")</script>`}
                    />
                  </SectionField>
                  <SectionField
                    label="Body End Script"
                    hint="Renders before the closing body tag. Good for chat widgets and deferred tracking."
                  >
                    <ScriptTextarea
                      value={settings.general.customBodyEndScript}
                      onChange={(event) => updateSection("general", "customBodyEndScript", event.target.value)}
                      placeholder={`<script>console.log("Body end")</script>`}
                    />
                  </SectionField>
                </div>
              </div>
            </SettingsSection>
          </div>
        </SettingsCard>
      ) : null}

      {activeTab === "countries" ? (
        <SettingsCard
          title="Countries"
          description="Manage the country options shown in admin and public selectors."
          onSaveLabel={{
            onClick: () => persistGeneralSettings(settings.general, "Countries saved."),
            disabled: savingSection === "general",
            label: savingSection === "general" ? "Saving..." : "Save",
          }}
        >
          <div className="grid gap-4 md:col-span-2">
            <SettingsSection
              title="Available Countries"
              description="Default country stays on `/`, while every other country uses its own URL prefix like `/gb` or `/ae`."
            >
              <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-[140px_1fr_auto]">
                  <Input
                    value={newCountryCode}
                    onChange={(event) => setNewCountryCode(event.target.value.toUpperCase())}
                    placeholder="PK"
                    maxLength={2}
                  />
                  <Input
                    value={newCountryName}
                    onChange={(event) => setNewCountryName(event.target.value)}
                    placeholder="Pakistan"
                  />
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--surface-soft)]"
                    onClick={handleAddCountry}
                  >
                    Add Country
                  </button>
                </div>

                <div className="grid gap-2.5">
                  {countries.map((country) => (
                    <div
                      key={country.code}
                      className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:bg-[var(--surface-soft)]/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={country.flagUrl || `https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                          alt=""
                          className="h-3.5 w-5 object-cover rounded-[1px] border border-white/10 shrink-0"
                        />
                        <div>
                          <p className="text-xs font-bold text-[var(--text)]">{country.name}</p>
                          <p className="text-[10px] text-[var(--muted)] font-mono">
                            {country.code}{country.code === DEFAULT_COUNTRY_CODE ? " · default" : ""}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-xs font-bold text-[var(--muted)] transition hover:text-red-600 hover:bg-red-500/5 hover:border-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        onClick={() => setCountryDeleteTarget(country)}
                        disabled={country.code === DEFAULT_COUNTRY_CODE}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </SettingsSection>
          </div>
        </SettingsCard>
      ) : null}

      {activeTab === "affiliate" ? (
        <SettingsCard
          title="Affiliate Networks"
          description="Network connections and sync defaults."
          onSaveLabel={{
            onClick: () => saveSection("affiliate", "Affiliate network"),
            disabled: savingSection === "affiliate",
            label: savingSection === "affiliate" ? "Saving..." : "Save",
          }}
        >
          <SectionField label="CJ Account ID" hint="Leave blank if not connected.">
            <Input
              value={settings.affiliate.cjAccount}
              onChange={(event) => updateSection("affiliate", "cjAccount", event.target.value)}
              placeholder="CJ publisher account"
            />
          </SectionField>
          <SectionField label="Rakuten Account ID">
            <Input
              value={settings.affiliate.rakutenAccount}
              onChange={(event) => updateSection("affiliate", "rakutenAccount", event.target.value)}
              placeholder="Rakuten account"
            />
          </SectionField>
          <SectionField label="Impact Account ID">
            <Input
              value={settings.affiliate.impactAccount}
              onChange={(event) => updateSection("affiliate", "impactAccount", event.target.value)}
              placeholder="Impact account"
            />
          </SectionField>
          <SectionField label="Sync Frequency">
            <select
              className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm text-[var(--text)] outline-none"
              value={settings.affiliate.syncFrequency}
              onChange={(event) => updateSection("affiliate", "syncFrequency", event.target.value)}
            >
              <option>Every hour</option>
              <option>Every 6 hours</option>
              <option>Daily</option>
              <option>Manual only</option>
            </select>
          </SectionField>
          <div className="grid gap-3 md:col-span-2 sm:grid-cols-3">
            {[
              ["cjEnabled", "CJ Affiliate"],
              ["rakutenEnabled", "Rakuten"],
              ["impactEnabled", "Impact"],
            ].map(([key, label]) => (
              <label
                key={key}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/60 px-4 py-3 text-xs text-[var(--text)] cursor-pointer hover:bg-[var(--surface-soft)] transition-colors"
              >
                <span className="font-bold">{label}</span>
                <input
                  type="checkbox"
                  className="accent-[var(--color-primary)] h-4 w-4 cursor-pointer"
                  checked={settings.affiliate[key]}
                  onChange={(event) => updateSection("affiliate", key, event.target.checked)}
                />
              </label>
            ))}
          </div>
        </SettingsCard>
      ) : null}

      {activeTab === "social" ? (
        <SettingsCard
          title="Social Media"
          description="Brand profiles and sharing defaults."
          onSaveLabel={{
            onClick: () => saveSection("social", "Social media"),
            disabled: savingSection === "social",
            label: savingSection === "social" ? "Saving..." : "Save",
          }}
        >
          <SectionField label="Facebook URL">
            <Input
              value={settings.social.facebook}
              onChange={(event) => updateSection("social", "facebook", event.target.value)}
              placeholder="https://facebook.com/..."
            />
          </SectionField>
          <SectionField label="Instagram URL">
            <Input
              value={settings.social.instagram}
              onChange={(event) => updateSection("social", "instagram", event.target.value)}
              placeholder="https://instagram.com/..."
            />
          </SectionField>
          <SectionField label="X URL">
            <Input
              value={settings.social.x}
              onChange={(event) => updateSection("social", "x", event.target.value)}
              placeholder="https://x.com/..."
            />
          </SectionField>
          <SectionField label="TikTok URL">
            <Input
              value={settings.social.tiktok}
              onChange={(event) => updateSection("social", "tiktok", event.target.value)}
              placeholder="https://tiktok.com/@..."
            />
          </SectionField>
          <SectionField label="YouTube URL">
            <Input
              value={settings.social.youtube}
              onChange={(event) => updateSection("social", "youtube", event.target.value)}
              placeholder="https://youtube.com/..."
            />
          </SectionField>
          <SectionField label="Discord URL">
            <Input
              value={settings.social.discord}
              onChange={(event) => updateSection("social", "discord", event.target.value)}
              placeholder="https://discord.gg/..."
            />
          </SectionField>
          <SectionField label="Pinterest URL">
            <Input
              value={settings.social.pinterest}
              onChange={(event) => updateSection("social", "pinterest", event.target.value)}
              placeholder="https://pinterest.com/..."
            />
          </SectionField>
          <SectionField label="Default Share Copy" hint="Used in promotional and social sharing flows.">
            <textarea
              rows={4}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
              value={settings.social.defaultShareText}
              onChange={(event) => updateSection("social", "defaultShareText", event.target.value)}
            />
          </SectionField>
        </SettingsCard>
      ) : null}

      {activeTab === "seo" ? (
        <SettingsCard
          title="SEO Defaults"
          description="Global templates for metadata and indexing."
          onSaveLabel={{
            onClick: () => saveSection("seo", "SEO"),
            disabled: savingSection === "seo",
            label: savingSection === "seo" ? "Saving..." : "Save",
          }}
        >
          <SectionField label="Title Template">
            <Input
              value={settings.seo.titleTemplate}
              onChange={(event) => updateSection("seo", "titleTemplate", event.target.value)}
            />
          </SectionField>
          <SectionField label="Robots">
            <Input
              value={settings.seo.robots}
              onChange={(event) => updateSection("seo", "robots", event.target.value)}
            />
          </SectionField>
          <SectionField label="Meta Description" hint="Used as a fallback when a page does not define its own description.">
            <textarea
              rows={4}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
              value={settings.seo.metaDescription}
              onChange={(event) => updateSection("seo", "metaDescription", event.target.value)}
            />
          </SectionField>
          <SectionField
            label="Auto-Generate Store Metadata"
            hint="When enabled, each store page automatically uses the highest percentage found in its live deals or coupons for the meta title."
          >
            <label className="flex h-11 items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/60 px-4 text-xs text-[var(--text)] cursor-pointer hover:bg-[var(--surface-soft)] transition-colors">
              <span className="font-semibold">Enable automatic store meta titles</span>
              <input
                type="checkbox"
                className="accent-[var(--color-primary)] h-4 w-4 cursor-pointer"
                checked={Boolean(settings.seo.autoGenerateStoreMetadata)}
                onChange={(event) => updateSection("seo", "autoGenerateStoreMetadata", event.target.checked)}
              />
            </label>
          </SectionField>
          <SectionField
            label="Store Title Template"
            hint="Available tokens: %store%, %best_discount%, %best_offer%, %offers_count%, %coupons_count%, %deals_count%, %year%. Example: Nike 20% Off Discount & Coupon Codes 2026."
          >
            <Input
              value={settings.seo.storeMetaTitleTemplate}
              onChange={(event) => updateSection("seo", "storeMetaTitleTemplate", event.target.value)}
            />
          </SectionField>
          <SectionField
            label="Store Description Template"
            hint="Used for automatic store meta descriptions. Same tokens as the title template."
          >
            <textarea
              rows={4}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
              value={settings.seo.storeMetaDescriptionTemplate}
              onChange={(event) => updateSection("seo", "storeMetaDescriptionTemplate", event.target.value)}
            />
          </SectionField>
          <SectionField label="Open Graph Title">
            <Input
              value={settings.seo.ogTitle}
              onChange={(event) => updateSection("seo", "ogTitle", event.target.value)}
            />
          </SectionField>
          <SectionField label="Open Graph Description" hint="Fallback social description.">
            <textarea
              rows={4}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
              value={settings.seo.ogDescription}
              onChange={(event) => updateSection("seo", "ogDescription", event.target.value)}
            />
          </SectionField>
        </SettingsCard>
      ) : null}

      {activeTab === "users" ? (
        <AdminUsersManager />
      ) : null}

      {activeTab === "verification" ? (
        <Card>
          <CardHeader className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 p-6">
            <div>
              <CardTitle className="text-base font-bold tracking-tight text-[var(--text)]">
                Verification File Upload
              </CardTitle>
              <CardDescription className="text-xs text-[var(--muted)] mt-0.5">
                Upload Google/Bing verification files (`.html` or `.txt`). They are saved in `public/` and become available at `https://your-domain.com/file-name.html`.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/30 overflow-hidden p-5">
              <label className="grid gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                  Upload `.html` or `.txt` file
                </span>
                <div className="relative flex items-center">
                  <input
                    type="file"
                    accept=".html,.txt"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-xs text-[var(--text)] outline-none file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[var(--color-primary)]/10 file:text-[var(--color-primary)] hover:file:bg-[var(--color-primary)]/20 cursor-pointer disabled:opacity-50"
                  />
                </div>
                <span className="text-[11px] text-[var(--muted)] leading-relaxed">
                  Allowed: `.html` or `.txt`, max size 1MB.
                </span>
              </label>
            </div>

            <div className="space-y-3 pb-4 border-b border-[var(--border)]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                System SEO & LLM Files
              </h4>
              <div className="grid gap-2">
                {/* sitemap.xml */}
                <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:bg-[var(--surface-soft)]/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-[var(--surface-soft)] flex items-center justify-center text-[var(--color-primary)] shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--text)]">sitemap.xml</p>
                      <p className="text-[10px] text-[var(--muted)]">Dynamic SEO Site Index · Auto-Generated</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href="/sitemap.xml"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-xs font-bold text-[var(--text)] transition hover:bg-[var(--surface-soft)]"
                    >
                      Open
                    </a>
                    <button
                      type="button"
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-xs font-bold text-[var(--text)] transition hover:bg-[var(--surface-soft)] cursor-pointer"
                      onClick={() => handleDownloadFile("sitemap.xml")}
                    >
                      Download
                    </button>
                  </div>
                </div>

                {/* llms.txt */}
                <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:bg-[var(--surface-soft)]/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-[var(--surface-soft)] flex items-center justify-center text-[var(--color-primary)] shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--text)]">llms.txt</p>
                      <p className="text-[10px] text-[var(--muted)]">AI / LLM Search Index · Static</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href="/llms.txt"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-xs font-bold text-[var(--text)] transition hover:bg-[var(--surface-soft)]"
                    >
                      Open
                    </a>
                    <button
                      type="button"
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-xs font-bold text-[var(--text)] transition hover:bg-[var(--surface-soft)] cursor-pointer"
                      onClick={() => handleDownloadFile("llms.txt")}
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                Uploaded verification files
              </h4>
              
              {verificationFiles.length === 0 ? (
                <div className="text-center py-6 text-xs text-[var(--muted)] rounded-xl border border-dashed border-[var(--border)]">
                  No verification files uploaded yet.
                </div>
              ) : (
                <div className="grid gap-2">
                  {verificationFiles.map((file) => (
                    <div
                      key={file.name}
                      className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:bg-[var(--surface-soft)]/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[var(--surface-soft)] flex items-center justify-center text-[var(--color-primary)] shrink-0">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            className="h-4 w-4"
                          >
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--text)]">{file.name}</p>
                          <p className="text-[10px] text-[var(--muted)]">
                            {(file.size / 1024).toFixed(2)} KB · {new Date(file.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`/${file.name}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-xs font-bold text-[var(--text)] transition hover:bg-[var(--surface-soft)]"
                        >
                          Open
                        </a>
                        <button
                          type="button"
                          className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-xs font-bold text-[var(--text)] transition hover:bg-[var(--surface-soft)] cursor-pointer"
                          onClick={() => handleDownloadFile(file.name)}
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-xs font-bold text-[var(--text)] transition hover:bg-[var(--surface-soft)] cursor-pointer disabled:opacity-50"
                          onClick={() => triggerUpdateFile(file)}
                          disabled={isUploading}
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-xs font-bold text-[var(--muted)] transition hover:text-red-600 hover:bg-red-500/5 hover:border-red-500/20 cursor-pointer"
                          onClick={() => setDeleteTargetFile(file)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hidden File Input for Updates */}
            <input
              type="file"
              accept=".html,.txt"
              ref={updateFileInputRef}
              onChange={handleUpdateFileChange}
              disabled={isUploading}
              className="hidden"
            />
          </CardContent>
        </Card>
      ) : null}

      <ConfirmModal
        open={Boolean(countryDeleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setCountryDeleteTarget(null);
          }
        }}
        title="Delete country"
        description={
          countryDeleteTarget
            ? `Remove ${countryDeleteTarget.name} (${countryDeleteTarget.code}) from the available country list?`
            : ""
        }
        confirmLabel="Delete Country"
        cancelLabel="Cancel"
        onConfirm={handleRemoveCountryConfirmed}
        isSubmitting={savingSection === "general"}
      />

      <ConfirmModal
        open={Boolean(deleteTargetFile)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTargetFile(null);
          }
        }}
        title="Delete verification file"
        description={
          deleteTargetFile
            ? `Are you sure you want to permanently delete the verification file "${deleteTargetFile.name}"? This file will no longer be accessible.`
            : ""
        }
        confirmLabel="Delete File"
        cancelLabel="Cancel"
        onConfirm={handleDeleteFileConfirmed}
        isSubmitting={isUploading}
      />
    </div>
  );
}
