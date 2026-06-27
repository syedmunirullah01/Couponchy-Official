import React from "react";
import { cn } from "@/lib/utils";

const layeredVariants = new Set(["primary", "club"]);

const Button = React.forwardRef(({ className, variant = "primary", size = "md", leadingIcon, trailingIcon, asChild = false, children, ...props }, ref) => {
  const variants = {
    primary:
      "border border-[var(--color-primary)] bg-[var(--surface)] text-[var(--color-primary)] before:absolute before:inset-x-[-4px] before:bottom-[-5px] before:top-[4px] before:-z-10 before:rounded-[inherit] before:border before:border-[var(--color-primary)] before:bg-[var(--surface-soft)] before:content-[''] hover:-translate-y-[1px] hover:before:bottom-[-6px] active:translate-y-[2px] active:before:bottom-[-3px] active:before:top-[2px]",
    secondary:
      "border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text)] hover:bg-[var(--surface)]",
    outline:
      "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-soft)]",
    ghost: "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)]",
    club:
      "border border-[var(--color-primary)] bg-[var(--surface)] text-[var(--color-primary)] before:absolute before:inset-x-[-4px] before:bottom-[-5px] before:top-[4px] before:-z-10 before:rounded-[inherit] before:border before:border-[var(--color-primary)] before:bg-[var(--surface-soft)] before:content-[''] hover:-translate-y-[1px] hover:before:bottom-[-6px] active:translate-y-[2px] active:before:bottom-[-3px] active:before:top-[2px]",
  };

  const sizes = {
    sm: "h-9 px-3.5 text-sm font-medium",
    md: "h-10 px-4 text-sm font-medium",
    lg: "h-11 px-6 text-sm font-semibold",
    club: "h-11 px-5 text-[11px] font-black uppercase tracking-[0.18em]",
  };

  const buttonClassName = cn(
    "relative inline-flex items-center justify-center gap-2 rounded-xl transition-[transform,box-shadow,background-color,border-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:rgba(139, 92, 246,0.22)] disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className
  );


  const innerChildren = asChild && React.isValidElement(children) ? children.props.children : children;

  const content = (
    <span
      className={cn(
        "relative z-10 flex w-full items-center justify-center gap-2 rounded-[inherit] whitespace-nowrap",
        layeredVariants.has(variant) ? "px-4 py-2" : ""
      )}
    >
      {leadingIcon ? (
        <span
          className={cn(
            "grid h-6 w-6 shrink-0 place-items-center rounded-md text-[12px] font-black",
            variant === "club" || variant === "primary"
              ? "border border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--surface)]"
              : "border border-current/10 bg-current/10"
          )}
        >
          {leadingIcon}
        </span>
      ) : null}
      <span>{innerChildren}</span>
      {trailingIcon ? (
        <span
          className={cn(
            "grid h-5 w-5 shrink-0 place-items-center rounded text-[12px] font-black",
            variant === "club" || variant === "primary"
              ? "text-[var(--color-primary)]"
              : "text-current"
          )}
        >
          {trailingIcon}
        </span>
      ) : null}
    </span>
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      className: cn(buttonClassName, children.props.className),
      children: content,
    });
  }

  return (
    <button ref={ref} className={buttonClassName} {...props}>
      {content}
    </button>
  );
});

Button.displayName = "Button";

export { Button };

