"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

function Dialog({ open, onOpenChange, children }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "textarea:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");

    const focusFirstElement = () => {
      const focusableElements = containerRef.current?.querySelectorAll(focusableSelector);
      if (focusableElements?.length) {
        focusableElements[0].focus();
      } else {
        containerRef.current?.focus();
      }
    };

    const frameId = window.requestAnimationFrame(focusFirstElement);

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onOpenChange(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = containerRef.current?.querySelectorAll(focusableSelector);
      if (!focusableElements?.length) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const isShiftPressed = event.shiftKey;

      if (isShiftPressed && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!isShiftPressed && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-4"
      onClick={() => onOpenChange(false)}
      aria-hidden="true"
    >
      <div
        ref={containerRef}
        className="flex min-h-full items-center justify-center py-4 sm:py-6"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function DialogContent({ className, titleId, descriptionId, ...props }) {
  return (
    <div
      className={cn(
        "w-full max-w-2xl rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 text-[var(--text)] shadow-[0_30px_90px_rgba(0,0,0,0.45)]",
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      tabIndex={-1}
      {...props}
    />
  );
}

function DialogHeader({ className, ...props }) {
  return <div className={cn("mb-6 flex flex-col gap-2", className)} {...props} />;
}

function DialogTitle({ className, ...props }) {
  return <h2 className={cn("text-xl font-semibold text-[var(--text)]", className)} {...props} />;
}

function DialogDescription({ className, ...props }) {
  return <p className={cn("text-sm text-[var(--muted)]", className)} {...props} />;
}

function useDialogA11yIds() {
  const id = useId();

  return {
    titleId: `${id}-title`,
    descriptionId: `${id}-description`,
  };
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, useDialogA11yIds };
