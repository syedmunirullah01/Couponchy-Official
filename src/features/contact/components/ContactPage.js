"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ContactPage({ settings = {}, company = null, t = null }) {
  // Helper: returns translated string if available, else English fallback
  const tr = (key, fallback) => (t && t[key]) ? t[key] : fallback;

  // ─── Dynamic FAQ items (translated if t is available) ──────────────────────
  const FAQS = [
    {
      question: tr("faq1Question", "How do I submit a new coupon code?"),
      answer: tr("faq1Answer", "You can submit a coupon directly using this contact form! Just select 'Submit a Coupon' as the subject, fill in the store name and the code details in the message, and our automated validation agents will verify and list it within a few hours."),
    },
    {
      question: tr("faq2Question", "Are all coupon codes on Couponchy free to use?"),
      answer: tr("faq2Answer", "Absolutely! Couponchy is 100% free for everyone. We do not require any registration, sign-ups, or subscriptions. Just copy the code and save instantly at checkout."),
    },
    {
      question: tr("faq3Question", "How does the automated verification system work?"),
      answer: tr("faq3Answer", "We deploy headless Playwright browser agents that automatically simulate checkouts for each merchant. If a coupon successfully reduces the price in our test environment, it is marked as verified and prioritized in our lists."),
    },
    {
      question: tr("faq4Question", "Do you offer advertising or partnership options?"),
      answer: tr("faq4Answer", "Yes, we collaborate with top-tier brands and affiliate networks. If you want to promote your store or showcase a featured offer, select 'Partnership / Advertising' in the contact form, and our partnerships lead will reach out to you."),
    },
  ];

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "support",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");

  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let result = "";
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(result);
    setCaptchaInput("");
    
    // Brief timeout ensures canvas is loaded in DOM
    setTimeout(() => {
      drawCaptchaCanvas(result);
    }, 50);
  };

  const drawCaptchaCanvas = (code) => {
    const canvas = document.getElementById("captcha-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#050507");
    gradient.addColorStop(1, "#151520");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(139, 92, 246, ${Math.random() * 0.35})`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2 + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(139, 92, 246, ${Math.random() * 0.3})`;
      ctx.lineWidth = Math.random() * 1.5 + 0.5;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    ctx.font = "italic bold 22px Outfit, sans-serif";
    ctx.textBaseline = "middle";
    
    const letterSpacing = canvas.width / (code.length + 1);
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      ctx.save();
      const x = (i + 1) * letterSpacing - 5 + Math.random() * 10;
      const y = canvas.height / 2 + Math.random() * 6 - 3;
      ctx.translate(x, y);
      const angle = (Math.random() * 24 - 12) * Math.PI / 180;
      ctx.rotate(angle);
      const colors = ["#8b5cf6", "#d946ef", "#c084fc", "#f472b6", "#ffffff"];
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.fillText(char, -8, 0);
      ctx.restore();
    }
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle Subject Chip selection
  const handleSelectSubject = (val) => {
    setFormData((prev) => ({ ...prev, subject: val }));
  };

  // Form Validation
  const validateForm = () => {
    const tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = tr("nameRequired", "Name is required");
    if (!formData.email.trim()) {
      tempErrors.email = tr("emailRequired", "Email is required");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = tr("emailInvalid", "Please enter a valid email address");
    }
    if (!formData.message.trim()) tempErrors.message = tr("messageRequired", "Message is required");
    else if (formData.message.trim().length < 10) tempErrors.message = tr("messageTooShort", "Message must be at least 10 characters");

    if (!captchaInput.trim()) {
      tempErrors.captcha = tr("captchaRequired", "Verification code is required");
    } else if (captchaInput.trim().toLowerCase() !== captchaCode.toLowerCase()) {
      tempErrors.captcha = tr("captchaIncorrect", "Incorrect verification code");
      generateCaptcha();
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsSuccess(true);
        setFormData({
          name: "",
          email: "",
          subject: "support",
          message: "",
        });
        setCaptchaInput("");
        generateCaptcha();
      } else {
        const data = await res.json();
        setErrors({ submit: data.error || tr("submitError", "Failed to submit message.") });
      }
    } catch (err) {
      console.error("Submission error:", err);
      setErrors({ submit: tr("submitError", "Something went wrong. Please try again.") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const supportEmail = company?.contactUs?.email || settings.supportEmail || "support@couponchy.com";
  const formEnabled = company?.contactUs?.formEnabled !== false;

  const displayTitle = company?.contactUs?.title || tr("headerTitle", "Connect with");
  const displaySubtitle = company?.contactUs?.subtitle || tr("headerSubtitle", "Have a question, want to submit a coupon, or looking to partner? Reach out and we'll respond within 24 hours.");
  const displayFormNote = company?.contactUs?.formNote || tr("formNoteDefault", "Fill out the form below and we'll get back to you within 24 hours.");

  // Subject chips with translated labels
  const subjectChips = [
    { id: "support", label: tr("subjectSupport", "Support") },
    { id: "coupon", label: tr("subjectCoupon", "Submit a Coupon") },
    { id: "partnership", label: tr("subjectPartnership", "Partnership") },
    { id: "other", label: tr("subjectOther", "Other") },
  ];

  return (
    <div style={{ color: "#fff", fontFamily: "inherit", overflow: "hidden" }}>
      {/* ── BACKGROUND GLOWS ────────────────────────────────────────── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-100px", left: "50%", transform: "translateX(-50%)", width: "1000px", height: "600px", background: "radial-gradient(ellipse, rgba(139,92,246,0.1) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: "400px", right: "-100px", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 75%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1240px", margin: "0 auto", padding: "80px 24px 120px" }}>
        
        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: "72px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "999px", padding: "6px 18px", marginBottom: "24px" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-primary)", boxShadow: "0 0 10px var(--color-primary)", display: "inline-block" }} />
            <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-primary)" }}>
              {tr("getInTouchBadge", "Get In Touch")}
            </span>
          </div>
          <h1 style={{ fontSize: "clamp(38px, 5vw, 64px)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.04em", margin: "0 0 20px", wordBreak: "break-word", overflowWrap: "break-word" }}>
            {displayTitle} {!company?.contactUs?.title && <span style={{ color: "var(--color-primary)" }}>Couponchy</span>}
          </h1>
          <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.5)", maxWidth: "520px", margin: "0 auto", lineHeight: 1.6, fontWeight: 500 }}>
            {displaySubtitle}
          </p>
        </div>

        {/* ── GRID LAYOUT ────────────────────────────────────────────── */}
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] items-start mb-20">
          
          {/* LEFT: Contact Cards & Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Support Email Card */}
            <div style={{ background: "rgba(15,15,20,0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "32px", backdropFilter: "blur(12px)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: "120px", height: "120px", background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)" }} />
              <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 22, height: 22 }}>
                    <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", margin: "0 0 4px" }}>
                    {tr("emailUsLabel", "Email Us")}
                  </h3>
                  <a href={`mailto:${supportEmail}`} style={{ fontSize: "18px", fontWeight: 800, color: "#fff", textDecoration: "none", transition: "color 0.2s", wordBreak: "break-all" }} onMouseEnter={e => e.currentTarget.style.color = "var(--color-primary)"} onMouseLeave={e => e.currentTarget.style.color = "#fff"}>
                    {supportEmail}
                  </a>
                </div>
              </div>
            </div>

            {/* Partnership Card */}
            <div style={{ background: "rgba(15,15,20,0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "32px", backdropFilter: "blur(12px)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: "120px", height: "120px", background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)" }} />
              <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 22, height: 22 }}>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", margin: "0 0 4px" }}>
                    {tr("partnershipsLabel", "Partnerships")}
                  </h3>
                  <p style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "rgba(255,255,255,0.85)", wordBreak: "break-all" }}>
                    partners@couponchy.com
                  </p>
                </div>
              </div>
            </div>

            {/* Business Hours, Address & Phone Card */}
            {(company?.contactUs?.phone || company?.contactUs?.address || company?.contactUs?.businessHours) ? (
              <div style={{ background: "rgba(15,15,20,0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "32px", backdropFilter: "blur(12px)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -20, right: -20, width: "120px", height: "120px", background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {company.contactUs.phone && (
                    <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)", flexShrink: 0 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </div>
                      <div>
                        <h4 style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", margin: "0 0 2px" }}>
                          {tr("phoneLabel", "Phone")}
                        </h4>
                        <p style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "#fff" }}>
                          {company.contactUs.phone}
                        </p>
                      </div>
                    </div>
                  )}

                  {company.contactUs.address && (
                    <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)", flexShrink: 0 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <div>
                        <h4 style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", margin: "0 0 2px" }}>
                          {tr("addressLabel", "Office")}
                        </h4>
                        <p style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "#fff" }}>
                          {company.contactUs.address}
                        </p>
                      </div>
                    </div>
                  )}

                  {company.contactUs.businessHours && (
                    <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)", flexShrink: 0 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <div>
                        <h4 style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", margin: "0 0 2px" }}>
                          {tr("hoursLabel", "Business Hours")}
                        </h4>
                        <p style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "#fff" }}>
                          {company.contactUs.businessHours}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Social Channels Card */}
            <div style={{ background: "rgba(15,15,20,0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "32px", backdropFilter: "blur(12px)" }}>
              <h3 style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", margin: "0 0 18px" }}>
                {tr("followUpdatesLabel", "Follow Our Updates")}
              </h3>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {["Instagram", "Facebook", "TikTok", "YouTube"].map((platform) => (
                  <Link
                    key={platform}
                    href={settings.social?.[platform.toLowerCase()] || `https://${platform.toLowerCase()}.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[90px] text-center py-3 rounded-xl border border-white/5 bg-[#09090c] text-xs font-bold text-white/50 transition-all hover:border-[var(--color-primary)]/20 hover:text-white hover:bg-white/[0.02]"
                  >
                    {platform}
                  </Link>
                ))}
              </div>
            </div>

            {/* Premium Visual Mock Map Card */}
            <div style={{ background: "rgba(15,15,20,0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "24px", backdropFilter: "blur(12px)", position: "relative", height: "180px", overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
              {/* Fake abstract map lines */}
              <div style={{ position: "absolute", inset: 0, opacity: 0.15, pointerEvents: "none" }}>
                <svg width="100%" height="100%">
                  <line x1="10%" y1="0" x2="40%" y2="100%" stroke="#8b5cf6" strokeWidth="1.5" />
                  <line x1="90%" y1="0" x2="30%" y2="100%" stroke="#8b5cf6" strokeWidth="1" />
                  <line x1="0" y1="30%" x2="100%" y2="50%" stroke="#8b5cf6" strokeWidth="1" />
                  <line x1="0" y1="80%" x2="100%" y2="70%" stroke="#8b5cf6" strokeWidth="2" />
                  <circle cx="43%" cy="53%" r="6" fill="#8b5cf6" />
                  <circle cx="43%" cy="53%" r="18" fill="none" stroke="#8b5cf6" strokeWidth="1" style={{ animation: "aboutPulse 3s infinite" }} />
                </svg>
              </div>
              <div style={{ position: "relative", zIndex: 1, display: "flex", gap: "10px", alignItems: "center", background: "rgba(9,9,12,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "12px 18px", width: "100%", backdropFilter: "blur(8px)" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px #10b981" }} />
                <div>
                  <h4 style={{ fontSize: "12px", fontWeight: 800, margin: 0 }}>
                    {tr("globalNetworkTitle", "Global Automated Network")}
                  </h4>
                  <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>
                    {tr("globalNetworkSubtitle", "Playwright validation running across 10 regions")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Contact Form / Success Message / Form Disabled Message */}
          <div style={{ background: "rgba(15,15,20,0.6)", border: "1px solid rgba(139,92,246,0.12)", borderRadius: "32px", padding: "40px", backdropFilter: "blur(12px)", boxShadow: "0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
            
            {!formEnabled ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(239,68,68,0.1)", border: "2px solid #ef4444", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", margin: "0 auto 28px", color: "#ef4444" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 32, height: 32, marginTop: "20px" }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h2 style={{ fontSize: "24px", fontWeight: 900, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
                  {tr("formDisabledTitle", "Form Offline")}
                </h2>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.55)", lineHeight: 1.6, maxWidth: "340px", margin: "0 auto", fontWeight: 500 }}>
                  {tr("formDisabledDesc", "The online contact form is currently offline. Please reach out to us directly via our support email above.")}
                </p>
              </div>
            ) : isSuccess ? (
              /* Success State */
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(139,92,246,0.1)", border: "2px solid var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", color: "var(--color-primary)", boxShadow: "0 0 30px rgba(139,92,246,0.2)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: 32, height: 32 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 style={{ fontSize: "28px", fontWeight: 900, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
                  {tr("successTitle", "Message Received!")}
                </h2>
                <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.55)", lineHeight: 1.6, maxWidth: "340px", margin: "0 auto 36px", fontWeight: 500 }}>
                  {tr("successSubtitle", "Thank you for reaching out to us. Our support crew will review your request and get back to you shortly.")}
                </p>
                <button
                  onClick={() => setIsSuccess(false)}
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontWeight: 700, fontSize: "14px", padding: "12px 28px", borderRadius: "12px", cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                >
                  {tr("sendAnotherMessage", "Send another message")}
                </button>
              </div>
            ) : (
              /* Contact Form Input fields */
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                
                {/* Form Note */}
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", margin: "0 0 8px", fontWeight: 500, lineHeight: 1.5 }}>
                  {displayFormNote}
                </p>

                {/* Row: Name and Email */}
                <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "1fr" }} className="form-row-2col">
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)", marginBottom: "8px" }}>
                      {tr("yourNameLabel", "Your Name")}
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Alex Mercer"
                      style={{ width: "100%", height: "50px", background: "rgba(5,5,7,0.8)", border: errors.name ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", paddingLeft: "16px", paddingRight: "16px", color: "#fff", fontSize: "14px", outline: "none", transition: "all 0.2s" }}
                      className="focus:border-[var(--color-primary)]/40 focus:ring-2 focus:ring-[rgba(139,92,246,0.1)]"
                    />
                    {errors.name && <span style={{ fontSize: "12px", color: "#ef4444", fontWeight: 700, marginTop: "4px", display: "block" }}>{errors.name}</span>}
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)", marginBottom: "8px" }}>
                      {tr("emailAddressLabel", "Email Address")}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="alex@example.com"
                      style={{ width: "100%", height: "50px", background: "rgba(5,5,7,0.8)", border: errors.email ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", paddingLeft: "16px", paddingRight: "16px", color: "#fff", fontSize: "14px", outline: "none", transition: "all 0.2s" }}
                      className="focus:border-[var(--color-primary)]/40 focus:ring-2 focus:ring-[rgba(139,92,246,0.1)]"
                    />
                    {errors.email && <span style={{ fontSize: "12px", color: "#ef4444", fontWeight: 700, marginTop: "4px", display: "block" }}>{errors.email}</span>}
                  </div>
                </div>

                {/* Subject Selector Chips */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)", marginBottom: "12px" }}>
                    {tr("subjectLabel", "Subject")}
                  </label>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {subjectChips.map((subject) => {
                      const isSelected = formData.subject === subject.id;
                      return (
                        <button
                          key={subject.id}
                          type="button"
                          onClick={() => handleSelectSubject(subject.id)}
                          style={{
                            background: isSelected ? "var(--color-primary)" : "rgba(255,255,255,0.03)",
                            border: isSelected ? "1px solid var(--color-primary)" : "1px solid rgba(255,255,255,0.05)",
                            color: isSelected ? "#000" : "rgba(255,255,255,0.6)",
                            padding: "8px 18px",
                            borderRadius: "10px",
                            fontSize: "12px",
                            fontWeight: 800,
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={e => {
                            if (!isSelected) {
                              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                              e.currentTarget.style.color = "#fff";
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isSelected) {
                              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                              e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                            }
                          }}
                        >
                          {subject.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Message Box */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)", marginBottom: "8px" }}>
                    {tr("messageLabel", "Message")}
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="6"
                    placeholder={tr("messagePlaceholder", "Describe your request in detail...")}
                    style={{ width: "100%", background: "rgba(5,5,7,0.8)", border: errors.message ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px", color: "#fff", fontSize: "14px", outline: "none", transition: "all 0.2s", resize: "vertical", fontFamily: "inherit" }}
                    className="focus:border-[var(--color-primary)]/40 focus:ring-2 focus:ring-[rgba(139,92,246,0.1)]"
                  />
                  {errors.message && <span style={{ fontSize: "12px", color: "#ef4444", fontWeight: 700, marginTop: "4px", display: "block" }}>{errors.message}</span>}
                </div>

                {/* Graphical Captcha Verification */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)" }}>
                    {tr("securityVerificationLabel", "Security Verification")}
                  </label>
                  
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <canvas 
                        id="captcha-canvas" 
                        width="130" 
                        height="46" 
                        style={{ borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)", background: "#050507" }} 
                      />
                      <button
                        type="button"
                        onClick={generateCaptcha}
                        title="Get a new code"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--color-primary)", transition: "all 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}>
                          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                        </svg>
                      </button>
                    </div>

                    <div style={{ flex: 1, minWidth: "140px" }}>
                      <input
                        type="text"
                        name="captcha"
                        value={captchaInput}
                        onChange={(e) => {
                          setCaptchaInput(e.target.value);
                          if (errors.captcha) {
                            setErrors((prev) => ({ ...prev, captcha: "" }));
                          }
                        }}
                        placeholder={tr("captchaPlaceholder", "Enter code")}
                        style={{ width: "100%", height: "46px", background: "rgba(5,5,7,0.8)", border: errors.captcha ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", paddingLeft: "16px", paddingRight: "16px", color: "#fff", fontSize: "14px", outline: "none", transition: "all 0.2s" }}
                        className="focus:border-[var(--color-primary)]/40 focus:ring-2 focus:ring-[rgba(139,92,246,0.1)]"
                      />
                    </div>
                  </div>
                  {errors.captcha && (
                    <span style={{ fontSize: "12px", color: "#ef4444", fontWeight: 700, marginTop: "2px", display: "block" }}>
                      {errors.captcha}
                    </span>
                  )}
                </div>

                {errors.submit && (
                  <p style={{ fontSize: "12px", color: "#ef4444", fontWeight: 700, textAlign: "center" }}>
                    {errors.submit}
                  </p>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group/btn relative overflow-hidden flex items-center justify-center h-14 rounded-xl bg-[var(--color-primary)] text-black font-black transition-all hover:bg-[var(--color-primary-hover)] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  style={{ border: "none", fontSize: "15px", width: "100%", boxShadow: "0 0 20px rgba(139,92,246,0.2)" }}
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-1000 group-hover/btn:translate-x-full" />
                  <span className="relative z-10 flex items-center gap-2">
                    {isSubmitting ? tr("processing", "Processing...") : tr("sendMessage", "Send Message →")}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── FAQ SECTION ────────────────────────────────────────────── */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "80px" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{ fontSize: "36px", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 10px" }}>
              {tr("faqTitle", "Frequently Asked Questions")}
            </h2>
            <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)" }}>
              {tr("faqSubtitle", "Quick answers to general inquiries about submissions, ads, and support.")}
            </p>
          </div>

          <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
            {FAQS.map((faq, index) => {
              const isExpanded = expandedFaq === index;
              return (
                <div
                  key={index}
                  style={{
                    background: "rgba(15,15,20,0.4)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: "16px",
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                  }}
                >
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : index)}
                    style={{
                      width: "100%",
                      padding: "20px 24px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "transparent",
                      border: "none",
                      color: "#fff",
                      fontSize: "16px",
                      fontWeight: 800,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = "var(--color-primary)"}
                    onMouseLeave={e => { if(!isExpanded) e.currentTarget.style.color = "#fff" }}
                  >
                    <span>{faq.question}</span>
                    <span style={{
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                      color: "var(--color-primary)",
                      fontWeight: "black",
                      fontSize: "18px",
                      lineHeight: 1,
                    }}>
                      ▾
                    </span>
                  </button>
                  <div
                    style={{
                      maxHeight: isExpanded ? "200px" : "0px",
                      opacity: isExpanded ? 1 : 0,
                      overflow: "hidden",
                      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                      padding: isExpanded ? "0 24px 20px" : "0 24px 0",
                    }}
                  >
                    <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.5)", margin: 0, fontWeight: 500 }}>
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <style>{`
        .form-row-2col {
          grid-template-columns: 1fr !important;
        }
        @media (min-width: 640px) {
          .form-row-2col {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @keyframes aboutPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 0.1; }
        }
      `}</style>
    </div>
  );
}
