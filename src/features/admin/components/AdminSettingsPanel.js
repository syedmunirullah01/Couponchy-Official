"use client";

import { useEffect, useMemo, useState } from "react";
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
  { key: "users", label: "Users & Roles" },
];

function SectionField({ label, children, hint }) {
  return (
    <label className="grid gap-2 text-sm text-[var(--muted)]">
      <span className="font-medium text-[var(--text)]">{label}</span>
      {children}
      {hint ? <span className="text-xs text-[var(--muted)]">{hint}</span> : null}
    </label>
  );
}

function SettingsCard({ title, description, children, onSaveLabel = "Save" }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {children}
        <div className="md:col-span-2">
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--surface-soft)] disabled:pointer-events-none disabled:opacity-50"
            onClick={onSaveLabel.onClick}
            disabled={onSaveLabel.disabled}
          >
            {onSaveLabel.label}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsSection({ title, description, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/35 p-4 sm:p-5 ${className}`}>
      <div className="mb-4">
        <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
        {description ? <p className="mt-1 text-xs text-[var(--muted)]">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

function ScriptTextarea({ value, onChange, placeholder }) {
  return (
    <textarea
      rows={6}
      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 font-mono text-sm text-[var(--text)] outline-none"
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
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Organize platform settings by area and save each section independently.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition",
                  activeTab === tab.key
                    ? "border-[var(--color-primary)] bg-[var(--surface-soft)] text-[var(--text)]"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)]"
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

                <div className="grid gap-3">
                  {countries.map((country) => (
                    <div
                      key={country.code}
                      className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[var(--text)]">{country.name}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {country.code} {country.code === DEFAULT_COUNTRY_CODE ? "• default country" : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="inline-flex h-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-sm text-[var(--text)] transition hover:bg-[var(--surface)] disabled:opacity-50"
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
              ["cjEnabled", "CJ"],
              ["rakutenEnabled", "Rakuten"],
              ["impactEnabled", "Impact"],
            ].map(([key, label]) => (
              <label
                key={key}
                className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)]"
              >
                <span>{label}</span>
                <input
                  type="checkbox"
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
          <SectionField label="Default Share Copy" hint="Used in promotional and social sharing flows.">
            <textarea
              rows={4}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none"
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
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none"
              value={settings.seo.metaDescription}
              onChange={(event) => updateSection("seo", "metaDescription", event.target.value)}
            />
          </SectionField>
          <SectionField
            label="Auto-Generate Store Metadata"
            hint="When enabled, each store page automatically uses the highest percentage found in its live deals or coupons for the meta title."
          >
            <label className="flex h-11 items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm text-[var(--text)]">
              <span>Enable automatic store meta titles</span>
              <input
                type="checkbox"
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
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none"
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
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none"
              value={settings.seo.ogDescription}
              onChange={(event) => updateSection("seo", "ogDescription", event.target.value)}
            />
          </SectionField>
        </SettingsCard>
      ) : null}

      {activeTab === "users" ? (
        <AdminUsersManager />
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
    </div>
  );
}
