"use client";

import { Toaster } from "sonner";

export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      richColors={false}
      theme="dark"
      toastOptions={{
        className:
          "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-[0_20px_60px_rgba(0,0,0,0.35)]",
        descriptionClassName: "text-[var(--muted)]",
      }}
    />
  );
}
