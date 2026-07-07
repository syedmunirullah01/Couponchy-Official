"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import SectionHeader from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/Button";

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export default function FeaturedProductsSection({ featuredProducts, title = "Featured Products" }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const timerRef = useRef(null);

  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (clientX) => {
    setIsPaused(true);
    setStartX(clientX);
    setCurrentX(clientX);
    setIsDragging(true);
  };

  const handleDragMove = (clientX) => {
    if (!isDragging) return;
    setCurrentX(clientX);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    const diff = startX - currentX;
    const threshold = 60; // minimum pixels for swipe/drag detection

    if (diff > threshold) {
      handleNext();
    } else if (diff < -threshold) {
      handlePrev();
    }

    setIsDragging(false);
    setIsPaused(false);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalProducts = featuredProducts?.length || 0;
  // Calculate maximum index to prevent sliding into empty spaces
  const maxIdx = isMobile ? Math.max(0, totalProducts - 1) : Math.max(0, totalProducts - 2);

  // Synchronize index if viewport resize changes maxIdx below activeIndex
  useEffect(() => {
    if (activeIndex > maxIdx) {
      setActiveIndex(maxIdx);
    }
  }, [maxIdx, activeIndex]);

  // Auto-scroll effect
  useEffect(() => {
    if (isPaused || totalProducts <= 0 || maxIdx <= 0) return;

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev >= maxIdx ? 0 : prev + 1));
    }, 1500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, totalProducts, maxIdx]);

  if (totalProducts <= 0) {
    return (
      <section>
        <SectionHeader title={title} />
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <p className="text-lg font-semibold text-[var(--text)]">No products available</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Add products from admin and feature them here to create a richer homepage mix.</p>
        </div>
      </section>
    );
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? maxIdx : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev >= maxIdx ? 0 : prev + 1));
  };

  const dotCount = Math.max(0, maxIdx + 1);

  return (
    <section className="relative w-full">
      <SectionHeader title={title} href="/stores" />

      {/* Slider Container Wrapper */}
      <div 
        className="group relative w-full overflow-hidden select-none cursor-grab active:cursor-grabbing"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          setIsPaused(false);
          if (isDragging) handleDragEnd();
        }}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
        onTouchEnd={handleDragEnd}
        onMouseDown={(e) => handleDragStart(e.clientX)}
        onMouseMove={(e) => handleDragMove(e.clientX)}
        onMouseUp={handleDragEnd}
      >
        {/* Navigation Buttons (Hidden on mobile, fade in on hover of container on desktop) */}
        {maxIdx > 0 && (
          <>
            <button
              onClick={handlePrev}
              type="button"
              className="absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white backdrop-blur transition-all duration-300 md:flex md:opacity-0 md:group-hover:opacity-100 hover:bg-[var(--color-primary)] hover:text-black hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
              aria-label="Previous Slide"
            >
              <ChevronLeftIcon />
            </button>
            <button
              onClick={handleNext}
              type="button"
              className="absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white backdrop-blur transition-all duration-300 md:flex md:opacity-0 md:group-hover:opacity-100 hover:bg-[var(--color-primary)] hover:text-black hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
              aria-label="Next Slide"
            >
              <ChevronRightIcon />
            </button>
          </>
        )}

        {/* Outer Slider Window */}
        <div className="overflow-hidden p-2 -m-2">
          {/* Animated Sliding Track */}
          <div 
            className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] -mx-3"
            style={{
              width: `${(totalProducts * 100) / (isMobile ? 1 : 2)}%`,
              transform: `translateX(-${(activeIndex * 100) / totalProducts}%)`,
            }}
          >
            {featuredProducts.map((product) => (
              <div 
                key={product.id} 
                className="px-3 flex-shrink-0"
                style={{
                  width: `${100 / totalProducts}%`,
                }}
              >
                <article
                  className="group/card relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] transition duration-500 hover:-translate-y-1 hover:border-[var(--color-primary)]/30 hover:shadow-[0_22px_48px_rgba(0,0,0,0.45)]"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.14),transparent_36%)] opacity-0 transition duration-500 group-hover/card:opacity-100" />
                  <div className="grid grid-cols-1 sm:grid-cols-[1.05fr_0.95fr]">
                    {/* Product Image Panel */}
                    <div className="relative min-h-[220px] sm:h-[280px] overflow-hidden bg-[var(--surface-soft)]">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.title}
                          fill
                          className="object-cover transition duration-750 ease-out group-hover/card:scale-[1.04]"
                          unoptimized
                          draggable={false}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-sm text-[var(--muted)]">No image</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                      <div className="absolute left-4 top-4 inline-flex rounded-full border border-[var(--border)] bg-black/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)] backdrop-blur">
                        {product.status || "Active"}
                      </div>
                    </div>

                    {/* Product Description Panel */}
                    <div className="relative flex flex-col justify-between gap-5 p-5 sm:p-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">{product.storeName}</p>
                          <h3 className="text-2xl font-black tracking-[-0.04em] text-[var(--text)] transition-colors duration-300 group-hover/card:text-[var(--color-primary)]">{product.title}</h3>
                          <p className="line-clamp-3 text-sm leading-6 text-[var(--muted)]">{product.description || "Featured product curated from the Couponchy store catalog."}</p>
                        </div>

                        <div className="flex items-end gap-3">
                          <span className="text-2xl font-black text-[var(--text)]">${product.price}</span>
                          {product.originalPrice ? (
                            <span className="text-sm text-[var(--muted)] line-through">${product.originalPrice}</span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">Ready to explore</p>
                        <Button asChild variant="outline" size="sm" className="rounded-full px-5 hover:bg-[var(--color-primary)] hover:text-black hover:border-[var(--color-primary)] transition-all duration-300">
                          <Link href={product.productUrl} target="_blank" rel="noopener noreferrer">
                            {product.ctaLabel || "View Product"}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress / Navigation Dots */}
      {dotCount > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {Array.from({ length: dotCount }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              type="button"
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                activeIndex === idx 
                  ? "w-6 bg-[var(--color-primary)]" 
                  : "w-2 bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
