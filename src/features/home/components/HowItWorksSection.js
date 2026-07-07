"use client";

import { useEffect, useState } from "react";
import SectionHeader from "@/components/shared/SectionHeader";

export default function HowItWorksSection() {
  const [scanStep, setScanStep] = useState(0);
  const [testStatus, setTestStatus] = useState("loading");
  const [copyStep, setCopyStep] = useState(0);

  // Crawler Simulation (Step 1)
  useEffect(() => {
    const interval = setInterval(() => {
      setScanStep((prev) => (prev + 1) % 4);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Verification Simulation (Step 2)
  useEffect(() => {
    const timer = setInterval(() => {
      setTestStatus((prev) => {
        if (prev === "loading") return "success";
        if (prev === "success") return "failed";
        return "loading";
      });
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  // Copy/Redirect Simulation (Step 3)
  useEffect(() => {
    const timer = setInterval(() => {
      setCopyStep((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const crawlerLogs = [
    { store: "nike.com", action: "Scanning API endpoints...", res: "200 OK" },
    { store: "sephora.com", action: "Checking checkout DOM...", res: "Found coupon field" },
    { store: "adidas.com", action: "Found code 'ADISAVE'...", res: "Staged for verification" },
    { store: "asos.com", action: "Extracting discount metadata...", res: "Success" }
  ];

  return (
    <section className="relative mt-24">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute left-1/4 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-primary)]/5 blur-[120px]" />
      <div className="pointer-events-none absolute right-1/4 top-1/3 h-[300px] w-[300px] translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d946ef]/5 blur-[100px]" />

      <SectionHeader title="How Couponchy Works" centered={true} />

      <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
        
        {/* Step 1: Scan & Discover */}
        <article className="group relative flex flex-col overflow-hidden rounded-[28px] border border-white/5 bg-[#09090c]/90 p-8 shadow-2xl transition duration-500 hover:-translate-y-1.5 hover:border-[var(--color-primary)]/20 hover:shadow-[0_20px_45px_rgba(139,92,246,0.06)]">
          <span className="text-6xl font-black text-white/[0.02] tracking-tight absolute top-4 right-6 select-none group-hover:text-white/[0.04] transition-colors duration-300">
            01
          </span>
          
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-primary)]/20 bg-gradient-to-br from-[var(--color-primary)]/10 to-transparent text-[var(--color-primary)] shadow-[0_0_15px_rgba(139,92,246,0.1)]">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
            </svg>
          </div>

          <h3 className="text-[18px] font-black text-white tracking-tight mt-6">
            1. Scan & Discover
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-white/60 font-medium">
            Our automated crawlers scan thousands of retail brands every minute to discover new coupons, promo codes, and special clearance events.
          </p>

          {/* Crawler Visual Mockup */}
          <div className="relative mt-6 rounded-2xl border border-white/5 bg-black/60 p-4 h-[160px] flex flex-col justify-center overflow-hidden font-mono text-[10px]">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 pointer-events-none" />
            
            <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
              <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Live Discovery Feed</span>
            </div>

            <div className="flex flex-col gap-2 relative">
              {crawlerLogs.map((log, idx) => {
                const isActive = idx === scanStep;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between transition-all duration-300 ${
                      isActive ? "text-[var(--color-primary)] scale-[1.02] translate-x-1" : "text-white/30"
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1.5">
                      <span className={`h-1 w-1 rounded-full ${isActive ? "bg-[var(--color-primary)]" : "bg-white/20"}`} />
                      {log.store}
                    </span>
                    <span className="truncate max-w-[110px]">{log.action}</span>
                    <span className={`font-semibold text-[8px] uppercase ${isActive ? "text-emerald-400" : "text-white/20"}`}>
                      {log.res}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </article>

        {/* Step 2: Test & Verify */}
        <article className="group relative flex flex-col overflow-hidden rounded-[28px] border border-white/5 bg-[#09090c]/90 p-8 shadow-2xl transition duration-500 hover:-translate-y-1.5 hover:border-[#d946ef]/20 hover:shadow-[0_20px_45px_rgba(217,70,239,0.06)]">
          <span className="text-6xl font-black text-white/[0.02] tracking-tight absolute top-4 right-6 select-none group-hover:text-white/[0.04] transition-colors duration-300">
            02
          </span>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d946ef]/20 bg-gradient-to-br from-[#d946ef]/10 to-transparent text-[#d946ef] shadow-[0_0_15px_rgba(217,70,239,0.1)]">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.746 3.746 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
          </div>

          <h3 className="text-[18px] font-black text-white tracking-tight mt-6">
            2. Test & Verify
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-white/60 font-medium">
            We simulate checkout carts on headless Chrome browsers, applying discount codes automatically. If a code fails or is expired, we throw it out instantly.
          </p>

          {/* Test & Verification Visual Mockup */}
          <div className="relative mt-6 rounded-2xl border border-white/5 bg-black/60 p-4 h-[160px] flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Cart Simulation</span>
              <span className="text-[8px] font-mono text-[#d946ef] bg-[#d946ef]/10 border border-[#d946ef]/20 rounded-full px-2 py-0.5 animate-pulse">Running Bot...</span>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center gap-3">
              {/* Code field mockup */}
              <div className="flex items-center justify-between w-full max-w-[180px] rounded-xl border border-white/10 bg-[#050507] px-3.5 py-2">
                <span className="font-mono text-xs text-white/70 font-semibold tracking-wider">JUSTDOIT25</span>
                
                {testStatus === "loading" && (
                  <svg className="h-4 w-4 animate-spin text-[#d946ef]" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" className="stroke-current opacity-25" strokeWidth="3" />
                    <path d="M21 12a9 9 0 0 0-9-9" className="stroke-current" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                )}

                {testStatus === "success" && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ✓
                  </span>
                )}

                {testStatus === "failed" && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    ✕
                  </span>
                )}
              </div>

              {/* Status Display banner */}
              <div className="h-6">
                {testStatus === "loading" && (
                  <span className="text-[10px] text-white/30 font-semibold">Validating checkout basket...</span>
                )}
                {testStatus === "success" && (
                  <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Verified: 25% Off Active!
                  </span>
                )}
                {testStatus === "failed" && (
                  <span className="text-[10px] text-rose-400 font-extrabold uppercase tracking-wide">
                    Rejected: Code Expired
                  </span>
                )}
              </div>
            </div>
          </div>
        </article>

        {/* Step 3: Copy & Save */}
        <article className="group relative flex flex-col overflow-hidden rounded-[28px] border border-white/5 bg-[#09090c]/90 p-8 shadow-2xl transition duration-500 hover:-translate-y-1.5 hover:border-[#60a5fa]/20 hover:shadow-[0_20px_45px_rgba(96,165,250,0.06)]">
          <span className="text-6xl font-black text-white/[0.02] tracking-tight absolute top-4 right-6 select-none group-hover:text-white/[0.04] transition-colors duration-300">
            03
          </span>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#60a5fa]/20 bg-gradient-to-br from-[#60a5fa]/10 to-transparent text-[#60a5fa] shadow-[0_0_15px_rgba(96,165,250,0.1)]">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
            </svg>
          </div>

          <h3 className="text-[18px] font-black text-white tracking-tight mt-6">
            3. Copy & Save
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-white/60 font-medium">
            Only the working, highest-saving codes are published to the vaults. One click copies the code and routes you to the store for instant checkout savings.
          </p>

          {/* Copy and Save Visual Mockup */}
          <div className="relative mt-6 rounded-2xl border border-white/5 bg-black/60 p-4 h-[160px] flex flex-col justify-center items-center overflow-hidden gap-3.5">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />

            {/* mini card mockup */}
            <div className="relative w-full max-w-[190px] rounded-xl border border-[#60a5fa]/20 bg-[#60a5fa]/5 px-3.5 py-3 shadow-[0_0_15px_rgba(96,165,250,0.1)] flex items-center justify-between">
              <div className="text-left">
                <p className="text-[14px] font-black text-white leading-none">NIKE STORE</p>
                <p className="text-[7px] font-extrabold tracking-wider leading-none mt-0.5 text-white/70">Verified Coupon</p>
              </div>
              <span className="text-[11px] font-black text-[#60a5fa]">25% OFF</span>
            </div>

            {/* Copy CTA button simulator */}
            <div className="w-full max-w-[190px] rounded-xl border border-white/10 bg-white/5 py-2.5 text-center transition-all duration-300">
              <span className="font-mono text-[9px] font-black uppercase tracking-[0.12em] text-white">
                {copyStep === 0 && "GET CODE"}
                {copyStep === 1 && "✓ COPIED!"}
                {copyStep === 2 && "REDIRECTING..."}
              </span>
            </div>
          </div>
        </article>

      </div>
    </section>
  );
}
