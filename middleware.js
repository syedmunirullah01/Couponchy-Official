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
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  );
}

function isAdminOrAuthPath(pathname) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/out")
  );
}

export async function middleware(req) {
  const { pathname, search } = req.nextUrl;

  // Skip /out
  if (pathname.startsWith("/out")) {
    return NextResponse.next();
  }

  // Skip if already processed by country routing middleware (prevent override in self-hosted rewrite loops)
  if (req.headers.has(COUNTRY_HEADER_KEY)) {
    return NextResponse.next();
  }

  // ================= ADMIN =================
  if (pathname.startsWith("/admin")) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
    });

    console.log("NODE_ENV:", process.env.NODE_ENV);

    // Debug Logs
    console.log("=========== MIDDLEWARE ===========");
    console.log("TOKEN:", token);
    console.log("ROLE:", token?.role);
    console.log("PERMISSIONS:", token?.permissions);
    console.log("COOKIE:", req.headers.get("cookie"));
    console.log(
      "SESSION COOKIE:",
      req.cookies.get("__Secure-next-auth.session-token")?.value
    );
    console.log(
      "DEV SESSION COOKIE:",
      req.cookies.get("next-auth.session-token")?.value
    );
    console.log(
      "NEXTAUTH_SECRET EXISTS:",
      !!process.env.NEXTAUTH_SECRET
    );
    console.log("==================================");

    if (!token) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/login";
      return NextResponse.redirect(redirectUrl);
    }

    const permission = getPermissionForPath(pathname);
    const permissions = getPermissionsForRole(
      token.role,
      token.permissions || []
    );

    if (!canAccessPermission(permissions, permission)) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/admin";
      redirectUrl.searchParams.set("denied", permission);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  // Skip Static/Auth Routes
  if (isStaticAsset(pathname) || isAdminOrAuthPath(pathname)) {
    return NextResponse.next();
  }

  // ================= COUNTRY ROUTING =================

  // 1. Check if the original request path from the browser already contains a country prefix.
  // This prevents redirect loops during internal rewrites on platforms like Vercel.
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

    const rewriteUrl = req.nextUrl.clone();
    rewriteUrl.pathname = removeCountryPrefix(pathname);

    // Fix protocol mismatch when running behind a reverse proxy (e.g. Nginx on VPS proxying to localhost)
    if (rewriteUrl.hostname === "localhost" || rewriteUrl.hostname === "127.0.0.1") {
      rewriteUrl.protocol = "http";
    }

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

  const redirectUrl = req.nextUrl.clone();
  redirectUrl.pathname = buildCountryPath(pathname, cookieCountryCode);
  redirectUrl.search = search;

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};