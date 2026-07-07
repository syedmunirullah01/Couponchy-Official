"use client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function FeaturedCouponCard({ coupon, index = 0 }) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });
  const isHighlight = coupon.highlight;

  const isDeal = coupon.value === "GET DEAL" || coupon.value === "SAVE NOW";

  const openAffiliateLink = () => {
    let url = coupon.affiliateLink;
    if (!url || !url.trim()) {
      url = coupon.source;
    }
    if (!url || !url.trim() || url === "Manual") {
      url = `/stores/all/${coupon.storeSlug || ""}`;
    }

    if (url && url !== "/stores/all/") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleCopy = () => {
    if (!isDeal) {
      navigator.clipboard.writeText(coupon.value);
    }
    openAffiliateLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const calculateTargetDate = () => {
      const now = new Date();
      let target;

      if (index === 0) {
        // Card 1: Resets on 15th and end of current month
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const targetDay = now.getDate() <= 15 ? 15 : lastDay;
        target = new Date(now.getFullYear(), now.getMonth(), targetDay, 23, 59, 59);
      } else if (index === 1) {
        // Card 2: Resets on 10th, 20th, and end of current month
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        let targetDay;
        if (now.getDate() <= 10) {
          targetDay = 10;
        } else if (now.getDate() <= 20) {
          targetDay = 20;
        } else {
          targetDay = lastDay;
        }
        target = new Date(now.getFullYear(), now.getMonth(), targetDay, 23, 59, 59);
      } else {
        // Card 3 & others: Resets on the end of current month (Monthly cycle)
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        target = new Date(now.getFullYear(), now.getMonth(), lastDay, 23, 59, 59);
      }
      return target;
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
  }, [index]);

  return (
    <article
      className={cn(
        "group relative flex flex-col h-full overflow-hidden rounded-[28px] border transition-all duration-500 hover:-translate-y-1",
        isHighlight
          ? "border-[var(--color-primary)]/25 bg-gradient-to-b from-[#110d22] to-[#07050f] text-white hover:border-[var(--color-primary)]/50 hover:shadow-[0_20px_45px_rgba(139,92,246,0.12),0_0_20px_rgba(139,92,246,0.05)]"
          : "border-white/5 bg-[#09090c] text-white hover:border-[var(--color-primary)]/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5),0_0_30px_rgba(139,92,246,0.03)]"
      )}
    >
      {/* Ambient Glow behind Highlight Card */}
      {isHighlight && (
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[var(--color-primary)]/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
      )}

      {/* Top Section */}
      <div className="relative flex flex-col flex-1 p-6 pb-7 z-10">
        <div className="flex items-center justify-between">
          {coupon.logoImage ? (
            <div className="flex items-center gap-[14px]">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-white p-1.5 shadow-sm border border-white/10">
                <img
                  src={coupon.logoImage}
                  alt=""
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="text-[18px] font-black tracking-[-0.02em] text-white transition-colors duration-300 group-hover:text-[var(--color-primary-hover)]">
                {coupon.brand}
              </span>
            </div>
          ) : (
            <span
              className={cn(
                "rounded-xl border px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider",
                isHighlight
                  ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)]/20 text-[var(--color-primary)]"
                  : "bg-white/5 border-white/10 text-white/50"
              )}
            >
              {coupon.brand || "STORE"}
            </span>
          )}

          {/* Glowing Status Dot */}
          <div className="flex items-center gap-1.5 rounded-full bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 px-2 py-0.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--color-primary)]"></span>
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider text-[var(--color-primary)]">Verified</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/55">
            {coupon.tag || "EXCLUSIVE DEAL"}
          </p>
          <h3
            className={cn(
              "mt-2 text-[22px] font-extrabold tracking-tight leading-[1.3] transition-all duration-300 min-h-[3.5rem] line-clamp-2",
              isHighlight
                ? "text-white drop-shadow-[0_0_12px_rgba(139,92,246,0.2)]"
                : "text-[var(--color-primary)]"
            )}
          >
            {coupon.title || (isDeal ? "Exclusive Deal" : "Exclusive Coupon")}
          </h3>
          <p className="mt-3 text-xs leading-relaxed text-white/60 font-medium line-clamp-2 min-h-[2.5rem]">
            {coupon.description}
          </p>

          {/* Timer countdown below description */}
          <div className="mt-5 flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-white/60">
              <svg className="h-4 w-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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

        </div>
      </div>

      {/* Ticket Cutouts & Separator */}
      <div className="relative flex items-center px-0 z-10">
        <div className={cn(
          "absolute -left-3 h-6 w-6 rounded-full border-r",
          isHighlight ? "bg-[#020202] border-[var(--color-primary)]/25" : "bg-[#020202] border-white/5"
        )} />
        <div className={cn(
          "w-full border-t border-dashed",
          isHighlight ? "border-[var(--color-primary)]/20" : "border-white/10"
        )} />
        <div className={cn(
          "absolute -right-3 h-6 w-6 rounded-full border-l",
          isHighlight ? "bg-[#020202] border-[var(--color-primary)]/25" : "bg-[#020202] border-white/5"
        )} />
      </div>

      {/* Bottom Section */}
      <div className="mt-auto flex flex-col p-6 pt-7 z-10">
        {/* Ticket Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "group/btn relative flex w-full items-center overflow-hidden rounded-2xl transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-lg",
            isHighlight
              ? "bg-[var(--color-primary)] text-black shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:shadow-[0_0_25px_rgba(139,92,246,0.3)] hover:scale-[1.01]"
              : "bg-white/5 border border-white/10 text-white/80 hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] hover:text-black hover:shadow-[0_0_20px_rgba(139,92,246,0.25)] hover:scale-[1.01]"
          )}
        >
          {/* Shimmer Light Sweep Hover Effect */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover/btn:translate-x-full" />

          <div className="flex-1 py-4 px-4 text-center text-[11px] font-black uppercase tracking-[0.15em] transition-colors duration-300">
            {copied ? (isDeal ? "Redirecting..." : "Copied!") : (isDeal ? "Get Deal Now" : "Copy Code")}
          </div>
          <div className={cn(
            "relative flex h-full items-center justify-center px-4 py-4 border-l border-dashed",
            isHighlight
              ? "border-black/20 bg-black/5"
              : "border-white/10 bg-white/5 group-hover/btn:border-black/20 group-hover/btn:bg-black/5"
          )}>
            <span className="text-[10px] font-black uppercase tracking-wider">
              {isDeal ? "DEAL" : "CODE"}
            </span>
          </div>

          <div className="absolute inset-0 bg-white/5 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100" />
        </button>
      </div>
    </article>
  );
}
