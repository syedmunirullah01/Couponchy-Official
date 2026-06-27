export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="mt-10 flex items-center justify-center gap-3">
      {/* Previous Page Button */}
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="grid h-9 w-9 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)]/60 text-white/55 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:border-[var(--accent)]/45"
      >
        ‹
      </button>

      {/* Numerical Page Buttons */}
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={`grid h-9 w-9 place-items-center rounded-full border text-sm font-semibold transition cursor-pointer ${
            currentPage === page
              ? "border-[var(--accent)] bg-[var(--accent)] text-black shadow-[0_0_15px_rgba(139,92,246,0.25)]"
              : "border-[var(--border)] bg-[var(--surface-soft)]/60 text-white/65 hover:border-[var(--accent)]/45"
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
        className="grid h-9 w-9 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)]/60 text-white/55 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:border-[var(--accent)]/45"
      >
        ›
      </button>
    </div>
  );
}
