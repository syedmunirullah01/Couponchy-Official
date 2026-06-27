"use client";

import { useState } from "react";
import Link from "next/link";

const SECTIONS = [
  { id: "acceptance", title: "1. Acceptance of Terms" },
  { id: "use-license", title: "2. Use License" },
  { id: "disclaimer", title: "3. Disclaimer of Accuracy" },
  { id: "limitations", title: "4. Limitations of Liability" },
  { id: "revisions", title: "5. Revisions and Errata" },
  { id: "links", title: "6. External Links" },
  { id: "modifications", title: "7. Terms Modifications" },
  { id: "governing-law", title: "8. Governing Law" },
];

export default function TermsOfServicePage({ settings = {} }) {
  const [activeSection, setActiveSection] = useState("acceptance");

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  };

  const supportEmail = settings.supportEmail || "contact@couponchy.com";
  const siteName = settings.siteName || "Couponchy";

  return (
    <div style={{ color: "#fff", fontFamily: "inherit", overflow: "hidden" }}>
      {/* ── BACKGROUND GLOWS ────────────────────────────────────────── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-100px", left: "50%", transform: "translateX(-50%)", width: "900px", height: "500px", background: "radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1240px", margin: "0 auto", padding: "80px 24px 120px" }}>
        
        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: "80px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "999px", padding: "6px 18px", marginBottom: "24px" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-primary)", boxShadow: "0 0 10px var(--color-primary)", display: "inline-block" }} />
            <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-primary)" }}>Agreement</span>
          </div>
          <h1 style={{ fontSize: "clamp(38px, 5vw, 64px)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.04em", margin: "0 0 20px" }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>
            Effective date: March 2026. Please read these terms carefully before using our platform.
          </p>
        </div>

        {/* ── LAYOUT ─────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gap: "60px", gridTemplateColumns: "1fr" }} className="terms-layout-grid">
          
          {/* LEFT: Sticky Table of Contents (Desktop only) */}
          <aside className="terms-toc-sidebar" style={{ position: "sticky", top: "100px", height: "fit-content" }}>
            <div style={{ background: "rgba(15,15,20,0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "28px", backdropFilter: "blur(12px)" }}>
              <h3 style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)", margin: "0 0 20px" }}>Contents</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {SECTIONS.map((sec) => {
                  const isActive = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => scrollToSection(sec.id)}
                      style={{
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        fontSize: "14px",
                        fontWeight: isActive ? 800 : 600,
                        color: isActive ? "var(--color-primary)" : "rgba(255,255,255,0.45)",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        padding: "4px 0",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                      onMouseEnter={e => { if(!isActive) e.currentTarget.style.color = "#fff" }}
                      onMouseLeave={e => { if(!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.45)" }}
                    >
                      {isActive && <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--color-primary)" }} />}
                      {sec.title}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* RIGHT: Detailed Content Blocks */}
          <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
            
            {/* Acceptance */}
            <section id="acceptance" style={{ scrollMarginTop: "120px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "20px", color: "var(--color-primary)" }}>1. Acceptance of Terms</h2>
              <div style={{ background: "rgba(15,15,20,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "36px", backdropFilter: "blur(12px)" }}>
                <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.6)", margin: 0, fontWeight: 500 }}>
                  By accessing the website at {siteName}, you agree to comply with and be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                </p>
              </div>
            </section>

            {/* Use License */}
            <section id="use-license" style={{ scrollMarginTop: "120px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "20px", color: "var(--color-primary)" }}>2. Use License</h2>
              <div style={{ background: "rgba(15,15,20,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "36px", backdropFilter: "blur(12px)", display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.6)", margin: 0, fontWeight: 500 }}>
                  Permission is granted to temporarily view the materials (information or codes) on {siteName} for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "1fr sm:1fr" }} className="terms-license-grid">
                  {[
                    "Modify or copy the materials for commercial distributions.",
                    "Use the materials for any commercial purpose, or for any public display (commercial or non-commercial).",
                    "Attempt to decompile, reverse engineer, or script crawlers against the internal data layers of {siteName}.",
                    "Remove any copyright or other proprietary notations from the materials.",
                  ].map((text, idx) => (
                    <div key={idx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "14px", padding: "20px", fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
                      {text.replace("{siteName}", siteName)}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Disclaimer */}
            <section id="disclaimer" style={{ scrollMarginTop: "120px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "20px", color: "var(--color-primary)" }}>3. Disclaimer of Accuracy</h2>
              <div style={{ background: "rgba(15,15,20,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "36px", backdropFilter: "blur(12px)" }}>
                <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.6)", margin: 0, fontWeight: 500 }}>
                  The materials on {siteName} are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.
                </p>
              </div>
            </section>

            {/* Limitations */}
            <section id="limitations" style={{ scrollMarginTop: "120px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "20px", color: "var(--color-primary)" }}>4. Limitations of Liability</h2>
              <div style={{ background: "rgba(15,15,20,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "36px", backdropFilter: "blur(12px)" }}>
                <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.6)", margin: 0, fontWeight: 500 }}>
                  In no event shall {siteName} or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our platform, even if {siteName} has been notified orally or in writing of the possibility of such damage.
                </p>
              </div>
            </section>

            {/* Revisions */}
            <section id="revisions" style={{ scrollMarginTop: "120px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "20px", color: "var(--color-primary)" }}>5. Revisions and Errata</h2>
              <div style={{ background: "rgba(15,15,20,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "36px", backdropFilter: "blur(12px)" }}>
                <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.6)", margin: 0, fontWeight: 500 }}>
                  The materials appearing on {siteName} could include technical, typographical, or photographic errors. We do not warrant that any of the materials on the platform are accurate, complete, or current. We may make changes to the materials contained on the platform at any time without notice.
                </p>
              </div>
            </section>

            {/* Links */}
            <section id="links" style={{ scrollMarginTop: "120px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "20px", color: "var(--color-primary)" }}>6. External Links</h2>
              <div style={{ background: "rgba(15,15,20,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "36px", backdropFilter: "blur(12px)" }}>
                <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.6)", margin: 0, fontWeight: 500 }}>
                  We have not reviewed all of the sites linked to our website and are not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by {siteName} of the site. Use of any such linked website is at the user's own risk.
                </p>
              </div>
            </section>

            {/* Modifications */}
            <section id="modifications" style={{ scrollMarginTop: "120px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "20px", color: "var(--color-primary)" }}>7. Terms Modifications</h2>
              <div style={{ background: "rgba(15,15,20,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "36px", backdropFilter: "blur(12px)" }}>
                <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.6)", margin: 0, fontWeight: 500 }}>
                  We may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
                </p>
              </div>
            </section>

            {/* Governing Law */}
            <section id="governing-law" style={{ scrollMarginTop: "120px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "20px", color: "var(--color-primary)" }}>8. Governing Law</h2>
              <div style={{ background: "rgba(15,15,20,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "36px", backdropFilter: "blur(12px)" }}>
                <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.6)", margin: 0, fontWeight: 500 }}>
                  These terms and conditions are governed by and construed in accordance with standard legal procedures, and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.
                </p>
              </div>
            </section>

          </div>

        </div>

        {/* ── CONTACT CARD ───────────────────────────────────────────── */}
        <div style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(15,15,20,0.9) 100%)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "32px", padding: "60px 40px", textAlign: "center", marginTop: "80px", backdropFilter: "blur(16px)" }}>
          <h2 style={{ fontSize: "30px", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 16px" }}>Need clarity on our terms?</h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.5)", maxWidth: "460px", margin: "0 auto 32px", lineHeight: 1.6, fontWeight: 500 }}>
            If you have questions about how we define user licenses, rules, or merchant guidelines, contact our team.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/contact"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--color-primary)", color: "#000", fontWeight: 900, fontSize: "14px", padding: "14px 28px", borderRadius: "12px", textDecoration: "none", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--color-primary-hover)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--color-primary)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              Support Center →
            </Link>
            <a href={`mailto:${supportEmail}`}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontWeight: 700, fontSize: "14px", padding: "14px 28px", borderRadius: "12px", textDecoration: "none", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              Email Support
            </a>
          </div>
        </div>

      </div>

      <style>{`
        .terms-layout-grid {
          grid-template-columns: 1fr !important;
        }
        .terms-toc-sidebar {
          display: none;
        }
        .terms-license-grid {
          grid-template-columns: 1fr !important;
        }
        @media (min-width: 640px) {
          .terms-license-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (min-width: 1024px) {
          .terms-layout-grid {
            grid-template-columns: 280px 1fr !important;
          }
          .terms-toc-sidebar {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}
