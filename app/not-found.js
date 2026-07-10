import Link from "next/link";
import { getPublicSiteSettings } from "@/server/services/settings-service";

export const metadata = {
  title: "404 – Page Not Found",
  description: "The page you are looking for could not be found.",
};

export default async function NotFound() {
  const settings = await getPublicSiteSettings();
  const siteName = settings?.siteName || "Couponchy";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#030305] px-6 text-center">

      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-primary)]/8 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-[300px] w-[400px] rounded-full bg-purple-900/15 blur-[100px]" />

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Watermark site name */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none text-center text-[22vw] font-black uppercase leading-none tracking-tighter text-white/[0.03] notranslate"
      >
        {siteName}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center gap-6">

        {/* 404 Number */}
        <div className="relative">
          <span className="block text-[120px] leading-none font-black tracking-tighter"
            style={{
              background: "linear-gradient(135deg, var(--color-primary) 0%, #a855f7 50%, var(--color-primary) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 40px rgba(139,92,246,0.3))",
            }}
          >
            404
          </span>
          {/* Decorative line below 404 */}
          <div className="mx-auto mt-1 h-px w-24 bg-gradient-to-r from-transparent via-[var(--color-primary)]/60 to-transparent" />
        </div>

        {/* Error badge */}
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/8 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
          Page Not Found
        </span>

        {/* Title */}
        <h1 className="max-w-md text-2xl font-black text-white/90 leading-snug tracking-tight">
          Oops! This page doesn&apos;t exist
        </h1>

        {/* Description */}
        <p className="max-w-sm text-sm text-white/40 leading-relaxed font-medium">
          The link you followed may be broken, or the page may have been removed. Let us take you somewhere useful.
        </p>

        {/* CTA Buttons */}
        <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="group relative inline-flex h-11 items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-[var(--color-primary)] px-7 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(139,92,246,0.35)] active:translate-y-0.5"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Back to {siteName}
          </Link>

          <Link
            href="/stores"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 text-sm font-bold text-white/70 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            Browse All Stores
          </Link>
        </div>

        {/* Divider */}
        <div className="mt-4 h-px w-32 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Branding footer */}
        <p className="text-[11px] text-white/20 font-medium notranslate">
          {siteName} &mdash; Best Deals &amp; Coupon Codes
        </p>
      </div>
    </div>
  );
}
