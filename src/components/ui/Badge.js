import React from "react";
import { cn } from "@/lib/utils";

const Badge = React.forwardRef(({ className, variant = "default", size = "md", ...props }, ref) => {
  const variants = {
    default: "border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text)]",
    success: "border border-[var(--color-primary)] bg-[var(--surface-soft)] text-[var(--text)]",
    warning: "border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]",
    destructive: "border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]",
    outline: "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]",
    subtle: "border border-[var(--border)] bg-transparent text-[var(--muted)]",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full font-medium leading-none transition-colors",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});

Badge.displayName = "Badge";

export { Badge };

