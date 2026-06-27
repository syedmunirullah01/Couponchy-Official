import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { getPermissionsForRole } from "@/lib/access-control";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@couponchy.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const emailLower = credentials.email.trim().toLowerCase();

        const { data: user } = await supabase
          .from("users")
          .select("id, name, email, password, role, permissions, is_active")
          .eq("email", emailLower)
          .maybeSingle();

        if (user) {
          if (!user.is_active) {
            throw new Error("This account is currently inactive.");
          }
          const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);
          if (isPasswordCorrect) {
            return {
              id: user.id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
              permissions: getPermissionsForRole(user.role, user.permissions),
            };
          } else {
            throw new Error("Incorrect password.");
          }
        }

        // Fallback check: If the users table is completely empty (no users found),
        // we allow initial login to let the owner access the dashboard and set up the first user.
        const { count, error: countError } = await supabase
          .from("users")
          .select("id", { count: "exact", head: true });

        if (!countError && count === 0) {
          const emailHash = Math.abs(
            emailLower.split("").reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
          );
          const fallbackId = (100000 + (emailHash % 899999)).toString();

          return {
            id: fallbackId,
            name: credentials.email.split("@")[0] || "Admin User",
            email: emailLower,
            role: "admin",
            permissions: getPermissionsForRole("admin", []),
          };
        }

        throw new Error("Access denied: Unauthorized email.");
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.name = user.name;
        token.permissions = user.permissions;
      }

      token.permissions = getPermissionsForRole(token.role, token.permissions);
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.permissions = getPermissionsForRole(token.role, token.permissions);
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const nextAuthHandler = NextAuth(authOptions);
