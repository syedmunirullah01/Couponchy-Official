"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/AppModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, useDialogA11yIds } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { PERMISSIONS, ROLE_LABELS, ROLE_PERMISSIONS } from "@/lib/access-control";
import { cn } from "@/lib/utils";

const defaultForm = {
  id: null,
  name: "",
  email: "",
  password: "",
  role: "editor",
  permissions: ROLE_PERMISSIONS.editor.filter((item) => item !== "dashboard"),
  isActive: true,
};

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" className="stroke-current opacity-25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" className="stroke-current" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function AdminUsersManager() {
  const [users, setUsers] = useState([]);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const { titleId, descriptionId } = useDialogA11yIds();

  const isEditing = Boolean(form.id);
  const permissionOptions = useMemo(() => PERMISSIONS.filter((item) => item.key !== "dashboard"), []);

  async function loadUsers() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/users", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load users.");
      }

      setUsers(payload.data || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function openCreateDialog() {
    setForm(defaultForm);
    setDialogOpen(true);
  }

  function openEditDialog(user) {
    setForm({
      id: user.id,
      name: user.name || "",
      email: user.email,
      password: "",
      role: user.role,
      permissions: user.permissions.filter((item) => item !== "dashboard"),
      isActive: user.isActive,
    });
    setDialogOpen(true);
  }

  function handleRoleChange(role) {
    setForm((current) => ({
      ...current,
      role,
      permissions: ROLE_PERMISSIONS[role].filter((item) => item !== "dashboard"),
    }));
  }

  function togglePermission(permission) {
    setForm((current) => {
      const active = current.permissions.includes(permission);
      return {
        ...current,
        permissions: active
          ? current.permissions.filter((item) => item !== permission)
          : [...current.permissions, permission],
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        name: form.name,
        email: form.email,
        role: form.role,
        permissions: ["dashboard", ...form.permissions],
        isActive: form.isActive,
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (!isEditing && !payload.password) {
        throw new Error("Password is required for new users.");
      }

      const response = await fetch(isEditing ? `/api/users/${form.id}` : "/api/users", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to save user.");
      }

      toast.success(isEditing ? "User updated." : "User created.");
      setDialogOpen(false);
      setForm(defaultForm);
      await loadUsers();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function openDeleteModal(user) {
    setDeleteTarget(user);
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${deleteTarget.id}`, { method: "DELETE" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to delete user.");
      }

      toast.success("User deleted.");
      setDeleteTarget(null);
      await loadUsers();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage accounts, roles, passwords, and dashboard access.</CardDescription>
          </div>
          <Button type="button" onClick={openCreateDialog}>
            Create User
          </Button>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Users only see the sections assigned to them.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex min-h-48 items-center justify-center text-sm text-[var(--muted)]">Loading users...</div>
            ) : users.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <>
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold text-[var(--text)]">{user.name || "Unnamed User"}</p>
                            <p className="text-xs text-[var(--muted)]">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{ROLE_LABELS[user.role] || user.role}</TableCell>
                        <TableCell className="w-[180px]">
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text)] transition hover:text-[var(--color-primary)]"
                            onClick={() =>
                              setExpandedUserId((current) => (current === user.id ? null : user.id))
                            }
                          >
                            <span>{buildAccessSummary(user.permissions)}</span>
                            <span className="text-[var(--muted)]">
                              {expandedUserId === user.id ? "Hide" : "View"}
                            </span>
                          </button>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "success" : "warning"} size="sm">
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                              Edit
                            </Button>
                            <Button type="button" variant="secondary" size="sm" onClick={() => openDeleteModal(user)}>
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedUserId === user.id ? (
                        <TableRow key={`${user.id}-expanded`}>
                          <TableCell colSpan={5} className="bg-[var(--surface-soft)]">
                            <div className="flex flex-wrap gap-1.5 py-1">
                              {user.permissions.map((permission) => {
                                const item = PERMISSIONS.find((entry) => entry.key === permission);
                                return (
                                  <Badge key={permission} variant="subtle" size="sm">
                                    {item?.label || permission}
                                  </Badge>
                                );
                              })}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-6 py-10 text-center">
                <h3 className="text-lg font-semibold text-[var(--text)]">No users found</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">Create the first user to start assigning access.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent aria-labelledby={titleId} aria-describedby={descriptionId} className="max-w-3xl">
          <DialogHeader>
            <DialogTitle id={titleId}>{isEditing ? "Edit User" : "Create User"}</DialogTitle>
            <DialogDescription id={descriptionId}>
              Set the role, password, and page access for this account.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text)]">Full Name</label>
                <Input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text)]">Email Address</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="editor@couponchy.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text)]">
                  {isEditing ? "New Password" : "Password"}
                </label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder={isEditing ? "Leave blank to keep the current password" : "Minimum 8 characters"}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text)]">Role</label>
                <select
                  className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm text-[var(--text)] outline-none"
                  value={form.role}
                  onChange={(event) => handleRoleChange(event.target.value)}
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text)]">Page Access</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">Dashboard access is always included.</p>
                </div>
                <label className="flex items-center gap-2 text-sm text-[var(--text)]">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                  />
                  Active user
                </label>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {permissionOptions.map((permission) => {
                  const checked =
                    form.role === "admin" ? true : form.permissions.includes(permission.key);

                  return (
                    <label
                      key={permission.key}
                      className={cn(
                        "flex items-start gap-3 rounded-2xl border border-[var(--border)] p-3 text-sm",
                        checked ? "bg-[var(--surface)] text-[var(--text)]" : "text-[var(--muted)]"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={form.role === "admin"}
                        onChange={() => togglePermission(permission.key)}
                      />
                      <span>
                        <span className="block font-medium">{permission.label}</span>
                        <span className="mt-1 block text-xs text-[var(--muted)]">{permission.href}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Spinner /> : null}
                {isEditing ? "Save Changes" : "Create User"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete user"
        description={deleteTarget ? `Remove ${deleteTarget.email} from the dashboard?` : ""}
        confirmLabel="Delete User"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirmed}
        isSubmitting={isDeleting}
      />
    </div>
  );
}

function shortPermissionLabel(label) {
  const map = {
    Dashboard: "Dash",
    Stores: "Stores",
    "Coupons & Deals": "Offers",
    Categories: "Cats",
    Settings: "Settings",
  };

  return map[label] || label;
}

function buildAccessSummary(permissions) {
  const labels = permissions
    .map((permission) => {
      const item = PERMISSIONS.find((entry) => entry.key === permission);
      return shortPermissionLabel(item?.label || permission);
    })
    .filter(Boolean);

  if (!labels.length) {
    return "No access";
  }

  if (labels.length === 1) {
    return labels[0];
  }

  return `${labels[0]} +${labels.length - 1}`;
}
