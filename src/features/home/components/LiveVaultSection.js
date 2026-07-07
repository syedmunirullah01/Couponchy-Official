"use client";

import { useState, useEffect } from "react";
import { copyToClipboard } from "@/lib/copyToClipboard";
import Link from "next/link";
import { cn } from "@/lib/utils";

const SAMPLE_LOGS = [
  { id: 1, bot: "Bot #03", action: "Testing Nike code 'JUSTDOIT25'...", status: "success", result: "VERIFIED (-25%)" },
  { id: 2, bot: "Bot #12", action: "Simulating checkout on EcoFlow...", status: "success", result: "VERIFIED (-$120.00)" },
  { id: 3, bot: "Bot #05", action: "Analyzing Gousto UK box deal...", status: "success", result: "DIRECT DEAL ACTIVE" },
  { id: 4, bot: "Bot #09", action: "Testing ASOS checkout basket...", status: "pending", result: "SCANNING PROMO BAR..." },
  { id: 5, bot: "Bot #14", action: "Verifying Sephora coupon 'GLOW15'...", status: "success", result: "VERIFIED (-15%)" },
  { id: 6, bot: "Bot #02", action: "Checking Adidas promo codes...", status: "failed", result: "EXPIRED (CODE 404)" },
  { id: 7, bot: "Bot #08", action: "Simulating checkout on Waterdrop...", status: "success", result: "VERIFIED (-20%)" },
  { id: 8, bot: "Bot #11", action: "Deploying Playwright agent to eBay...", status: "pending", result: "LOGGING IN..." },
];

const BOT_NAMES = ["Bot #01", "Bot #02", "Bot #03", "Bot #04", "Bot #05", "Bot #06", "Bot #07", "Bot #08", "Bot #09", "Bot #10", "Bot #11", "Bot #12", "Bot #13", "Bot #14", "Bot #15"];
const STORE_NAMES = ["Nike", "Adidas", "Sephora", "eBay", "Waterdrop", "Dorothy Perkins", "EcoFlow", "Gousto UK", "EcoFlow UK", "FlexShopper", "ASOS"];
const ACTIONS = [
  { text: "Testing promo code 'SAVE20' on Checkout", type: "Coupon", code: "SAVE20", discount: "-20%" },
  { text: "Verifying direct link promotional discount", type: "Deal", code: "", discount: "DIRECT DEAL ACTIVE" },
  { text: "Simulating basket checkout calculations", type: "Coupon", code: "MEMBER15", discount: "-15%" },
  { text: "Checking global sitewide voucher validity", type: "Coupon", code: "FREESHIP", discount: "FREE DELIVERY" },
  { text: "Scanning checkout fields for active markdown", type: "Deal", code: "", discount: "DIRECT DEAL ACTIVE" },
];

