import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE, ADMIN_BASE_PATH } from "@/lib/constants";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. If hitting legacy /admin or /admin/*, redirect to the secure admin path
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const targetPath = pathname.replace(/^\/admin/, ADMIN_BASE_PATH);
    const targetUrl = new URL(`${targetPath}${search}`, request.url);
    const res = NextResponse.redirect(targetUrl, 308);
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return res;
  }

  // 2. If hitting the secure admin path or any subroutes
  if (pathname === ADMIN_BASE_PATH || pathname.startsWith(`${ADMIN_BASE_PATH}/`)) {
    // Unauthenticated access to subpages (like /cgs-oap.../sessions) redirects to login page
    if (pathname !== ADMIN_BASE_PATH && !request.cookies.has(SESSION_COOKIE)) {
      const res = NextResponse.redirect(new URL(ADMIN_BASE_PATH, request.url));
      res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
      return res;
    }

    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/cgs-oap-a7f8e2d1b9c4k6m3",
    "/cgs-oap-a7f8e2d1b9c4k6m3/:path*",
  ],
};
