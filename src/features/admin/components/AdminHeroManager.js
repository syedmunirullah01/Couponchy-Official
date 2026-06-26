"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const initialHeroState = {
  eyebrow: "Exclusive Daily Deals",
  titleLineOne: "Smart Shopping,",
  titleAccent: "Better Saving",
  description: "Unlock verified discounts from the world's leading brands. The smarter way to checkout.",
  searchPlaceholder: "Search stores, coupons, deals",
  searchButtonLabel: "Search Offers",
  memberCountText: "Join 126k+ members saving daily",
  cards: [],
  stats: [],
};

// Icon Helper Components
function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--color-primary)]" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z" />
    </svg>
  );
}

function StatsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#d946ef]" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function CouponIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#60a5fa]" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

// 4 Preconfigured SVG Icons mapping
const STAT_ICONS = {
  package: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="M22 12H2" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  dollar: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
};

// Parsing rotation styles to populate visual sliders
function parseRotation(rotationStr) {
  const tiltMatch = (rotationStr || "").match(/rotate\(([^)]+)deg\)/);
  const translateMatch = (rotationStr || "").match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
  
  const tilt = tiltMatch ? parseInt(tiltMatch[1], 10) : 0;
  const x = translateMatch ? parseInt(translateMatch[1], 10) : 0;
  const y = translateMatch ? parseInt(translateMatch[2], 10) : 0;
  
  return { tilt, x, y };
}

function parseMobileRotation(mobileRotationStr) {
  const tiltMatch = (mobileRotationStr || "").match(/rotate\(([^)]+)deg\)/);
  return tiltMatch ? parseInt(tiltMatch[1], 10) : 0;
}

function SectionField({ label, children, hint, required }) {
  return (
    <label className="grid gap-1.5 text-sm text-[var(--muted)]">
      <span className="font-semibold text-[var(--text)] flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {hint ? <span className="text-[11px] text-[var(--muted)]/80 leading-normal">{hint}</span> : null}
    </label>
  );
}

