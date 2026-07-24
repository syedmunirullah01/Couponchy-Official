import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  canAccessPermission,
  getPermissionForPath,
  getPermissionsForRole,
} from "@/lib/access-control";
import {
  buildCountryPath,
  COUNTRY_COOKIE_KEY,
  COUNTRY_HEADER_KEY,
  DEFAULT_COUNTRY_CODE,
  getCountryCodeFromPathname,
  normalizeCountryCode,
  removeCountryPrefix,
} from "@/lib/countries";

function isStaticAsset(pathname) {
  const clean = removeCountryPrefix(pathname);
  return (
    clean.startsWith("/_next") ||
    clean.startsWith("/api") ||
    /\.[a-zA-Z0-9]+$/.test(clean)
  );
}

function isAdminOrAuthPath(pathname) {
  const clean = removeCountryPrefix(pathname);
  return (
    clean.startsWith("/admin") ||
    clean.startsWith("/login") ||
    clean.startsWith("/out")
  );
}

export async function middleware(req) {
  const { pathname, search } = req.nextUrl;
  const cleanPath = removeCountryPrefix(pathname);

  // 1. Always bypass API routes so NextAuth & API handlers receive pure JSON
  if (cleanPath.startsWith("/api")) {
    if (pathname !== cleanPath) {
      return NextResponse.rewrite(new URL(cleanPath + search, req.url));
    }
    return NextResponse.next();
  }

  // 2. Skip static assets & /out
  if (isStaticAsset(pathname) || cleanPath.startsWith("/out")) {
    return NextResponse.next();
  }

  // 3. Skip if already processed by country header
  if (req.headers.has(COUNTRY_HEADER_KEY)) {
    return NextResponse.next();
  }

  // ================= ADMIN & LOGIN =================
  if (cleanPath.startsWith("/admin")) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
    });

    if (!token) {
      const redirectUrl = new URL("/login", req.url);
      return NextResponse.redirect(redirectUrl);
    }

    const permission = getPermissionForPath(cleanPath);
    const permissions = getPermissionsForRole(
      token.role,
      token.permissions || []
    );

    if (!canAccessPermission(permissions, permission)) {
      const redirectUrl = new URL("/admin", req.url);
      redirectUrl.searchParams.set("denied", permission);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  if (cleanPath.startsWith("/login")) {
    return NextResponse.next();
  }

  // ================= COUNTRY ROUTING =================
  const originalPathname = new URL(req.url).pathname;
  const originalCountryCode = getCountryCodeFromPathname(originalPathname);

  if (originalCountryCode && !getCountryCodeFromPathname(pathname)) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set(COUNTRY_HEADER_KEY, originalCountryCode);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const prefixedCountryCode = getCountryCodeFromPathname(pathname);

  if (prefixedCountryCode) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set(COUNTRY_HEADER_KEY, prefixedCountryCode);

    const rewriteUrl = new URL(cleanPath + search, req.url);

    const response = NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });

    response.cookies.set(COUNTRY_COOKIE_KEY, prefixedCountryCode, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });

    return response;
  }

  const cookieCountryCode = normalizeCountryCode(
    req.cookies.get(COUNTRY_COOKIE_KEY)?.value || DEFAULT_COUNTRY_CODE
  );

  if (cookieCountryCode === DEFAULT_COUNTRY_CODE) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set(COUNTRY_HEADER_KEY, cookieCountryCode);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    response.cookies.set(COUNTRY_COOKIE_KEY, cookieCountryCode, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });

    return response;
  }

  const redirectUrl = new URL(buildCountryPath(pathname, cookieCountryCode) + search, req.url);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};