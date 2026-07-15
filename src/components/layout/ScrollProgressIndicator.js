"use client";
import { useState, useEffect, useRef } from "react";

export default function ScrollProgressIndicator() {
  const [scrollPercent, setScrollPercent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const trackRef = useRef(null);

  const updateScrollPercent = () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) {
      setScrollPercent(0);
      return;
    }
    const pct = (window.scrollY / docHeight) * 100;
    setScrollPercent(pct);
  };

  useEffect(() => {
    setMounted(true);
    window.addEventListener("scroll", updateScrollPercent);
    window.addEventListener("resize", updateScrollPercent);
    updateScrollPercent(); // Initial trigger

    return () => {
      window.removeEventListener("scroll", updateScrollPercent);
      window.removeEventListener("resize", updateScrollPercent);
    };
  }, []);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);

    // Scroll immediately to the clicked position on mouse down
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const percentage = clickY / rect.height;
    const scrollTarget = percentage * (document.documentElement.scrollHeight - window.innerHeight);

    window.scrollTo({
      top: scrollTarget,
      behavior: "auto",
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const dragY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      const percentage = dragY / rect.height;
      const scrollTarget = percentage * (document.documentElement.scrollHeight - window.innerHeight);

      window.scrollTo({
        top: scrollTarget,
        behavior: "auto",
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (typeof document !== "undefined") {
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
      }
    };
  }, [isDragging]);

  if (!mounted) return null;

  return (
    <div
      className="fixed right-0 top-0 bottom-0 h-screen z-50 flex flex-col items-center group select-none transition-all duration-300 w-1.5 hover:w-2.5"
    >
      {/* Scrollbar Track */}
      <div
        ref={trackRef}
        onMouseDown={handleMouseDown}
        className="relative w-full h-full bg-white/[0.03] group-hover:bg-white/[0.08] border-l border-white/10 cursor-pointer backdrop-blur-[1px] transition-colors duration-300"
      >
        {/* Dynamic Progress Fill (Clean growing gradient) */}
        <div
          className="absolute top-0 left-0 right-0 bg-gradient-to-b from-[#a855f7] via-[var(--color-primary)] to-[#ec4899] shadow-[0_0_15px_rgba(139,92,246,0.5)] opacity-60 group-hover:opacity-90 transition-opacity"
          style={{ height: `${scrollPercent}%` }}
        />
      </div>
    </div>
  );
}
