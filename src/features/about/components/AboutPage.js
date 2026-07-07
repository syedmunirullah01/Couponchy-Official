"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// ─── Values ───────────────────────────────────────────────────────────────────
const VALUES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
        <path d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
    title: "Radical Honesty",
    desc: "We never publish a coupon we haven't tested. If a code doesn't work, it's gone — no padding the numbers.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
      </svg>
    ),
    title: "Speed Over Everything",
    desc: "Our automated systems verify coupon codes in seconds — so you get working deals before anyone else.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Zero Junk Policy",
    desc: "No fake discounts, no misleading prices. Every listed offer is real, active, and saves you actual money.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Built for Everyone",
    desc: "Whether you're a student on a budget or a deal-hunting pro — Couponchy gives everyone the same saving power.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    title: "Always Growing",
    desc: "New stores, new categories, new countries — Couponchy expands constantly to bring savings wherever you shop.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
      </svg>
    ),
    title: "Always Up-to-Date",
    desc: "Our crawlers run 24/7. The moment a code expires, it's removed. Real-time is not a buzzword for us.",
  },
];

// ─── How It Works steps ───────────────────────────────────────────────────────
const STEPS = [
  {
    num: "01",
    title: "Discover",
    desc: "We scan thousands of sources — brand newsletters, affiliate networks, community forums — to catch every coupon at the moment it's issued.",
  },
  {
    num: "02",
    title: "Verify",
    desc: "Automated agents simulate real checkouts to confirm the discount applies. Only codes that actually reduce your price pass through.",
  },
  {
    num: "03",
    title: "Publish",
    desc: "Verified codes are published instantly with expiry tracking. Expired codes are pulled the moment they stop working.",
  },
  {
    num: "04",
    title: "Save",
    desc: "You arrive, you see real savings, you save money. No hunting, no guessing, no expired codes.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCount(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K+`;
  return `${n}+`;
}

function useInView(ref) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return inView;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AboutPage({ totalStores = 0, totalOffers = 0, company = null }) {
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef);
  const [hoveredVal, setHoveredVal] = useState(null);
  const [hoveredStep, setHoveredStep] = useState(null);

  const aboutData = company?.aboutUs || {};

  // Build dynamic stats that match the homepage numbers
  const STATS = [
    { value: formatCount(totalStores), label: "Verified Stores" },
    { value: aboutData.statMonthlyUsers || "4.6M+", label: "Monthly Users" },
    { value: aboutData.statCodeAccuracy || "98%", label: "Code Accuracy" },
    { value: formatCount(totalOffers), label: "Active Deals" },
  ];

  return (
    <div style={{ color: "#fff", fontFamily: "inherit", overflow: "hidden" }}>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{ position: "relative", padding: "120px 0 100px", textAlign: "center" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          <div style={{ position: "absolute", top: "-80px", left: "50%", transform: "translateX(-50%)", width: "900px", height: "600px", background: "radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(139,92,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.03) 1px, transparent 1px)", backgroundSize: "48px 48px", maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)", WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)" }} />
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: "800px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "999px", padding: "6px 18px", marginBottom: "32px" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-primary)", boxShadow: "0 0 10px var(--color-primary)", display: "inline-block", animation: "aboutPulse 2s infinite" }} />
            <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-primary)" }}>
              {aboutData.heroBadge || "Our Story"}
            </span>
          </div>

          <h1 style={{ fontSize: "clamp(44px, 6vw, 80px)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.04em", margin: 0, marginBottom: "28px" }}>
            {aboutData.heroTitleLine1 || "We killed the"}<br />
            <span style={{ color: "var(--color-primary)" }}>{aboutData.heroTitleAccent || "expired code."}</span>
          </h1>

          <p style={{ fontSize: "clamp(15px, 2vw, 18px)", lineHeight: 1.75, color: "rgba(255,255,255,0.55)", maxWidth: "580px", margin: "0 auto 48px", fontWeight: 500 }}>
            {aboutData.heroDescription || "Couponchy was built out of frustration. Every other coupon site was full of dead links and fake discounts. We built the infrastructure to verify every code — automatically, in real time, at scale."}
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/stores"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--color-primary)", color: "#000", fontWeight: 800, fontSize: "14px", padding: "14px 28px", borderRadius: "14px", textDecoration: "none", transition: "all 0.2s", boxShadow: "0 0 24px rgba(139,92,246,0.35)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--color-primary-hover)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--color-primary)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              Browse Stores →
            </Link>
            <Link href="/contact"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontWeight: 700, fontSize: "14px", padding: "14px 28px", borderRadius: "14px", textDecoration: "none", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────── */}
      <section ref={statsRef} style={{ padding: "0 24px 100px", maxWidth: "1240px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }} className="about-stats-grid">
          {STATS.map((s, i) => (
            <div key={s.label}
              style={{ textAlign: "center", padding: "40px 24px", background: "rgba(15,15,20,0.7)", border: "1px solid rgba(139,92,246,0.12)", borderRadius: "24px", backdropFilter: "blur(12px)", transition: "all 0.4s", animation: statsInView ? `aboutFadeUp 0.6s ${i * 0.1}s both` : "none" }}
              onMouseEnter={e => { e.currentTarget.style.border = "1px solid rgba(139,92,246,0.35)"; e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(139,92,246,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.border = "1px solid rgba(139,92,246,0.12)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, letterSpacing: "-0.04em", background: "linear-gradient(135deg, #fff 0%, var(--color-primary) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{s.value}</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: "8px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MISSION ───────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 120px", maxWidth: "1240px", margin: "0 auto" }}>
        <div style={{ display: "grid", gap: "60px", alignItems: "center" }} className="about-mission-grid">
          <div>
            <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-primary)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ height: "2px", width: "24px", background: "var(--color-primary)", display: "inline-block" }} /> Our Mission
            </div>
            <blockquote style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 900, lineHeight: 1.2, letterSpacing: "-0.03em", margin: 0, marginBottom: "28px" }}>
              "{aboutData.missionQuote || "Nobody should waste money on a coupon that doesn't work."}"
            </blockquote>
            <p style={{ fontSize: "16px", lineHeight: 1.8, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
              {aboutData.missionParagraph1 || "We started Couponchy because we kept getting burned — coupon code after coupon code failing at checkout. The problem wasn't a lack of deals. The problem was a lack of honesty."}
            </p>
            <p style={{ fontSize: "16px", lineHeight: 1.8, color: "rgba(255,255,255,0.5)", fontWeight: 500, marginTop: "16px" }}>
              {aboutData.missionParagraph2 || "So we built a real-time verification engine. Not just a database of codes — an automated system that actually tests them, removes the dead ones, and surfaces the ones that genuinely save you money."}
            </p>
          </div>

          <div style={{ position: "relative" }}>
            <div style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(217,70,239,0.05) 50%, rgba(15,15,20,0.8) 100%)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "32px", padding: "48px 40px", backdropFilter: "blur(12px)" }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: "200px", height: "200px", background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ fontSize: "56px", marginBottom: "16px" }}>🎯</div>
              <h3 style={{ fontSize: "22px", fontWeight: 900, margin: "0 0 12px" }}>
                {aboutData.promiseTitle || "The Promise"}
              </h3>
              <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.55)", lineHeight: 1.7, fontWeight: 500, margin: 0 }}>
                {aboutData.promiseDescription || "Every coupon you see on Couponchy has been verified by our automated system. If it stopped working — it's already gone."}
              </p>
              <div style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "14px" }}>
                {[
                  aboutData.promiseBullet1 || "Real-time code verification",
                  aboutData.promiseBullet2 || "Auto-removal of expired deals",
                  aboutData.promiseBullet3 || "Zero fake or misleading discounts"
                ].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                    <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--color-primary)", fontSize: "11px", fontWeight: 900 }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 120px", maxWidth: "1240px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-primary)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
            <span style={{ height: "2px", width: "24px", background: "var(--color-primary)", display: "inline-block" }} /> How It Works
          </div>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>
            From raw code to<br /><span style={{ color: "var(--color-primary)" }}>verified savings</span>
          </h2>
        </div>

        <div style={{ display: "grid", gap: "20px" }} className="about-steps-grid">
          {STEPS.map((step, i) => {
            const isHovered = hoveredStep === i;
            return (
              <div key={step.num}
                onMouseEnter={() => setHoveredStep(i)}
                onMouseLeave={() => setHoveredStep(null)}
                style={{ position: "relative", background: isHovered ? "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(15,15,20,0.9) 100%)" : "rgba(15,15,20,0.6)", border: isHovered ? "1px solid rgba(139,92,246,0.35)" : "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "36px 32px", backdropFilter: "blur(12px)", transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)", transform: isHovered ? "translateY(-4px)" : "translateY(0)", boxShadow: isHovered ? "0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(139,92,246,0.08)" : "none", display: "flex", gap: "24px", alignItems: "flex-start" }}>
                <div style={{ fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 900, letterSpacing: "-0.05em", color: isHovered ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.06)", lineHeight: 1, flexShrink: 0, minWidth: "80px", transition: "color 0.3s" }}>{step.num}</div>
                <div>
                  <h3 style={{ fontSize: "20px", fontWeight: 900, margin: "0 0 10px", color: isHovered ? "var(--color-primary-hover)" : "#fff", transition: "color 0.3s" }}>{step.title}</h3>
                  <p style={{ fontSize: "15px", lineHeight: 1.7, color: "rgba(255,255,255,0.5)", margin: 0, fontWeight: 500 }}>{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── VALUES ────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 120px", maxWidth: "1240px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-primary)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
            <span style={{ height: "2px", width: "24px", background: "var(--color-primary)", display: "inline-block" }} /> What We Stand For
          </div>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>
            Our <span style={{ color: "var(--color-primary)" }}>core values</span>
          </h2>
        </div>
        <div style={{ display: "grid", gap: "20px" }} className="about-values-grid">
          {VALUES.map((v, i) => {
            const isHovered = hoveredVal === i;
            return (
              <div key={v.title}
                onMouseEnter={() => setHoveredVal(i)}
                onMouseLeave={() => setHoveredVal(null)}
                style={{ background: isHovered ? "linear-gradient(135deg, rgba(139,92,246,0.14) 0%, rgba(15,15,20,0.9) 100%)" : "rgba(15,15,20,0.6)", border: isHovered ? "1px solid rgba(139,92,246,0.35)" : "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "32px 28px", backdropFilter: "blur(12px)", transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)", transform: isHovered ? "translateY(-6px)" : "translateY(0)", boxShadow: isHovered ? "0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(139,92,246,0.1)" : "none" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "16px", background: isHovered ? "rgba(139,92,246,0.2)" : "rgba(139,92,246,0.08)", border: isHovered ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)", marginBottom: "20px", transition: "all 0.3s", transform: isHovered ? "scale(1.1)" : "scale(1)" }}>
                  {v.icon}
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 10px", color: isHovered ? "var(--color-primary-hover)" : "#fff", transition: "color 0.3s" }}>{v.title}</h3>
                <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.5)", margin: 0, fontWeight: 500 }}>{v.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 120px", maxWidth: "1240px", margin: "0 auto" }}>
        <div style={{ position: "relative", background: "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(217,70,239,0.06) 50%, rgba(15,15,20,0.9) 100%)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: "40px", padding: "80px 48px", textAlign: "center", overflow: "hidden", backdropFilter: "blur(16px)" }}>
          <div style={{ position: "absolute", top: "-60px", left: "50%", transform: "translateX(-50%)", width: "600px", height: "300px", background: "radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-primary)", marginBottom: "20px" }}>
              {aboutData.ctaEyebrow || "Start Saving Today"}
            </div>
            <h2 style={{ fontSize: "clamp(32px, 5vw, 60px)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 20px" }}>
              {aboutData.ctaTitleLine1 || "Every code. Verified."}<br /><span style={{ color: "var(--color-primary)" }}>{aboutData.ctaTitleAccent || "Every time."}</span>
            </h2>
            <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.5)", maxWidth: "500px", margin: "0 auto 40px", lineHeight: 1.7, fontWeight: 500 }}>
              {aboutData.ctaDescription || `Browse ${formatCount(totalStores)} verified stores and start saving on every order — with codes that actually work.`}
            </p>
            <Link href="/stores"
              style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "var(--color-primary)", color: "#000", fontWeight: 900, fontSize: "15px", padding: "16px 36px", borderRadius: "16px", textDecoration: "none", transition: "all 0.2s", boxShadow: "0 0 32px rgba(139,92,246,0.4)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--color-primary-hover)"; e.currentTarget.style.transform = "translateY(-2px) scale(1.02)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--color-primary)"; e.currentTarget.style.transform = "translateY(0) scale(1)"; }}>
              Browse All Stores →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Styles ────────────────────────────────────────────────── */}
      <style>{`
        @keyframes aboutPulse {
          0%, 100% { box-shadow: 0 0 8px var(--color-primary); }
          50%       { box-shadow: 0 0 16px var(--color-primary); }
        }
        @keyframes aboutFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .about-stats-grid   { grid-template-columns: repeat(2, 1fr) !important; }
        .about-mission-grid { grid-template-columns: 1fr !important; }
        .about-steps-grid   { grid-template-columns: 1fr !important; }
        .about-values-grid  { grid-template-columns: 1fr !important; }
        @media (min-width: 640px) {
          .about-stats-grid  { grid-template-columns: repeat(4, 1fr) !important; }
          .about-steps-grid  { grid-template-columns: repeat(2, 1fr) !important; }
          .about-values-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 1024px) {
          .about-mission-grid { grid-template-columns: 1fr 1fr !important; }
          .about-values-grid  { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
