"use client";
import { useState, useEffect, useRef } from "react";
import OfferSection from "./OfferSection";
import StoreContent from "./StoreContent";
import StoreHeader from "./StoreHeader";
import StoreSidebar from "./StoreSidebar";
import { getStoreUITranslations } from "./store-translations";
import { buildCountryPath } from "@/lib/countries";

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

export default function SingleStorePage({ singleStore, storeTabs, offerTabs, offers, products, faqs, relatedStores, aboutText }) {
  const t = getStoreUITranslations(singleStore.countryCode);
  const displayedProducts = products || [];

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
    const threshold = 60;

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

  const totalProducts = displayedProducts.length;
  const maxIdx = isMobile ? Math.max(0, totalProducts - 1) : Math.max(0, totalProducts - 2);

  useEffect(() => {
    if (activeIndex > maxIdx) {
      setActiveIndex(maxIdx);
    }
  }, [maxIdx, activeIndex]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? maxIdx : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev >= maxIdx ? 0 : prev + 1));
  };

  const dotCount = Math.max(0, maxIdx + 1);

  return (
    <div className="mx-auto max-w-[1380px] px-4 py-8 sm:px-6 lg:px-8">
      <StoreHeader singleStore={singleStore} storeTabs={storeTabs} offerTabs={offerTabs} offers={offers} t={t} />
      {/* Main: offers left, sidebar right */}
      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Left: main content */}
        <div className="min-w-0 flex-1 space-y-12">
          <OfferSection offers={offers} store={singleStore} t={t} />

          {/* Products Section */}
          {displayedProducts.length > 0 && (
            <section className="border-t border-white/5 pt-12">
              {/* Luxury Section Header */}
              <div className="flex items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                      <path d="M3 6h18" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--accent)] block leading-none mb-1">
                      {t.curatedShowcase || "CURATED SHOWCASE"}
                    </span>
                    <h2 className="text-2xl font-black uppercase tracking-[-0.04em] text-white">
                      {(t.trendingProducts || "Trending {name} Products").replace("{name}", singleStore.name)}
                    </h2>
                  </div>
                </div>
                <div className="hidden lg:block h-[1px] flex-1 bg-gradient-to-r from-[var(--border)] to-transparent ml-6"></div>
              </div>

              {/* Product Grid / Slider */}
              {displayedProducts.length <= 2 ? (
                /* Static Grid for 2 or fewer products */
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                  {displayedProducts.map((product) => {
                    const hasDiscount = product.originalPrice && Number(product.originalPrice) > Number(product.price);
                    const discountPercent = hasDiscount 
                      ? Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100) 
                      : 0;

                    return (
                      <article
                        key={product.id}
                        className="group/card relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] transition duration-500 hover:-translate-y-1 hover:border-[var(--color-primary)]/30 hover:shadow-[0_22px_48px_rgba(0,0,0,0.45)] w-full"
                      >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.14),transparent_36%)] opacity-0 transition duration-500 group-hover/card:opacity-100" />
                        <div className="grid grid-cols-1 sm:grid-cols-[1.05fr_0.95fr]">
                          {/* Product Image Panel */}
                          <div className="relative min-h-[220px] sm:h-[280px] overflow-hidden bg-[var(--surface-soft)]">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.title}
                                className="absolute inset-0 h-full w-full object-cover transition duration-750 ease-out group-hover/card:scale-[1.04]"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-sm text-[var(--muted)]">No image</div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                            {hasDiscount && (
                              <div className="absolute left-4 top-4 inline-flex rounded-full border border-[var(--border)] bg-black/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d8b4fe] backdrop-blur">
                                -{discountPercent}%
                              </div>
                            )}
                          </div>

                          {/* Product Description Panel */}
                          <div className="relative flex flex-col justify-between gap-5 p-5 sm:p-6">
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">{singleStore.name}</p>
                                <h3 className="text-xl font-black tracking-[-0.04em] text-[var(--text)] transition-colors duration-300 group-hover/card:text-[var(--color-primary)] line-clamp-2">
                                  {product.title}
                                </h3>
                                <p className="line-clamp-3 text-xs leading-5 text-[var(--muted)]">{product.description || "Featured product curated from the Couponchy store catalog."}</p>
                              </div>

                              <div className="flex items-end gap-3">
                                <span className="text-xl font-black text-[var(--text)]">${product.price}</span>
                                {product.originalPrice ? (
                                  <span className="text-sm text-[var(--muted)] line-through">${product.originalPrice}</span>
                                ) : null}
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-4 mt-auto">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">Ready to explore</p>
                              <a
                                href={product.productUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-9 items-center justify-center rounded-full border border-white/10 px-5 text-xs font-bold text-white hover:bg-[var(--color-primary)] hover:text-black hover:border-[var(--color-primary)] transition-all duration-300 shadow-sm"
                              >
                                {product.ctaLabel || "View Product"}
                              </a>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                /* Slider Wrapper for more than 2 products */
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
                  {/* Navigation buttons */}
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

                  {/* Slider Track Window */}
                  <div className="overflow-hidden p-2 -m-2">
                    <div 
                      className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] -mx-3"
                      style={{
                        width: `${(displayedProducts.length * 100) / (isMobile ? 1 : 2)}%`,
                        transform: `translateX(-${(activeIndex * 100) / displayedProducts.length}%)`,
                      }}
                    >
                      {displayedProducts.map((product) => {
                        const hasDiscount = product.originalPrice && Number(product.originalPrice) > Number(product.price);
                        const discountPercent = hasDiscount 
                          ? Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100) 
                          : 0;

                        return (
                          <div 
                            key={product.id} 
                            className="px-3 flex-shrink-0"
                            style={{
                              width: `${100 / displayedProducts.length}%`,
                            }}
                          >
                            <article
                              className="group/card relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] transition duration-500 hover:-translate-y-1 hover:border-[var(--color-primary)]/30 hover:shadow-[0_22px_48px_rgba(0,0,0,0.45)] w-full"
                            >
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.14),transparent_36%)] opacity-0 transition duration-500 group-hover/card:opacity-100" />
                              <div className="grid grid-cols-1 sm:grid-cols-[1.05fr_0.95fr]">
                                {/* Product Image Panel */}
                                <div className="relative min-h-[220px] sm:h-[280px] overflow-hidden bg-[var(--surface-soft)]">
                                  {product.image ? (
                                    <img
                                      src={product.image}
                                      alt={product.title}
                                      className="absolute inset-0 h-full w-full object-cover transition duration-750 ease-out group-hover/card:scale-[1.04]"
                                    />
                                  ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-sm text-[var(--muted)]">No image</div>
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                                  {hasDiscount && (
                                    <div className="absolute left-4 top-4 inline-flex rounded-full border border-[var(--border)] bg-black/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d8b4fe] backdrop-blur">
                                      -{discountPercent}%
                                    </div>
                                  )}
                                </div>

                                {/* Product Description Panel */}
                                <div className="relative flex flex-col justify-between gap-5 p-5 sm:p-6">
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">{singleStore.name}</p>
                                      <h3 className="text-xl font-black tracking-[-0.04em] text-[var(--text)] transition-colors duration-300 group-hover/card:text-[var(--color-primary)] line-clamp-2">
                                        {product.title}
                                      </h3>
                                      <p className="line-clamp-3 text-xs leading-5 text-[var(--muted)]">{product.description || "Featured product curated from the Couponchy store catalog."}</p>
                                    </div>

                                    <div className="flex items-end gap-3">
                                      <span className="text-xl font-black text-[var(--text)]">${product.price}</span>
                                      {product.originalPrice ? (
                                        <span className="text-sm text-[var(--muted)] line-through">${product.originalPrice}</span>
                                      ) : null}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-4 mt-auto">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">Ready to explore</p>
                                    <a
                                      href={product.productUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex h-9 items-center justify-center rounded-full border border-white/10 px-5 text-xs font-bold text-white hover:bg-[var(--color-primary)] hover:text-black hover:border-[var(--color-primary)] transition-all duration-300 shadow-sm"
                                    >
                                      {product.ctaLabel || "View Product"}
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </article>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dot navigation indicators */}
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
                </div>
              )}
            </section>
          )}

          <StoreContent singleStore={singleStore} faqs={faqs} t={t} />
        </div>
        {/* Right: sidebar */}
        <StoreSidebar singleStore={singleStore} relatedStores={relatedStores} offers={offers} aboutText={aboutText} t={t} />
      </div>

      {/* How It Works Section */}
      <section className="mt-20 border-t border-white/5 pt-16">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-3.5 py-1.5 text-[9px] font-black uppercase tracking-[0.25em] text-[var(--accent)]">
            {t.savingsGuide}
          </span>
          <h2 className="mt-5 text-3xl sm:text-4xl font-black uppercase tracking-[-0.04em] text-white">
            {t.howToSave.split("{name}")[0]}
            <span className="bg-gradient-to-r from-white via-white to-[var(--color-primary-hover)] bg-clip-text text-transparent">
              {singleStore.name || "this store"}
            </span>
            {t.howToSave.split("{name}")[1] || ""}
          </h2>
          <p className="mt-3.5 text-sm text-white/50 leading-relaxed">
            {t.howToSaveDesc}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Step 1 */}
          <div className="group relative rounded-[24px] border border-white/5 bg-[linear-gradient(180deg,var(--surface-soft)_0%,var(--surface)_100%)] p-6 transition hover:border-[var(--accent)]/45">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-base font-black text-[var(--accent)] transition-all duration-300 group-hover:scale-105">
              01
            </div>
            <h3 className="mt-6 text-lg font-black text-white group-hover:text-[var(--accent)] transition-colors">
              {t.step1Title}
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-white/45">
              {t.step1Desc.replace("{name}", singleStore.name || "this store")}
            </p>
          </div>

          {/* Step 2 */}
          <div className="group relative rounded-[24px] border border-white/5 bg-[linear-gradient(180deg,var(--surface-soft)_0%,var(--surface)_100%)] p-6 transition hover:border-[var(--accent)]/45">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-base font-black text-[var(--accent)] transition-all duration-300 group-hover:scale-105">
              02
            </div>
            <h3 className="mt-6 text-lg font-black text-white group-hover:text-[var(--accent)] transition-colors">
              {t.step2Title}
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-white/45">
              {t.step2Desc.replace("{name}", singleStore.name || "this store")}
            </p>
          </div>

          {/* Step 3 */}
          <div className="group relative rounded-[24px] border border-white/5 bg-[linear-gradient(180deg,var(--surface-soft)_0%,var(--surface)_100%)] p-6 transition hover:border-[var(--accent)]/45">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-base font-black text-[var(--accent)] transition-all duration-300 group-hover:scale-105">
              03
            </div>
            <h3 className="mt-6 text-lg font-black text-white group-hover:text-[var(--accent)] transition-colors">
              {t.step3Title}
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-white/45">
              {t.step3Desc.replace("{name}", singleStore.name || "this store")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
