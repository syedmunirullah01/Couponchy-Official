const pages = ["1", "2"];

export default function Pagination() {
  return (
    <div className="mt-10 flex items-center justify-center gap-3">
      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded-full border border-[var(--border)] bg-[rgba(20,30,11,0.9)] text-white/55"
      >
        ‹
      </button>
      {pages.map((page, index) => (
        <button
          key={page}
          type="button"
          className={`grid h-9 w-9 place-items-center rounded-full border text-sm font-semibold ${
            index === 0
              ? "border-[var(--accent)] bg-[var(--accent)] text-[#081005]"
              : "border-[var(--border)] bg-[rgba(20,30,11,0.9)] text-white/65"
          }`}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded-full border border-[var(--border)] bg-[rgba(20,30,11,0.9)] text-white/55"
      >
        ›
      </button>
    </div>
  );
}