function SettingsSection({ title, description, icon, children }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/20 p-5 sm:p-6 transition-all hover:bg-[var(--surface-soft)]/30 backdrop-blur-md">
      <div className="mb-5 flex items-start gap-3">
        {icon ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-black/40">
            {icon}
          </div>
        ) : null}
        <div>
          <p className="text-base font-extrabold text-[var(--text)] tracking-tight">{title}</p>
          {description ? <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed">{description}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" className="stroke-current opacity-25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" className="stroke-current" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function AdminHeroManager() {
  const [hero, setHero] = useState(initialHeroState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [advancedMode, setAdvancedMode] = useState({});

  useEffect(() => {
    let active = true;

    async function loadHero() {
      try {
        const response = await fetch("/api/homepage/hero", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load hero settings.");
        }

        if (active) {
          const loadedHero = payload.data || {};
          if (!loadedHero.cards) {
            loadedHero.cards = [];
          }
          if (!loadedHero.stats) {
            loadedHero.stats = [];
          }
          setHero({ ...initialHeroState, ...loadedHero });
        }
      } catch (error) {
        toast.error(error.message);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadHero();

    return () => {
      active = false;
    };
  }, []);

  function updateHeroField(field, value) {
    setHero((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateHeroCard(index, field, value) {
    setHero((current) => ({
      ...current,
      cards: current.cards.map((card, cardIndex) =>
        cardIndex === index ? { ...card, [field]: value } : card
      ),
    }));
  }

  function handleSliderChange(index, parameter, val) {
    setHero((current) => {
      const card = current.cards[index];
      if (!card) return current;

      const parsed = parseRotation(card.rotation);
      let newRotation = card.rotation;
      let newMobileRotation = card.mobileRotation;

      if (parameter === "tilt") {
        newRotation = `rotate(${val}deg) translate(${parsed.x}px, ${parsed.y}px)`;
      } else if (parameter === "x") {
        newRotation = `rotate(${parsed.tilt}deg) translate(${val}px, ${parsed.y}px)`;
      } else if (parameter === "y") {
        newRotation = `rotate(${parsed.tilt}deg) translate(${parsed.x}px, ${val}px)`;
      } else if (parameter === "mobileTilt") {
        newMobileRotation = `rotate(${val}deg)`;
      }

      return {
        ...current,
        cards: current.cards.map((c, cardIndex) =>
          cardIndex === index ? { ...c, rotation: newRotation, mobileRotation: newMobileRotation } : c
        ),
      };
    });
  }

  function updateHeroStat(index, field, value) {
    setHero((current) => ({
      ...current,
      stats: (current.stats || []).map((stat, statIndex) =>
        statIndex === index ? { ...stat, [field]: value } : stat
      ),
    }));
  }

  function toggleAdvancedMode(index) {
    setAdvancedMode((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  }

  function addHeroCard() {
    setHero((current) => {
      const cardCount = current.cards.length;
      const defaultRotations = [
        "rotate(-6deg) translate(0px, 0px)",
        "rotate(3deg) translate(40px, 60px)",
        "rotate(-2deg) translate(70px, 130px)",
      ];
      const defaultMobileRotations = ["rotate(-4deg)", "rotate(2deg)", "rotate(-1deg)"];

      return {
        ...current,
        cards: [
          ...current.cards,
          {
            id: `card-${Date.now()}`,
            amount: "20% OFF",
            max: "MAX $15.00",
            category: "PROMO",
            title: "New Seasonal Discount Code",
            tag: "EXPIRES SOON",
            verified: true,
            rotation: defaultRotations[cardCount % 3] || "rotate(0deg)",
            mobileRotation: defaultMobileRotations[cardCount % 3] || "rotate(0deg)",
            zIndex: cardCount + 1,
          },
        ],
      };
    });
  }

  function removeHeroCard(index) {
    setHero((current) => ({
      ...current,
      cards: current.cards.filter((_, cardIndex) => cardIndex !== index),
    }));
  }

  function moveHeroCard(index, direction) {
    setHero((current) => {
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= current.cards.length) {
        return current;
      }

      const nextCards = [...current.cards];
      const [movedCard] = nextCards.splice(index, 1);
      nextCards.splice(nextIndex, 0, movedCard);

      // Re-assign z-indexes based on new array order (first item lowest, last item highest)
      const reindexedCards = nextCards.map((c, i) => ({
        ...c,
        zIndex: i + 1,
      }));

      return {
        ...current,
        cards: reindexedCards,
      };
    });
  }

  async function saveHero() {
    try {
      setIsSaving(true);
      const response = await fetch("/api/homepage/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hero }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to save hero settings.");
      }

      const savedHero = payload.data || {};
      if (!savedHero.cards) {
        savedHero.cards = [];
      }
      if (!savedHero.stats) {
        savedHero.stats = [];
      }
      setHero(savedHero);
      toast.success("Hero settings saved.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="border-[var(--border)] bg-black/40">
        <CardContent className="py-20 text-center text-sm text-[var(--muted)] flex flex-col items-center gap-4 justify-center">
          <Spinner />
          <span>Loading hero settings...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[var(--border)] bg-black/20 overflow-hidden shadow-2xl">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-[var(--border)] bg-black/40 p-6">
        <div>
          <CardTitle className="text-xl font-extrabold text-white flex items-center gap-2">
            <span className="text-[var(--color-primary)]">♦</span> Homepage Hero Customizer
          </CardTitle>
          <CardDescription className="text-xs text-[var(--muted)] mt-1">
            Visual editor to control text headings, live stats, and floating coupon layers.
          </CardDescription>
        </div>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={saveHero} 
          disabled={isSaving} 
          leadingIcon={isSaving ? <Spinner /> : null}
          className="bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary-hover)] border-none font-bold px-6 py-2 shadow-lg shadow-lime-500/10 hover:shadow-lime-500/25 transition-all duration-300"
        >
          {isSaving ? "Saving changes..." : "Save Hero Settings"}
        </Button>
      </CardHeader>
      <CardContent className="grid gap-8 p-6">
        
        {/* Left Side Content Section */}
        <SettingsSection
          title="1. Main Header & Hero Copy"
          description="Edit text content on the left side of the hero section. Dynamic preview updates automatically."
          icon={<EditIcon />}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <SectionField label="Eyebrow Badge" hint="Uppercase kicker text shown at the top.">
              <Input value={hero.eyebrow} onChange={(event) => updateHeroField("eyebrow", event.target.value)} />
            </SectionField>
            <SectionField label="Search Placeholder" hint="Placeholder text inside search bar.">
              <Input value={hero.searchPlaceholder} onChange={(event) => updateHeroField("searchPlaceholder", event.target.value)} />
            </SectionField>
            <SectionField label="Main Title Line" hint="Large white headline text.">
              <Input value={hero.titleLineOne} onChange={(event) => updateHeroField("titleLineOne", event.target.value)} />
            </SectionField>
            <SectionField label="Highlighted Accent Title" hint="Colored bottom row text.">
              <Input value={hero.titleAccent} onChange={(event) => updateHeroField("titleAccent", event.target.value)} />
            </SectionField>
            <SectionField label="Search Button Label" hint="Text on the search CTA button.">
              <Input value={hero.searchButtonLabel} onChange={(event) => updateHeroField("searchButtonLabel", event.target.value)} />
            </SectionField>
            <SectionField label="Member Count Text" hint="Bottom sub-badge or verification text.">
              <Input value={hero.memberCountText} onChange={(event) => updateHeroField("memberCountText", event.target.value)} />
            </SectionField>
            <div className="md:col-span-2">
              <SectionField label="Hero Description Paragraph" hint="Main supporting text underneath the large headline.">
                <textarea
                  rows={3}
                  className="w-full rounded-2xl border border-[var(--border)] bg-black/40 px-4 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--color-primary)] transition-colors focus:ring-1 focus:ring-[var(--color-primary)]/20"
                  value={hero.description}
                  onChange={(event) => updateHeroField("description", event.target.value)}
                />
              </SectionField>
            </div>
          </div>
        </SettingsSection>

        {/* Hero Stats Bar Section */}
        <SettingsSection
          title="2. Verification Stats Bar"
          description="Manage the 4 highlighted stat grids shown at the bottom. Check/uncheck 'Accent' to apply neon glows."
          icon={<StatsIcon />}
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(hero.stats || []).map((stat, index) => {
              // Custom gradient color classes based on index to look extremely rich
              const colors = [
                "from-[#8b5cf6]/15 to-transparent border-[#8b5cf6]/20 hover:border-[#8b5cf6]/40",
                "from-[#d946ef]/15 to-transparent border-[#d946ef]/20 hover:border-[#d946ef]/40",
                "from-[#60a5fa]/15 to-transparent border-[#60a5fa]/20 hover:border-[#60a5fa]/40",
                "from-[#f59e0b]/15 to-transparent border-[#f59e0b]/20 hover:border-[#f59e0b]/40",
              ];
              const glowText = [
                "text-[#8b5cf6] [text-shadow:0_0_12px_rgba(139, 92, 246,0.3)]",
                "text-[#d946ef] [text-shadow:0_0_12px_rgba(190,242,100,0.3)]",
                "text-[#60a5fa] [text-shadow:0_0_12px_rgba(96,165,250,0.3)]",
                "text-[#f59e0b] [text-shadow:0_0_12px_rgba(245,158,11,0.3)]",
              ];

              return (
                <div 
                  key={index} 
                  className={`rounded-2xl border bg-gradient-to-b ${colors[index % 4]} p-4 flex flex-col gap-4 shadow-lg transition-all duration-300`}
                >
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/50">Column {index + 1}</p>
                    
                    {/* Tiny inline visual mockup of the stats box inside the editor card! */}
                    <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-1 text-[9px] border border-white/5">
                      <span className={stat.accent ? "text-[var(--color-primary)]" : "text-white/50"}>
                        {STAT_ICONS[stat.icon || "package"]}
                      </span>
                      <span className="font-extrabold text-white">{stat.value || "0"}</span>
                    </div>
                  </div>

                  <SectionField label="Stat Value" hint="e.g. 612K+ or 98%">
                    <Input 
                      className="bg-black/50 border-white/10 text-white font-black"
                      value={stat.value || ""} 
                      onChange={(event) => updateHeroStat(index, "value", event.target.value)} 
                    />
                  </SectionField>
                  <SectionField label="Label / Description" hint="e.g. Stores Verified">
                    <Input 
                      className="bg-black/50 border-white/10 text-white/80"
                      value={stat.label || ""} 
                      onChange={(event) => updateHeroStat(index, "label", event.target.value)} 
                    />
                  </SectionField>
                  <SectionField label="Icon SVG representation">
                    <select
                      value={stat.icon || "package"}
                      onChange={(event) => updateHeroStat(index, "icon", event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white outline-none focus:border-[var(--color-primary)] cursor-pointer"
                    >
                      <option value="package">📦 Box / Package (Stores)</option>
                      <option value="check">✅ Checkmark Badge (Accuracy)</option>
                      <option value="globe">🌐 Globe / Earth (Verifications)</option>
                      <option value="dollar">💵 Dollar Sign (Checkout savings)</option>
                    </select>
                  </SectionField>
                  
                  <div className="flex items-center gap-2 mt-1 bg-black/30 rounded-lg p-2 border border-white/5 cursor-pointer hover:bg-black/50 transition-colors">
                    <input
                      type="checkbox"
                      id={`stat-accent-${index}`}
                      checked={stat.accent || false}
                      onChange={(event) => updateHeroStat(index, "accent", event.target.checked)}
                      className="h-3.5 w-3.5 rounded border-white/10 text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer bg-black/50"
                    />
                    <label htmlFor={`stat-accent-${index}`} className="text-[11px] font-extrabold text-white/80 cursor-pointer select-none">
                      Enable Neon Accent Glow
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </SettingsSection>

        {/* Floating Coupon Cards Section */}
        <SettingsSection
          title="3. Floating Coupon Cards Deck"
          description="Tilt, shift, stack, and edit the overlaying cards. Drag sliders to adjust X/Y positioning and tilt angles visually."
          icon={<CouponIcon />}
        >
          <div className="mb-6 flex flex-col items-center justify-between gap-4 md:flex-row border-b border-[var(--border)] pb-4">
            <div>
              <p className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-lime-500 animate-pulse" /> Interactive Deck Manager
              </p>
              <p className="text-xs text-[var(--muted)]">Hover cards in the live deck below to inspect their stack layering and visual placements.</p>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addHeroCard}
              className="border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold text-xs"
            >
              + Add New Coupon Card
            </Button>
          </div>

          {/* Premium Live Visual Preview */}
          {hero.cards && hero.cards.length > 0 && (
            <div className="mb-8 flex flex-col items-center justify-center rounded-3xl border border-[var(--border)] bg-gradient-to-b from-black/80 to-neutral-900/60 py-12 px-6 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_40%,rgba(139, 92, 246,0.06),transparent)] pointer-events-none" />
              <p className="mb-10 self-start text-[10px] font-extrabold uppercase tracking-[0.25em] text-[var(--color-primary)] flex items-center gap-2 z-10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500"></span>
                </span>
                Interactive Deck Canvas (Real-time Preview)
              </p>
              
              <div 
                style={{
                  position: "relative",
                  height: `${230 + hero.cards.length * 45}px`,
                  width: "280px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-start",
                }}
                className="z-10"
              >
                {hero.cards.map((card, i) => (
                  <div
                    key={card.id || i}
                    className="hover:scale-105 hover:-translate-y-2 transition-all duration-300"
                    style={{
                      position: "absolute",
                      top: `${i * 52}px`,
                      left: `${i * 18}px`,
                      width: "240px",
                      background: "rgba(18,18,18,0.94)",
                      border: `1px solid ${card.verified ? "rgba(139, 92, 246,0.3)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: "20px",
                      padding: "18px",
                      transform: card.rotation || "rotate(0deg)",
                      zIndex: card.zIndex || (i + 1),
                      boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)",
                      cursor: "grab",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div className="text-left">
                        <div style={{ fontSize: "20px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.03em" }}>
                          {card.amount || "10% OFF"}
                        </div>
                        <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", marginTop: "2px", fontWeight: 600 }}>
                          {card.max || "NO MINIMUM"}
                        </div>
                      </div>
                      <span
                        style={{
                          background: "rgba(139, 92, 246,0.12)",
                          border: "1px solid rgba(139, 92, 246,0.25)",
                          color: "var(--color-primary)",
                          fontSize: "8px",
                          fontWeight: 900,
                          padding: "3px 8px",
                          borderRadius: "6px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {card.category || "DEAL"}
                      </span>
                    </div>
                    <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", marginBottom: "10px" }} />
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)", fontWeight: 700, marginBottom: "12px", textAlign: "left", lineHeight: 1.4 }}>
                      {card.title || "Coupon Title"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span
                        style={{
                          fontSize: "8px",
                          color: card.verified ? "var(--color-primary)" : "rgba(255,255,255,0.3.5)",
                          display: "flex",
                          alignItems: "center",
                          gap: "3.5px",
                          fontWeight: 800,
                          letterSpacing: "0.05em",
                        }}
                      >
                        {card.verified && (
                          <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="currentColor">
                            <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.646 6.354-4 4a.5.5 0 0 1-.707 0l-2-2a.5.5 0 0 1 .707-.707L7.293 9.293l3.647-3.647a.5.5 0 0 1 .707.707z" />
                          </svg>
                        )}
                        {card.tag || "VERIFIED"}
                      </span>
                      {card.verified && (
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: "var(--color-primary)",
                            boxShadow: "0 0 8px rgba(139, 92, 246,0.8)",
                            display: "inline-block",
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cards Form List */}
          <div className="space-y-6">
            {hero.cards.map((card, index) => {
              const isAdvanced = advancedMode[index] || false;
              const parsedRot = parseRotation(card.rotation);
              const parsedMobileTilt = parseMobileRotation(card.mobileRotation);

              // Visual colors based on card stack index
              const borderColors = [
                "border-lime-500/20 hover:border-lime-500/40 bg-lime-950/5",
                "border-blue-500/20 hover:border-blue-500/40 bg-blue-950/5",
                "border-amber-500/20 hover:border-amber-500/40 bg-amber-950/5",
              ];

              return (
                <Card 
                  key={card.id || index} 
                  className={`border ${borderColors[index % 3]} bg-neutral-950/30 shadow-xl overflow-hidden transition-all duration-300`}
                >
                  <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-black/30 p-4 border-b border-white/5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                        <CardTitle className="text-sm font-extrabold text-white">Coupon Card {index + 1}</CardTitle>
                      </div>
                      <CardDescription className="text-xs text-[var(--muted)]/80 mt-0.5">
                        {card.title || "Untitled Card Offer"}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => moveHeroCard(index, -1)} 
                        disabled={index === 0}
                        className="text-xs border-white/10 hover:bg-white/5"
                      >
                        ↑ Move Up
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => moveHeroCard(index, 1)}
                        disabled={index === hero.cards.length - 1}
                        className="text-xs border-white/10 hover:bg-white/5"
                      >
                        ↓ Move Down
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleAdvancedMode(index)}
                        className={`text-xs ${isAdvanced ? "text-[var(--color-primary)]" : "text-white/60"} hover:text-white`}
                      >
                        🛠️ {isAdvanced ? "Simple Mode" : "Advanced CSS"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-950/20 text-xs" 
                        onClick={() => removeHeroCard(index)}
                      >
                        ✕ Remove Card
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-5 p-4 md:grid-cols-2 lg:grid-cols-3">
                    
                    {/* Basic Fields */}
                    <SectionField label="Discount Title / Amount" hint="e.g. 20% OFF or $50 OFF">
                      <Input value={card.amount || ""} onChange={(event) => updateHeroCard(index, "amount", event.target.value)} />
                    </SectionField>
                    <SectionField label="Discount Limit / Cap" hint="e.g. MAX $20.00 or NO MINIMUM">
                      <Input value={card.max || ""} onChange={(event) => updateHeroCard(index, "max", event.target.value)} />
                    </SectionField>
                    <SectionField label="Category Tag" hint="e.g. VAULT, TECH, FASHION">
                      <Input value={card.category || ""} onChange={(event) => updateHeroCard(index, "category", event.target.value)} />
                    </SectionField>
                    <SectionField label="Verification Tag Text" hint="e.g. VERIFIED TODAY or EXPIRES 03/17">
                      <Input value={card.tag || ""} onChange={(event) => updateHeroCard(index, "tag", event.target.value)} />
                    </SectionField>
                    
                    {/* Layer Ordering */}
                    <SectionField label="Stack Depth Order (zIndex)" hint="Higher numbers float on top.">
                      <select 
                        value={card.zIndex || (index + 1)} 
                        onChange={(event) => updateHeroCard(index, "zIndex", parseInt(event.target.value, 10) || 1)}
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-[var(--color-primary)] cursor-pointer"
                      >
                        <option value="1">1 (Lowest Layer - Bottom)</option>
                        <option value="2">2 (Middle Layer)</option>
                        <option value="3">3 (Top Layer - Front)</option>
                        <option value="4">4 (Foreground)</option>
                      </select>
                    </SectionField>

                    {/* Verification Status Checkbox */}
                    <div className="flex items-center gap-2 pt-6 bg-black/20 rounded-xl p-3 border border-white/5 cursor-pointer hover:bg-black/35 transition-colors">
                      <input 
                        type="checkbox" 
                        id={`verified-${card.id || index}`}
                        checked={card.verified || false} 
                        onChange={(event) => updateHeroCard(index, "verified", event.target.checked)}
                        className="h-4 w-4 rounded border-white/15 text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer bg-black/50"
                      />
                      <label htmlFor={`verified-${card.id || index}`} className="text-xs font-bold text-white cursor-pointer select-none">
                        Verified Status (Adds green icon & check)
                      </label>
                    </div>

                    <div className="md:col-span-2 lg:col-span-3">
                      <SectionField label="Coupon Offer Banner Title">
                        <Input value={card.title || ""} onChange={(event) => updateHeroCard(index, "title", event.target.value)} />
                      </SectionField>
                    </div>

                    {/* Visual Rotation and Translate Sliders (Simple Mode) */}
                    {!isAdvanced ? (
                      <div className="md:col-span-2 lg:col-span-3 grid gap-4 bg-black/40 p-4 rounded-2xl border border-white/5 mt-2">
                        <p className="text-xs font-bold text-white/90 flex items-center gap-1.5">
                          📐 Visual Positioning Sliders <span className="text-[10px] text-[var(--muted)] font-normal">(Updates position in real-time)</span>
                        </p>
                        
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-[var(--muted)] font-medium">
                              <span>Tilt Angle (Degrees)</span>
                              <span className="font-bold text-white">{parsedRot.tilt}°</span>
                            </div>
                            <input 
                              type="range" 
                              min="-20" 
                              max="20" 
                              value={parsedRot.tilt} 
                              onChange={(e) => handleSliderChange(index, "tilt", parseInt(e.target.value, 10))}
                              className="w-full accent-[var(--color-primary)] cursor-ew-resize h-1 bg-neutral-800 rounded-lg appearance-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-[var(--muted)] font-medium">
                              <span>Mobile Tilt (Degrees)</span>
                              <span className="font-bold text-white">{parsedMobileTilt}°</span>
                            </div>
                            <input 
                              type="range" 
                              min="-15" 
                              max="15" 
                              value={parsedMobileTilt} 
                              onChange={(e) => handleSliderChange(index, "mobileTilt", parseInt(e.target.value, 10))}
                              className="w-full accent-[#d946ef] cursor-ew-resize h-1 bg-neutral-800 rounded-lg appearance-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-[var(--muted)] font-medium">
                              <span>Horizontal Shift (X)</span>
                              <span className="font-bold text-white">{parsedRot.x}px</span>
                            </div>
                            <input 
                              type="range" 
                              min="-50" 
                              max="150" 
                              value={parsedRot.x} 
                              onChange={(e) => handleSliderChange(index, "x", parseInt(e.target.value, 10))}
                              className="w-full accent-[#60a5fa] cursor-ew-resize h-1 bg-neutral-800 rounded-lg appearance-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-[var(--muted)] font-medium">
                              <span>Vertical Shift (Y)</span>
                              <span className="font-bold text-white">{parsedRot.y}px</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="250" 
                              value={parsedRot.y} 
                              onChange={(e) => handleSliderChange(index, "y", parseInt(e.target.value, 10))}
                              className="w-full accent-[#f59e0b] cursor-ew-resize h-1 bg-neutral-800 rounded-lg appearance-none"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Raw CSS Override Inputs (Advanced Mode)
                      <div className="md:col-span-2 lg:col-span-3 grid gap-4 bg-black/40 p-4 rounded-2xl border border-red-500/10 mt-2">
                        <p className="text-xs font-bold text-red-400">⚠️ Raw CSS Style Overrides</p>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <SectionField label="CSS Desktop Transform Rule" hint="e.g. rotate(-6deg) translate(0px, 0px)">
                            <Input value={card.rotation || ""} onChange={(event) => updateHeroCard(index, "rotation", event.target.value)} />
                          </SectionField>
                          <SectionField label="CSS Mobile Transform Rule" hint="e.g. rotate(-4deg)">
                            <Input value={card.mobileRotation || ""} onChange={(event) => updateHeroCard(index, "mobileRotation", event.target.value)} />
                          </SectionField>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {(!hero.cards || hero.cards.length === 0) && (
              <div className="py-12 text-center text-sm text-[var(--muted)] border border-dashed border-[var(--border)] rounded-2xl bg-black/20">
                No coupon cards added yet. Click &quot;Add Coupon Card&quot; to create one.
              </div>
            )}
          </div>
        </SettingsSection>
      </CardContent>
    </Card>
  );
}
