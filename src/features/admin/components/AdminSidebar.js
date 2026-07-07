"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import Logo from "@/components/shared/Logo";
import { Button } from "@/components/ui/Button";
import { PERMISSIONS, canAccessPermission, getPermissionsForRole } from "@/lib/access-control";
import { cn } from "@/lib/utils";

function getIconForMenu(key) {
  const iconProps = { className: "h-5 w-5 stroke-current transition-colors", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };

  switch (key) {
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24" {...iconProps}>
          <rect x="3" y="3" width="7" height="9" />
          <rect x="14" y="3" width="7" height="5" />
          <rect x="14" y="12" width="7" height="9" />
          <rect x="3" y="16" width="7" height="5" />
        </svg>
      );
    case "homepage":
      return (
        <svg viewBox="0 0 24 24" {...iconProps}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "stores":
      return (
        <svg viewBox="0 0 24 24" {...iconProps}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <line x1="9" y1="22" x2="9" y2="16" />
          <line x1="15" y1="22" x2="15" y2="16" />
        </svg>
      );
    case "products":
      return (
        <svg viewBox="0 0 24 24" {...iconProps}>
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    case "offers":
      return (
        <svg viewBox="0 0 24 24" {...iconProps}>
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      );
    case "hero":
      return (
        <svg viewBox="0 0 24 24" {...iconProps}>
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      );
    case "events":
      return (
        <svg viewBox="0 0 24 24" {...iconProps}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "categories":
      return (
        <svg viewBox="0 0 24 24" {...iconProps}>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "blog":
      return (
        <svg viewBox="0 0 24 24" {...iconProps}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" {...iconProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case "company":
      return (
        <svg viewBox="0 0 24 24" {...iconProps}>
          <rect x="2" y="7" width="20" height="15" rx="2" />
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          <line x1="12" y1="12" x2="12" y2="12.01" />
          <path d="M12 12v4" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const permissions = getPermissionsForRole(session?.user?.role, session?.user?.permissions);
  const items = PERMISSIONS.filter((item) => canAccessPermission(permissions, item.key));
  const userName = session?.user?.name || (session?.user?.email ? session.user.email.split("@")[0] : "Admin");
  const userInitial = userName?.charAt(0)?.toUpperCase() || "A";
  const userRole = session?.user?.role || "admin";

  return (
    <aside className="w-full border-b border-[var(--border)] bg-[var(--surface)] lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:w-72 lg:border-r lg:border-b-0 shadow-[4px_0_24px_rgba(0,0,0,0.015)]">
      <div className="flex h-full flex-col px-4 py-6 sm:px-6">
        <div className="mb-8 flex flex-col gap-4">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="Go to homepage" target="_blank" rel="noopener noreferrer">
            <Logo />
          </Link>
          <div className="border-t border-[var(--border)] pt-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--color-primary)]">ADMIN PANEL</p>
            <h1 className="mt-1 text-lg font-bold tracking-tight text-[var(--text)]">Couponchy</h1>
          </div>
        </div>

        <nav className="grid gap-1">
          {items.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-200 flex items-center gap-3 cursor-pointer",
                  isActive
                    ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-l-4 border-[var(--color-primary)] rounded-l-none pl-3"
                    : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)] border-l-4 border-transparent"
                )}
              >
                {getIconForMenu(item.key)}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6">
          <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)]/40 p-4 transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-zinc-800/80 text-xs font-bold text-zinc-300 border border-zinc-700/40">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[var(--text)] tracking-tight">{userName}</p>
                <p className="truncate text-[10px] font-medium uppercase tracking-wider text-[var(--muted)] mt-0.5">{userRole}</p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="md"
              className="mt-3.5 w-full justify-center text-xs font-bold rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/25 transition-all duration-200 cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
