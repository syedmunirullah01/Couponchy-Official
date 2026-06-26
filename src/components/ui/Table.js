import { cn } from "@/lib/utils";

function Table({ className, ...props }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full border-separate border-spacing-0", className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }) {
  return <thead className={cn("bg-[var(--surface-soft)]", className)} {...props} />;
}

function TableBody({ className, ...props }) {
  return <tbody className={cn("[&_tr:last-child_td]:border-b-0", className)} {...props} />;
}

function TableRow({ className, ...props }) {
  return <tr className={cn("transition hover:bg-[var(--surface-soft)]/70", className)} {...props} />;
}

function TableHead({ className, ...props }) {
  return (
    <th
      className={cn(
        "border-b border-[var(--border)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]",
        className
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }) {
  return <td className={cn("border-b border-[var(--border)] px-4 py-4 text-sm text-[var(--text)]", className)} {...props} />;
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
