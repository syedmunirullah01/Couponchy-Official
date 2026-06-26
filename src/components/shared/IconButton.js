import { cn } from "@/lib/utils";

export default function IconButton({ children, className }) {
  return (
    <button
      type="button"
      className={cn(
        "grid h-10 w-10 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-secondary)] text-[var(--color-muted)] transition hover:border-[var(--color-primary)]/40 hover:text-white",
        className
      )}
    >
      {children}
    </button>
  );
}

