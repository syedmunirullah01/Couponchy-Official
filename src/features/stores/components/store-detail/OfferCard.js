"use client";

import Link from "next/link";
import { buildCountryPath } from "@/lib/countries";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/lib/copyToClipboard";

function getOfferValue(offer) {
  const title = offer.title || "";
  const description = offer.description || "";
  const combined = `${title} ${description}`.toLowerCase();

  if (combined.includes("free shipping")) {
    return "Free Shipping";
  }
  if (combined.includes("free delivery")) {
    return "Free Delivery";
  }

  const source = [offer.title, offer.description, offer.code].filter(Boolean).join(" ");
  const percentMatch = source.match(/(\d{1,3})\s*%/);
  if (percentMatch) return `${percentMatch[1]}% Off`;

  const amountMatch = source.match(/\$ ?(\d[\d,]*)/);
  if (amountMatch) return `$${amountMatch[1]}`;

  return offer.type === "Deal" ? "Deal" : "Code";
}

function formatExpiry(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const now = new Date();
  const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "Expired";
  if (diffDays === 0) return "Expires today";
  if (diffDays <= 7) return `Expires in ${diffDays}d`;
  return `Expires ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

const getSeededStats = (offerId, offerTitle) => {
  const str = `${offerId || ""}-${offerTitle || ""}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const epoch = Math.floor(dayOfYear / 15);
  const seed = Math.abs(hash + year + epoch);
  const random = (max, min = 1) => {
    const x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };
  const lastUsedNum = random(23, 1);
  const unit = random(2) === 1 ? "h" : "m";
  const usesTodayNum = random(27, 3);
  return { lastUsedNum, unit, usesTodayNum };
};

