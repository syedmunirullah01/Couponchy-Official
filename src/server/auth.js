import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { canAccessPermission, getPermissionsForRole } from "@/lib/access-control";

export async function getAppSession() {
  return getServerSession(authOptions);
}

export async function requirePermission(permission) {
  const session = await getAppSession();

  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const permissions = getPermissionsForRole(session.user.role, session.user.permissions);
  if (!canAccessPermission(permissions, permission)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { session, permissions };
}
