import Link from "next/link";

export default function SectionHeader({ title, centered = false, href = "#" }) {
  return (
    <div
      className={`mb-10 flex items-center gap-4 ${centered ? "flex-col items-center text-center" : "justify-between"}`}
    >
      <div>
        <h2 className="font-sans text-[28px] font-black uppercase tracking-tight text-white/90 sm:text-[34px] transition-colors duration-300">
          {title}
        </h2>
        
        {/* Laser gradient divider line with glowing beginning node */}
        <div className={`relative mt-4 flex items-center ${centered ? "justify-center" : ""}`}>
          <div className="h-[2px] w-32 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary)]/45 to-transparent" />
          <div className="absolute -left-0.5 h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)] animate-pulse" />
        </div>
      </div>
      
      {!centered ? (
        <Link
          href={href}
          className="group inline-flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.01] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/50 transition-all duration-300 hover:border-[var(--color-primary)]/20 hover:bg-white/[0.04] hover:text-white hover:shadow-[0_0_15px_rgba(139,92,246,0.15)] hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>View All</span>
          <span className="text-[12px] leading-none transition-transform duration-300 group-hover:translate-x-0.5">→</span>
        </Link>
      ) : null}
    </div>
  );
}