export default function OfferCard({ offer, store, isFirst }) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });
  const { lastUsedNum, unit, usesTodayNum } = getSeededStats(offer.id, offer.title);

  const offerHref = offer.affiliateLink || store.affiliateLink || "#";
  const isExternal = Boolean(offer.affiliateLink || store.affiliateLink);
  const actionHref = isExternal || offerHref === "#" ? offerHref : buildCountryPath(offerHref, store.countryCode);
  const offerValue = getOfferValue(offer);
  const isCoupon = offer.type === "Coupon";
  const expiryText = formatExpiry(offer.expiryDate);

  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (!isCoupon) return;

    const calculateTargetDate = () => {
      const now = new Date();
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const targetDay = now.getDate() <= 15 ? 15 : lastDay;
      return new Date(now.getFullYear(), now.getMonth(), targetDay, 23, 59, 59);
    };

    const targetDate = calculateTargetDate();

    const updateTimer = () => {
      const difference = targetDate.getTime() - Date.now();

      if (difference <= 0) {
        setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" });
        return;
      }

      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const m = Math.floor((difference / 1000 / 60) % 60);
      const s = Math.floor((difference / 1000) % 60);

      setTimeLeft({
        days: String(d).padStart(2, "0"),
        hours: String(h).padStart(2, "0"),
        minutes: String(m).padStart(2, "0"),
        seconds: String(s).padStart(2, "0"),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isCoupon]);

  const openInBackground = (url) => {
    if (!url || url === "#") return;
    try {
      const newWin = window.open("about:blank", "_blank");
      if (newWin) {
        newWin.blur();
        window.focus();
        newWin.location.href = url;
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleReveal = (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    
    // 1. Open new tab in background to stay on Couponchy screen
    if (isExternal && actionHref !== "#") {
      let targetUrl = actionHref;
      if (actionHref && !/^https?:\/\//i.test(actionHref)) {
        targetUrl = `https://${actionHref}`;
      }
      openInBackground(targetUrl);
    }

    // 2. Perform copy & state changes
    if (isCoupon && offer.code) {
      setRevealed(true);
      copyToClipboard(offer.code).then((success) => {
        if (success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      });
    }

    // 3. Open modal overlay on current page
    setIsModalOpen(true);
  };

  const handleGetDeal = (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (isExternal && actionHref !== "#") {
      let targetUrl = actionHref;
      if (actionHref && !/^https?:\/\//i.test(actionHref)) {
        targetUrl = `https://${actionHref}`;
      }
      openInBackground(targetUrl);
    }
    setIsModalOpen(true);
  };

  const handleCardClick = (e) => {
    // If the click is inside a button or anchor tag, bypass card redirect
    if (e.target.closest("button") || e.target.closest("a")) {
      return;
    }
    if (isCoupon) {
      handleReveal(e);
    } else {
      handleGetDeal(e);
    }
  };

  return (
    <>
      <article
        onClick={handleCardClick}
        className={cn(
          "group relative overflow-hidden rounded-[24px] border border-white/[0.05] bg-gradient-to-br from-[#0c0c11] via-[#07070a] to-[#050508] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)] cursor-pointer hover:border-[var(--color-primary)]/30 hover:shadow-[0_0_30px_rgba(139,92,246,0.03)]"
        )}
      >
        {isFirst && (
          <div className="absolute top-0 left-0 rounded-br-xl bg-[var(--color-primary)] px-3 py-1 text-[10px] font-black text-black select-none z-10 shadow-[0_2px_10px_rgba(139,92,246,0.2)]">
            Top pick
          </div>
        )}
        {/* Subtle top glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/[0.03] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />

        {/* Desktop Card Layout */}
        <div className="hidden md:flex flex-row md:items-stretch">
          <div className="flex w-[150px] md:w-[195px] shrink-0 flex-col items-center justify-center border-b border-white/[0.04] px-4 py-5 text-center md:border-b-0 md:border-r bg-[var(--color-primary)]/[0.06]">
            <p className="leading-tight text-[var(--color-primary)] text-center px-1 whitespace-nowrap font-black tracking-[-0.04em] text-lg md:text-[22px]">
              {offerValue}
            </p>
            <p className="mt-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-white/30">
              {isCoupon && offerValue !== "Code" ? "code" : offer.type}
            </p>
          </div>

          {/* Middle: Info */}
          <div className="flex-1 min-w-0 px-5 py-5">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)]">
                {offer.type}
              </span>
              <span className="rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-primary)]">
                ✓ Verified
              </span>
              {offer.status && offer.status !== "Active" && (
                <span className="rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-primary)]">
                  {offer.status}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="mt-3 text-[19px] sm:text-[20px] font-black leading-snug tracking-[-0.02em] text-white/90 transition-colors duration-200 group-hover:text-white">
              {offer.title}
            </h3>

            {/* Description */}
            {offer.description && (
              <p className="mt-1.5 line-clamp-1 text-[13px] leading-5 text-white/55">
                {offer.description}
              </p>
            )}

            {/* Timer countdown (only for coupons) */}
            {isCoupon && (
              <div className="mt-4 flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-white/40">
                  <svg className="h-4 w-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Expires in:</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex flex-col items-center justify-center h-10 w-10 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] shadow-[0_0_10px_rgba(139,92,246,0.1)]">
                    <span className="text-xs font-bold leading-none">{timeLeft.days}</span>
                    <span className="text-[7px] font-extrabold tracking-wider leading-none mt-0.5 opacity-80 text-white/55">DAYS</span>
                  </div>
                  <div className="flex flex-col items-center justify-center h-10 w-10 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] shadow-[0_0_10px_rgba(139,92,246,0.1)]">
                    <span className="text-xs font-bold leading-none">{timeLeft.hours}</span>
                    <span className="text-[7px] font-extrabold tracking-wider leading-none mt-0.5 opacity-80 text-white/55">HRS</span>
                  </div>
                  <div className="flex flex-col items-center justify-center h-10 w-10 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] shadow-[0_0_10px_rgba(139,92,246,0.1)]">
                    <span className="text-xs font-bold leading-none">{timeLeft.minutes}</span>
                    <span className="text-[7px] font-extrabold tracking-wider leading-none mt-0.5 opacity-80 text-white/55">MIN</span>
                  </div>
                  <div className="flex flex-col items-center justify-center h-10 w-10 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] shadow-[0_0_10px_rgba(139,92,246,0.1)]">
                    <span className="text-xs font-bold leading-none">{timeLeft.seconds}</span>
                    <span className="text-[7px] font-extrabold tracking-wider leading-none mt-0.5 opacity-80 text-white/55">SEC</span>
                  </div>
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-[11.5px] font-bold text-white/35">
              <div className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span>Last used: <strong className="text-white/60 font-bold">{lastUsedNum}{unit} ago</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0 1 10.025 20a11.38 11.38 0 0 1-4.99-.94v-.11c0-2.28 1.85-4.13 4.13-4.13h1.696c.484 0 .942.083 1.37.234m0 0a3.001 3.001 0 1 0 0-3.006A4.125 4.125 0 0 0 9 12.75a4.125 4.125 0 0 0-4.125 4.125v1.442" />
                </svg>
                <span>Uses today: <strong className="text-[var(--color-primary)] font-black">{usesTodayNum}</strong></span>
              </div>
            </div>
          </div>

          {/* Right: CTA */}
          <div className="flex w-full md:w-[200px] shrink-0 items-center justify-center border-t border-white/[0.04] px-4 py-4 md:border-t-0 md:border-l">
            {isCoupon && offer.code ? (
              <div className="flex w-full flex-col items-center gap-2">
                {revealed ? (
                  <button
                    onClick={() => {
                      copyToClipboard(offer.code).then((success) => {
                        if (success) {
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }
                      });
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-4 py-3 cursor-pointer hover:bg-[var(--color-primary)]/15 transition-all duration-200"
                  >
                    <span className="font-mono text-sm font-black tracking-widest text-[var(--color-primary)]">
                      {offer.code}
                    </span>
                    <span className="text-xs font-bold text-[var(--color-primary)]">
                      {copied ? "Copied!" : "Copy"}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={handleReveal}
                    className="group/cta relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-[var(--color-primary)] px-4 py-3 text-[12.5px] font-black uppercase tracking-[0.14em] text-black transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer whitespace-nowrap"
                  >
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/cta:translate-x-full" />
                    <span className="relative">Reveal Code</span>
                  </button>
                )}
                <a
                  href={actionHref}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noreferrer" : undefined}
                  className="text-[10px] font-semibold text-white/25 underline-offset-2 hover:text-white/50 hover:underline transition-colors"
                >
                  Go to store →
                </a>
              </div>
            ) : (
              <button
                onClick={handleGetDeal}
                className="group/cta relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-[var(--color-primary)] px-4 py-3 text-[12.5px] font-black uppercase tracking-[0.14em] text-black transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer whitespace-nowrap"
              >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover/cta:translate-x-full" />
                <span className="relative">Get Deal</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Card Layout */}
        <div className={cn("flex md:hidden flex-col p-4", isFirst && "pt-8")}>
          {/* Upper half: Logo + Info + CTA */}
          <div className="flex items-start justify-between gap-3">
            {/* Logo */}
            {store.logoImage ? (
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white p-0.5 flex items-center justify-center shadow-md">
                <img src={store.logoImage} alt={`${store.name} logo`} className="h-full w-full object-contain rounded-lg" />
              </div>
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-black border border-white/10 text-sm font-black uppercase text-white">
                {store.logoText?.slice(0, 2) || store.name?.slice(0, 2)}
              </div>
            )}

            {/* Value + Badges */}
            <div className="flex-1 min-w-0 pl-1">
              <p className="text-xl font-black leading-none text-white tracking-tight">
                {offerValue}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {/* Type Badge */}
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-white">
                  {isCoupon ? "CODE" : "DEAL"}
                </span>
                {/* Verified Badge */}
                <span className="flex items-center gap-1 text-[9.5px] font-bold text-[var(--color-primary)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
                  Verified
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="shrink-0">
              {isCoupon && offer.code ? (
                <button
                  onClick={handleReveal}
                  className={cn(
                    "flex h-8 items-center justify-center rounded-lg px-3 text-[10px] font-black uppercase tracking-wider transition-all duration-300 active:scale-[0.96] cursor-pointer shadow-md shadow-violet-500/5",
                    revealed
                      ? "border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-mono tracking-widest text-[9.5px]"
                      : "bg-[var(--color-primary)] text-black"
                  )}
                >
                  {revealed ? offer.code : "Get Code"}
                </button>
              ) : (
                <button
                  onClick={handleGetDeal}
                  className="flex h-8 items-center justify-center rounded-lg bg-[var(--color-primary)] text-black px-3 text-[10px] font-black uppercase tracking-wider transition-all duration-300 active:scale-[0.96] shadow-md shadow-violet-500/5"
                >
                  Get Deal
                </button>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="mt-3.5 text-sm sm:text-base font-extrabold leading-snug tracking-tight text-white/95">
            {offer.title}
          </h3>

          {/* Mobile Timer row (only for coupons, compact version) */}
          {isCoupon && (
            <div className="mt-3.5 flex items-center justify-between rounded-xl bg-white/[0.01] border border-white/5 p-3">
              <div className="flex items-center gap-1.5 text-white/40">
                <svg className="h-4 w-4 text-[var(--color-primary)] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span className="text-[10px] font-black uppercase tracking-wider text-white/35">Expires in:</span>
              </div>

              <div className="flex items-center gap-1">
                <div className="flex flex-col items-center justify-center h-9 w-9 rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] shadow-[0_0_8px_rgba(139,92,246,0.08)]">
                  <span className="text-[11px] font-black leading-none">{timeLeft.days}</span>
                  <span className="text-[6px] font-black tracking-wider leading-none mt-0.5 text-white/50">DAYS</span>
                </div>
                <div className="flex flex-col items-center justify-center h-9 w-9 rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] shadow-[0_0_8px_rgba(139,92,246,0.08)]">
                  <span className="text-[11px] font-black leading-none">{timeLeft.hours}</span>
                  <span className="text-[6px] font-black tracking-wider leading-none mt-0.5 text-white/50">HRS</span>
                </div>
                <div className="flex flex-col items-center justify-center h-9 w-9 rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] shadow-[0_0_8px_rgba(139,92,246,0.08)]">
                  <span className="text-[11px] font-black leading-none">{timeLeft.minutes}</span>
                  <span className="text-[6px] font-black tracking-wider leading-none mt-0.5 text-white/50">MIN</span>
                </div>
                <div className="flex flex-col items-center justify-center h-9 w-9 rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] shadow-[0_0_8px_rgba(139,92,246,0.08)]">
                  <span className="text-[11px] font-black leading-none">{timeLeft.seconds}</span>
                  <span className="text-[6px] font-black tracking-wider leading-none mt-0.5 text-white/50">SEC</span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Metadata Row */}
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.04] pt-3 text-[10.5px] font-bold text-white/30">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span>Last used: <strong className="text-white/60 font-bold">{lastUsedNum}{unit} ago</strong></span>
              </div>
              <span className="text-white/10 select-none">•</span>
              <div className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0 1 10.025 20a11.38 11.38 0 0 1-4.99-.94v-.11c0-2.28 1.85-4.13 4.13-4.13h1.696c.484 0 .942.083 1.37.234m0 0a3.001 3.001 0 1 0 0-3.006A4.125 4.125 0 0 0 9 12.75a4.125 4.125 0 0 0-4.125 4.125v1.442" />
                </svg>
                <span>Uses today: <strong className="text-[var(--color-primary)] font-black">{usesTodayNum}</strong></span>
              </div>
            </div>

            {/* Success rate / Health */}
            <div className="flex items-center gap-1 text-[var(--color-primary)]">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Health: 100%</span>
            </div>
          </div>
        </div>
      </article>

      {/* Modal Popup */}
      {isModalOpen && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
          style={{
            animation: "fadeIn 0.2s ease-out forwards"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-[92%] sm:w-full max-w-[440px] max-h-[90vh] overflow-y-auto rounded-[24px] sm:rounded-[28px] border border-white/10 sm:border-2 sm:border-[var(--color-primary)] bg-[#0c0c11] p-5 sm:p-7 text-center shadow-[0_0_40px_rgba(139,92,246,0.25)]"
            style={{
              animation: "scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards"
            }}
          >
            <style>{`
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes scaleIn {
                from { transform: scale(0.95); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
              }
            `}</style>

            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 h-8 w-8 sm:h-7 sm:w-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-white/55 hover:text-white transition-colors duration-200 cursor-pointer z-10"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Logo */}
            <div className="mx-auto mb-3.5 sm:mb-5 h-14 w-14 sm:h-16 sm:w-16 overflow-hidden rounded-2xl border border-white/10 bg-white p-0.5 flex items-center justify-center shadow-md">
              {store.logoImage ? (
                <img src={store.logoImage} alt={`${store.name} logo`} className="h-full w-full object-contain rounded-xl" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-black text-[11px] font-black uppercase text-white">
                  {store.logoText?.slice(0, 2) || store.name?.slice(0, 2)}
                </div>
              )}
            </div>

            {/* Title */}
            <h3 className="text-lg sm:text-[20px] font-black tracking-tight text-white leading-snug mb-2">
              {offer.title}
            </h3>

            {/* Instructions */}
            {isCoupon && offer.code ? (
              <>
                <p className="text-[11px] font-medium text-white/45 mb-4">
                  Copy the code below and paste it at checkout.
                </p>

                {/* Code Box */}
                <div className="mb-5 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-2">
                  <span className="font-mono text-base font-black tracking-widest text-white pl-3 select-all">
                    {offer.code}
                  </span>
                  <button
                    onClick={() => {
                      copyToClipboard(offer.code).then((success) => {
                        if (success) {
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }
                      });
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black transition-all hover:bg-opacity-90 active:scale-[0.97]"
                  >
                    {copied ? "Copied!" : (
                      <>
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-[11px] font-medium text-white/45 mb-5">
                No code required. Just click the button below to claim this deal!
              </p>
            )}

            {/* Affiliate CTA */}
            <Link
              href={actionHref && !/^https?:\/\//i.test(actionHref) ? `https://${actionHref}` : actionHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group/btn relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-[var(--color-primary)] py-3.5 text-xs font-black uppercase tracking-[0.16em] text-black transition-all duration-300 hover:shadow-[0_0_24px_rgba(139,92,246,0.3)] shadow-lg shadow-violet-500/10 active:scale-[0.98]"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
              <span className="relative flex items-center gap-2">
                Go to {store.name} Store
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
                </svg>
              </span>
            </Link>
            <p className="mt-2.5 text-[8.5px] font-black uppercase tracking-wider text-white/25">
              Store opened in a new tab!
            </p>

            {/* Divider */}
            <div className="my-3.5 sm:my-5 border-t border-white/[0.04]" />

            {/* Feedback */}
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25 mb-3">
              Did this {isCoupon ? "coupon" : "deal"} work?
            </p>
            <div className="flex gap-3 justify-center">
              <button className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2 text-xs font-bold text-white/60 hover:bg-white/10 hover:text-white transition-colors duration-200 cursor-pointer">
                👍 Yes, it worked!
              </button>
              <button className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2 text-xs font-bold text-white/60 hover:bg-white/10 hover:text-white transition-colors duration-200 cursor-pointer">
                👎 Didn't work
              </button>
            </div>

            {/* Divider */}
            <div className="my-3.5 sm:my-5 border-t border-white/[0.04]" />

            {/* Follow */}
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25 mb-3">
              Follow us for more deals
            </p>
            <div className="flex gap-2.5 justify-center">
              <a href="#" className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                </svg>
              </a>
              <a href="#" className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                </svg>
              </a>
              <a href="#" className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M11.525.07c1.312.012 2.614.07 3.906.177A12.094 12.094 0 0 1 21.93 5.4a12.094 12.094 0 0 1 1.9 5.5c.107 1.292.165 2.594.177 3.906v.784c-.012 1.312-.07 2.614-.177 3.906a12.094 12.094 0 0 1-5.5 5.5c-1.292.107-2.594.165-3.906.177h-.784c-1.312-.012-2.614-.07-3.906-.177a12.094 12.094 0 0 1-5.5-5.5 12.094 12.094 0 0 1-1.9-5.5c-.107-1.292-.165-2.594-.177-3.906v-.784c.012-1.312.07-2.614.177-3.906a12.094 12.094 0 0 1 5.5-5.5 12.094 12.094 0 0 1 5.5-1.9c1.292-.107 2.594-.165 3.906-.177h.784Zm.936 9.69a1.986 1.986 0 1 0 0-3.972 1.986 1.986 0 0 0 0 3.972Zm4.872 3.123c-.768-.11-1.543-.195-2.316-.255a4.237 4.237 0 0 0-3.23-1.637 4.237 4.237 0 0 0-3.23 1.637c-.773.06-1.548.145-2.316.255a2.124 2.124 0 0 0-1.83 2.1v2.3a2.124 2.124 0 0 0 1.83 2.1c.768.11 1.543.195 2.316.255a4.237 4.237 0 0 0 3.23 1.637 4.237 4.237 0 0 0 3.23-1.637c.773-.06 1.548-.145 2.316-.255a2.124 2.124 0 0 0 1.83-2.1v-2.3a2.124 2.124 0 0 0-1.83-2.1Z" />
                </svg>
              </a>
            </div>

            {/* Divider */}
            <div className="my-3.5 sm:my-5 border-t border-white/[0.04]" />

            {/* Share */}
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25 mb-3">
              Share this {isCoupon ? "coupon" : "deal"}
            </p>
            <div className="flex gap-2.5 justify-center">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(offer.title + " " + actionHref)}`}
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.863-9.864.001-2.637-1.03-5.116-2.905-6.993C16.55 1.87 14.077.84 11.445.84c-5.441 0-9.866 4.424-9.869 9.87-.001 1.745.485 3.326 1.446 4.887L1.93 21.09l5.717-1.936z" />
                </svg>
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(offer.title + " " + actionHref)}`}
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <button
                onClick={() => {
                  copyToClipboard(actionHref).then((success) => {
                    if (success) alert("Link copied to clipboard!");
                  });
                }}
                className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
