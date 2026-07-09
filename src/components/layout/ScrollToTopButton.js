"use client";

import { useEffect, useState } from "react";

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      style={{
        position: "fixed",
        bottom: "32px",
        right: "28px",
        zIndex: 9999,
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        border: "1px solid rgba(139,92,246,0.35)",
        background: hovered
          ? "var(--color-primary)"
          : "rgba(12,12,18,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: hovered
          ? "0 0 24px rgba(139,92,246,0.5), 0 8px 32px rgba(0,0,0,0.4)"
          : "0 4px 20px rgba(0,0,0,0.4), 0 0 10px rgba(139,92,246,0.15)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: hovered ? "#000" : "var(--color-primary)",
        transition: "all 0.25s cubic-bezier(0.22,1,0.36,1)",
        // Visibility animation
        opacity: visible ? 1 : 0,
        transform: visible
          ? (hovered ? "translateY(-4px) scale(1.08)" : "translateY(0) scale(1)")
          : "translateY(16px) scale(0.85)",
        pointerEvents: visible ? "auto" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Arrow up icon */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          width: 18,
          height: 18,
          transition: "transform 0.2s ease",
          transform: hovered ? "translateY(-1px)" : "translateY(0)",
        }}
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  );
}
