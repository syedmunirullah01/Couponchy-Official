"use client";

import { useState } from "react";
import Link from "next/link";

export default function PrivacyPolicyPage({ settings = {}, company = null, t = null }) {
  const [activeSection, setActiveSection] = useState("introduction");

  // Helper: returns translated string if available, else English fallback
  const tr = (key, fallback) => (t && t[key]) ? t[key] : fallback;

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  };

  const supportEmail = settings.supportEmail || "contact@couponchy.com";
  const siteName = settings.siteName || "Couponchy";

  const policyData = company?.privacyPolicy || {};

  // Sidebar sections with translated titles
  const SECTIONS = [
    { id: "introduction",          title: tr("section1Title", "1. Introduction") },
    { id: "information-collection",title: tr("section2Title", "2. Information We Collect") },
    { id: "information-use",       title: tr("section3Title", "3. How We Use Information") },
    { id: "cookies",               title: tr("section4Title", "4. Cookies and Tracking") },
    { id: "data-security",         title: tr("section5Title", "5. Data Protection") },
    { id: "third-party-links",     title: tr("section6Title", "6. Third-Party Merchants") },
    { id: "user-rights",           title: tr("section7Title", "7. Your Privacy Rights") },
    { id: "policy-updates",        title: tr("section8Title", "8. Changes to this Policy") },
  ];

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
            <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-primary)" }}>
              {tr("legalDocsBadge", "Legal Docs")}
            </span>
          </div>
          <h1 style={{ fontSize: "clamp(38px, 5vw, 64px)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.04em", margin: "0 0 20px" }}>
            {policyData.title || "Privacy Policy"}
          </h1>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>
            {tr("lastUpdatedPrefix", "Last updated:")} {policyData.lastUpdated || "March 2026"}. {tr("lastUpdatedSuffix", "Learn how we secure and handle your data.")}
          </p>
        </div>

        {/* ── LAYOUT ─────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gap: "60px", gridTemplateColumns: "1fr" }} className="privacy-layout-grid">

          {/* LEFT: Sticky Table of Contents (Desktop only) */}
          <aside className="privacy-toc-sidebar" style={{ position: "sticky", top: "100px", height: "fit-content" }}>
            <div style={{ background: "rgba(15,15,20,0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "28px", backdropFilter: "blur(12px)" }}>
              <h3 style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)", margin: "0 0 20px" }}>
                {tr("contentsLabel", "Contents")}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {SECTIONS.map((sec) => {
                  const isActive = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => scrollToSection(sec.id)}
                      style={{
                        textAlign: "left", background: "none", border: "none",
                        fontSize: "14px", fontWeight: isActive ? 800 : 600,
                        color: isActive ? "var(--color-primary)" : "rgba(255,255,255,0.45)",
                        cursor: "pointer", transition: "all 0.2s", padding: "4px 0",
                        display: "flex", alignItems: "center", gap: "8px",
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = "#fff"; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
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

            {/* 1. Introduction */}
            <section id="introduction" style={{ scrollMarginTop: "120px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "20px", color: "var(--color-primary)" }}>
                {tr("section1Title", "1. Introduction")}
              </h2>
              <div style={{ background: "rgba(15,15,20,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "36px", backdropFilter: "blur(12px)" }}>
                <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.6)", margin: 0, fontWeight: 500 }}>
                  {tr("introText", policyData.introText || `Welcome to ${siteName} ("we", "us", or "our"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safe-keep the information when you visit our platform. By accessing or using our services, you consent to the practices described in this policy.`)}
                </p>
              </div>
            </section>

            {/* 2. Information Collection */}
            <section id="information-collection" style={{ scrollMarginTop: "120px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "20px", color: "var(--color-primary)" }}>
                {tr("section2Title", "2. Information We Collect")}
              </h2>
              <div style={{ background: "rgba(15,15,20,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "36px", backdropFilter: "blur(12px)", display: "flex", flexDirection: "column", gap: "20px" }}>
                <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.6)", margin: 0, fontWeight: 500 }}>
                  {tr("collectText", policyData.collectText || "We prioritize your privacy and minimize data collection. The only data we process is:")}
                </p>
                <ul style={{ paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                  <li style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
                    <strong style={{ color: "#fff" }}>
                      {tr("collectBullet1Title", policyData.collectBullet1Title || "Voluntary Contact Info:")}
                    </strong>{" "}
                    {tr("collectBullet1Desc", policyData.collectBullet1Desc || "Email address, name, or comments if you submit a coupon or use our contact form.")}
                  </li>
                  <li style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
                    <strong style={{ color: "#fff" }}>
                      {tr("collectBullet2Title", policyData.collectBullet2Title || "Usage and Device Data:")}
                    </strong>{" "}
                    {tr("collectBullet2Desc", policyData.collectBullet2Desc || "IP address, country localization (to show relevant regional coupons), browser type, and anonymous interaction stats.")}
                  </li>
                </ul>
              </div>
            </section>

            {/* 3. Information Use */}
            <section id="information-use" style={{ scrollMarginTop: "120px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "20px", color: "var(--color-primary)" }}>
                {tr("section3Title", "3. How We Use Information")}
              </h2>
              <div style={{ background: "rgba(15,15,20,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "36px", backdropFilter: "blur(12px)", display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.6)", margin: 0, fontWeight: 500 }}>
                  {tr("useText", policyData.useText || "We use collected information solely to:")}
                </p>
                <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "1fr" }} className="privacy-uses-grid">
                  {[
                    tr("useGrid1", policyData.useGrid1 || "Deliver regional storefront configurations and active coupon lists."),
                    tr("useGrid2", policyData.useGrid2 || "Verify coupon submissions and validate them using simulated headless browser checkouts."),
                    tr("useGrid3", policyData.useGrid3 || "Process and resolve support requests submitted through our contact channels."),
                    tr("useGrid4", policyData.useGrid4 || "Prevent fraud, security breaches, and coordinate automated abuse prevention."),
                  ].map((text, idx) => (
                    <div key={idx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "14px", padding: "20px", fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 4. Cookies */}
            <section id="cookies" style={{ scrollMarginTop: "120px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "20px", color: "var(--color-primary)" }}>
                {tr("section4Title", "4. Cookies and Tracking")}
              </h2>
              <div style={{ background: "rgba(15,15,20,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "36px", backdropFilter: "blur(12px)" }}>
                <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.6)", margin: 0, fontWeight: 500 }}>
                  {tr("cookiesText", policyData.cookiesText || "We utilize cookies to remember your country preferences (e.g. storing your region preference in cookies) so that you do not need to select it again. These cookies do not track your browsing habits outside our domain. You can disable cookies in your browser settings, though some regional features may fall back to default configurations.")}
                </p>
              </div>
            </section>

            {/* 5. Data Security */}
            <section id="data-security" style={{ scrollMarginTop: "120px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "20px", color: "var(--color-primary)" }}>
                {tr("section5Title", "5. Data Protection")}
              </h2>
              <div style={{ background: "rgba(15,15,20,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "36px", backdropFilter: "blur(12px)" }}>
                <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.6)", margin: 0, fontWeight: 500 }}>
                  {tr("dataSecurityText", policyData.dataSecurityText || "We apply industry-standard security measures, including SSL encryption and secure database controls. We never lease, trade, or sell your personal details to outside marketing agencies or aggregators.")}
                </p>
              </div>
            </section>

            {/* 6. Third-Party Links */}
            <section id="third-party-links" style={{ scrollMarginTop: "120px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "20px", color: "var(--color-primary)" }}>
                {tr("section6Title", "6. Third-Party Merchants")}
              </h2>
              <div style={{ background: "rgba(15,15,20,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "36px", backdropFilter: "blur(12px)" }}>
                <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.6)", margin: 0, fontWeight: 500 }}>
                  {tr("thirdPartyText", policyData.thirdPartyText || "Our site lists deals and links to third-party brand websites. Once you click a link and navigate away, we do not have authority over their privacy structures. We strongly advise checking the individual privacy policies of any site you visit.")}
                </p>
              </div>
            </section>

            {/* 7. User Rights */}
            <section id="user-rights" style={{ scrollMarginTop: "120px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "20px", color: "var(--color-primary)" }}>
                {tr("section7Title", "7. Your Privacy Rights")}
              </h2>
              <div style={{ background: "rgba(15,15,20,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "36px", backdropFilter: "blur(12px)" }}>
                <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.6)", margin: 0, fontWeight: 500 }}>
                  {tr("userRightsText", policyData.userRightsText || "Depending on your localization, you possess rights under the GDPR or CCPA to view, modify, or erase any personal information we hold (e.g. deleting contact form requests). Reach out to us via email to request details.")}
                </p>
              </div>
            </section>

            {/* 8. Policy Updates */}
            <section id="policy-updates" style={{ scrollMarginTop: "120px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "20px", color: "var(--color-primary)" }}>
                {tr("section8Title", "8. Changes to this Policy")}
              </h2>
              <div style={{ background: "rgba(15,15,20,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "36px", backdropFilter: "blur(12px)" }}>
                <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.6)", margin: 0, fontWeight: 500 }}>
                  {tr("policyUpdatesText", policyData.policyUpdatesText || "We reserve the right to revise this Privacy Policy at any time. Any changes will be posted directly on this page with an updated modification date. We recommend checking back periodically to stay informed.")}
                </p>
              </div>
            </section>

          </div>
        </div>

        {/* ── CONTACT CARD ───────────────────────────────────────────── */}
        <div style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(15,15,20,0.9) 100%)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "32px", padding: "60px 40px", textAlign: "center", marginTop: "80px", backdropFilter: "blur(16px)" }}>
          <h2 style={{ fontSize: "30px", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 16px" }}>
            {tr("questionsTitle", "Questions about our policies?")}
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.5)", maxWidth: "460px", margin: "0 auto 32px", lineHeight: 1.6, fontWeight: 500 }}>
            {tr("questionsSubtitle", "If you have questions about how your data is handled or want to exercise your legal rights, contact us directly.")}
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/contact"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--color-primary)", color: "#000", fontWeight: 900, fontSize: "14px", padding: "14px 28px", borderRadius: "12px", textDecoration: "none", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--color-primary-hover)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--color-primary)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              {tr("supportCenterButton", "Support Center →")}
            </Link>
            <Link href="/contact"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontWeight: 700, fontSize: "14px", padding: "14px 28px", borderRadius: "12px", textDecoration: "none", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              {tr("emailSupportButton", "Email Support")}
            </Link>
          </div>
        </div>

      </div>

      <style>{`
        .privacy-layout-grid {
          grid-template-columns: 1fr !important;
        }
        .privacy-toc-sidebar {
          display: none;
        }
        .privacy-uses-grid {
          grid-template-columns: 1fr !important;
        }
        @media (min-width: 640px) {
          .privacy-uses-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (min-width: 1024px) {
          .privacy-layout-grid {
            grid-template-columns: 280px 1fr !important;
          }
          .privacy-toc-sidebar {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}
