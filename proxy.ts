import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifySessionToken } from "@/lib/auth";
import { DEFAULT_LANG, isLang } from "@/i18n";

const PUBLIC_FILE = /\.[^/]+$/;

export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const withSecurity = (response: NextResponse) => {
    const dev = process.env.NODE_ENV !== 'production';
    response.headers.set('Content-Security-Policy', `default-src 'self'; script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    return response;
  };

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return withSecurity(NextResponse.next());

    const session = await verifySessionToken(
      request.cookies.get("session")?.value
    );

    if (!session || session.role !== "ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return withSecurity(NextResponse.next());
  }

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return withSecurity(NextResponse.next());
  }

  const firstSegment = pathname.split("/")[1] ?? "";

  if (isLang(firstSegment)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LANG}${pathname === "/" ? "" : pathname}`;
  url.search = search;

  return withSecurity(NextResponse.redirect(url));
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
