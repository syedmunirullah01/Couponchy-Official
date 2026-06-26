import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { getPermissionsForRole, ROLE_LABELS } from "@/lib/access-control";
import { requirePermission } from "@/server/auth";

function sanitizeUser(user) {
  return {
    id: user.id.toString(),
    name: user.name || "",
    email: user.email,
    role: user.role,
    roleLabel: ROLE_LABELS[user.role] || user.role,
    permissions: getPermissionsForRole(user.role, user.permissions),
    isActive: user.is_active,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

export async function GET() {
  const access = await requirePermission("settings");
  if (access.error) {
    return access.error;
  }

  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: users.map(sanitizeUser) });
}

export async function POST(request) {
  const access = await requirePermission("settings");
  if (access.error) {
    return access.error;
  }

  try {
    const payload = await request.json();
    const name = payload?.name?.trim() || "";
    const email = payload?.email?.trim()?.toLowerCase();
    const password = payload?.password?.trim();
    const role = payload?.role || "editor";
    const isActive = payload?.isActive !== false;

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const permissions = getPermissionsForRole(role, payload?.permissions);

    const { data: user, error: createError } = await supabase
      .from("users")
      .insert({
        name,
        email,
        password: hashedPassword,
        role,
        permissions,
        is_active: isActive,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    return NextResponse.json({ data: sanitizeUser(user) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to create user." }, { status: 400 });
  }
}