export default function LiveVaultSection() {
  const [cartValue, setCartValue] = useState(150);
  const [estimatedSavings, setEstimatedSavings] = useState(27);
  const [logs, setLogs] = useState(SAMPLE_LOGS.slice(0, 4));
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Update calculator savings
  useEffect(() => {
    const value = parseFloat(cartValue);
    if (!isNaN(value) && value > 0) {
      setEstimatedSavings(parseFloat((value * 0.18).toFixed(2)));
    } else {
      setEstimatedSavings(0);
    }
  }, [cartValue]);

  // Handle dynamic bot log updates
  useEffect(() => {
    const interval = setInterval(() => {
      const randomBot = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
      const randomStore = STORE_NAMES[Math.floor(Math.random() * STORE_NAMES.length)];
      const randomAction = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
      
      const statuses = ["success", "success", "success", "pending", "failed"];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      let result = "";
      if (status === "success") {
        result = randomAction.discount;
      } else if (status === "pending") {
        result = "BASKET INITIALIZED...";
      } else {
        result = "EXPIRED (CODE CODE)";
      }

      const newLog = {
        id: Date.now(),
        bot: randomBot,
        action: `${randomAction.text} on ${randomStore}...`,
        status,
        result
      };

      setLogs((prev) => [newLog, ...prev.slice(0, 3)]);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const handleCopy = (code, index) => {
    copyToClipboard(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const flashDeals = [
    {
      store: "Nike Store",
      title: "Get 25% Off Orders $100+",
      desc: "Simulated verification complete. Best sitewide code for seasonal styles.",
      code: "JUSTDOIT25",
      success: 99,
      verifiedAge: "2 mins ago by Bot #03",
    },
    {
      store: "EcoFlow UK",
      title: "Save $120 Sitewide on Portable Power",
      desc: "Automatically tested. Applies to all portable solar generator kits.",
      code: "POWER120",
      success: 96,
      verifiedAge: "4 mins ago by Bot #12",
    },
    {
      store: "Gousto UK",
      title: "60% Off First Food Box + Free Shipping",
      desc: "Tested on headless Playwright checkout agent. First-time subscribers.",
      code: "GOUSTO60",
      success: 94,
      verifiedAge: "8 mins ago by Bot #05",
    },
  ];

  return (
    <section className="relative mt-24">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-primary)]/5 blur-[140px]" />

      {/* Grid container */}
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
        
        {/* Left Column: Verification Engine Monitor & Calculator */}
        <div className="flex flex-col gap-6">
          
          {/* Section Header */}
          <div className="text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-3 py-1 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-primary)]"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-primary)]">Couponchy Engine Live</span>
            </div>
            <h2 className="font-sans text-[28px] font-black uppercase tracking-tight text-white/90 sm:text-[36px] leading-tight">
              Live Savings Vault
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/40 font-medium max-w-lg">
              Headless browser agents simulate checkouts and verify coupon code discounts in real-time. Use the verified vault drops below to save instantly.
            </p>
          </div>

          {/* Interactive Savings Calculator */}
          <div className="relative overflow-hidden rounded-[28px] border border-white/5 bg-[#09090c]/85 p-6 backdrop-blur-xl shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 via-transparent to-transparent pointer-events-none" />
            
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <svg className="h-5 w-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-3-9v9m-3-5.25V18M3 3h18v18H3V3Z" />
              </svg>
              Savings Estimator
            </h3>
            
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-white/30 mb-2">Cart Value ($)</label>
                <input
                  type="number"
                  value={cartValue}
                  onChange={(e) => setCartValue(e.target.value)}
                  className="h-14 w-full rounded-2xl border border-white/10 bg-[#050507] px-4 text-base font-bold text-white outline-none transitionplaceholder:text-white/20 focus:border-[var(--color-primary)]/30 focus:bg-[#07070a]"
                  placeholder="Enter shopping cart total"
                  min="1"
                />
              </div>
              <div className="flex flex-col justify-center rounded-2xl border border-[var(--color-primary)]/10 bg-[var(--color-primary)]/5 px-6 py-4 text-left">
                <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-primary)]">Estimated Savings (18% avg)</p>
                <p className="mt-2 text-3xl font-black text-white leading-none tracking-tight">
                  ${estimatedSavings}
                </p>
              </div>
            </div>
          </div>

          {/* Live Bot Execution Log Feed */}
          <div className="relative overflow-hidden rounded-[28px] border border-white/5 bg-[#09090c]/85 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-black uppercase tracking-wider text-white/70 flex items-center gap-2.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--color-primary)]"></span>
                </span>
                Agent Activity Logs
              </h3>
              
              {/* Pulsing Radar Visual */}
              <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10">
                <div className="absolute h-4 w-4 rounded-full border border-[var(--color-primary)]/30 animate-[ping_1.5s_infinite]" />
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
              </div>
            </div>

            <div className="flex flex-col gap-3 min-h-[220px]">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-white/[0.03] bg-white/[0.01] px-4.5 py-3 text-xs transition duration-300 hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-2 py-0.5 text-[9px] font-bold text-[var(--color-primary)] uppercase tracking-wider">
                      {log.bot}
                    </span>
                    <span className="font-semibold text-white/50 truncate max-w-[200px] sm:max-w-xs">{log.action}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:text-right">
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider",
                        log.status === "success" && "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
                        log.status === "pending" && "bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse",
                        log.status === "failed" && "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                      )}
                    >
                      {log.result}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Holographic Scarcity Cards Grid */}
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-center px-1 mb-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">VIP FLASH DROPS</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] animate-pulse">AUTO RESETS HOURLY</span>
          </div>

          <div className="grid gap-5">
            {flashDeals.map((deal, idx) => (
              <article
                key={deal.code}
                className="group relative flex flex-col overflow-hidden rounded-[26px] border border-white/5 bg-[#09090c]/80 p-6 shadow-2xl transition duration-500 hover:-translate-y-1 hover:border-[var(--color-primary)]/20 hover:shadow-[0_20px_40px_rgba(139,92,246,0.05)]"
              >
                {/* Holographic glowing lines backdrop */}
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/[0.03] via-transparent to-transparent pointer-events-none" />
                
                {/* Left notches stub cut-outs */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-[#020202] border-r border-white/5 pointer-events-none" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-[#020202] border-l border-white/5 pointer-events-none" />

                <div className="flex items-start justify-between">
                  <div className="text-left">
                    <span className="rounded-lg bg-white/5 border border-white/10 px-2 py-0.5 text-[9px] font-bold text-white/55 uppercase tracking-wider">
                      {deal.store}
                    </span>
                    <h4 className="mt-3 text-lg font-black text-white leading-tight transition-colors duration-300 group-hover:text-[var(--color-primary)]">
                      {deal.title}
                    </h4>
                  </div>
                  
                  {/* Copy Badge click action */}
                  <button
                    type="button"
                    onClick={() => handleCopy(deal.code, idx)}
                    className="group/btn relative overflow-hidden flex h-10 items-center justify-center rounded-xl bg-[var(--color-primary)] text-black px-4 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_15px_rgba(139,92,246,0.2)] active:scale-[0.97]"
                  >
                    {/* Shimmer Light Sweep Hover Effect */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover/btn:translate-x-full" />
                    
                    <span className="relative z-10 text-[10px] font-black uppercase tracking-wider">
                      {copiedIndex === idx ? "Copied!" : "Get Code"}
                    </span>
                  </button>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-white/40 font-medium text-left">
                  {deal.desc}
                </p>

                {/* Progress bar success metrics */}
                <div className="mt-5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-white/30">
                  <span>Success Rate</span>
                  <span className="text-[var(--color-primary)]">{deal.success}%</span>
                </div>
                
                <div className="mt-2 h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)] transition-all duration-1000"
                    style={{ width: `${deal.success}%` }}
                  />
                </div>

                {/* Footnotes */}
                <div className="mt-4.5 pt-3 border-t border-dashed border-white/5 flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-white/35">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-emerald-400" />
                    <span>Verified: {deal.verifiedAge}</span>
                  </div>
                  <span className="text-[var(--color-primary)]/80">Code: {deal.code.slice(0, 3)}***</span>
                </div>

              </article>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
