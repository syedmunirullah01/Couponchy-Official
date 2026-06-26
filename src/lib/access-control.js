export const PERMISSIONS = [
  { key: "dashboard", label: "Dashboard", href: "/admin" },
  { key: "homepage", label: "Homepage", href: "/admin/homepage" },
  { key: "stores", label: "Stores", href: "/admin/stores" },
  { key: "products", label: "Products", href: "/admin/products" },
  { key: "offers", label: "Coupons & Deals", href: "/admin/offers" },
  { key: "hero", label: "Hero", href: "/admin/hero" },
  { key: "events", label: "Events", href: "/admin/events" },
  { key: "categories", label: "Categories", href: "/admin/categories" },
  { key: "settings", label: "Settings", href: "/admin/settings" },
];

export const ROLE_LABELS = {
  admin: "Admin",
  editor: "Editor",
  "social-media": "Social Media",
};

export const ROLE_PERMISSIONS = {
  admin: PERMISSIONS.map((item) => item.key),
  editor: ["dashboard", "homepage", "stores", "products", "offers", "hero", "events", "categories"],
  "social-media": ["dashboard", "offers"],
};

export function normalizePermissions(permissions = []) {
  const allowed = new Set(PERMISSIONS.map((item) => item.key));
  return [...new Set(permissions.filter((item) => allowed.has(item)))];
}

export function getPermissionsForRole(role, permissions) {
  if (role === "admin") {
    return ROLE_PERMISSIONS.admin;
  }

  const normalized = normalizePermissions(permissions);
  return normalized.length ? normalized : ROLE_PERMISSIONS[role] || ["dashboard"];
}

export function canAccessPermission(permissions, permission) {
  return permission === "dashboard" || permissions.includes(permission);
}

export function getPermissionForPath(pathname) {
  if (pathname.startsWith("/admin/homepage")) return "homepage";
  if (pathname.startsWith("/admin/products")) return "products";
  if (pathname.startsWith("/admin/hero")) return "hero";
  if (pathname.startsWith("/admin/events")) return "events";
  if (pathname.startsWith("/admin/settings")) return "settings";
  if (pathname.startsWith("/admin/categories")) return "categories";
  if (pathname.startsWith("/admin/offers")) return "offers";
  if (pathname.startsWith("/admin/stores")) return "stores";
  return "dashboard";
}
