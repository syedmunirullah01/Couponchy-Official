export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="mt-12 flex items-center justify-center gap-2">
      {/* Previous Page Button */}
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-[#0e0e13]/60 text-white/50 transition cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed hover:border-violet-500/30 hover:bg-[#13131b]/80 hover:text-white active:scale-95 shrink-0"
        title="Previous Page"
      >
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 stroke-current" fill="none" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Numerical Page Buttons */}
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black transition-all duration-200 cursor-pointer active:scale-95 ${
            currentPage === page
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.25)] border-0"
              : "border border-white/5 bg-[#0e0e13]/60 text-white/60 hover:border-violet-500/20 hover:bg-[#13131b]/80 hover:text-white"
          }`}
        >
          {page}
        </button>
      ))}

      {/* Next Page Button */}
      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-[#0e0e13]/60 text-white/50 transition cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed hover:border-violet-500/30 hover:bg-[#13131b]/80 hover:text-white active:scale-95 shrink-0"
        title="Next Page"
      >
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 stroke-current" fill="none" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
