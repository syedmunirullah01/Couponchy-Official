import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { ROLE_PERMISSIONS } from "@/lib/access-control";
import bcrypt from "bcryptjs";

// ONE-TIME SETUP ROUTE - Delete this file after use!
export async function GET() {
  try {
    const email = "maxshopk@gmail.com";
    const password = "Testing123/";

    const { data: existing, error: findError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ message: "Admin already exists" }, { status: 200 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { error: insertError } = await supabase
      .from("users")
      .insert({
        name: "Primary Admin",
        email,
        password: hashedPassword,
        role: "admin",
        permissions: ROLE_PERMISSIONS.admin,
        is_active: true,
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Admin created successfully!", email }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
