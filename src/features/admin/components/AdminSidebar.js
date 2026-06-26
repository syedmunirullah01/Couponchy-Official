"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import Logo from "@/components/shared/Logo";
import { Button } from "@/components/ui/Button";
import { PERMISSIONS, canAccessPermission, getPermissionsForRole } from "@/lib/access-control";
import { cn } from "@/lib/utils";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const permissions = getPermissionsForRole(session?.user?.role, session?.user?.permissions);
  const items = PERMISSIONS.filter((item) => canAccessPermission(permissions, item.key));
  const userName = session?.user?.name || (session?.user?.email ? session.user.email.split("@")[0] : "Admin");
  const userInitial = userName?.charAt(0)?.toUpperCase() || "A";
  const userRole = session?.user?.role || "admin";

  return (
    <aside className="w-full border-b border-[var(--border)] bg-[var(--surface)] lg:min-h-screen lg:w-72 lg:border-r lg:border-b-0">
      <div className="flex h-full flex-col px-4 py-6 sm:px-6">
        <div className="mb-8">
          <Link href="/" className="inline-flex" aria-label="Go to homepage" target="_blank" rel="noopener noreferrer">
            <Logo />
          </Link>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">Admin</p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--text)]">Dashboard</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {session?.user?.name || session?.user?.email || "Signed in user"}
          </p>
        </div>

        <nav className="grid gap-2">
          {items.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "border-[var(--color-primary)] bg-[var(--surface-soft)] text-[var(--text)]"
                    : "border-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-8">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold text-[var(--text)]">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--text)]">{userName}</p>
                <p className="truncate text-xs capitalize text-[var(--muted)]">{userRole}</p>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="md"
              className="mt-3 w-full justify-center"
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
