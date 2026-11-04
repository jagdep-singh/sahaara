import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { DEFAULT_LANG, isLang } from "@/i18n";

const PUBLIC_FILE = /\.[^/]+$/;

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const firstSegment = pathname.split("/")[1] ?? "";

  if (isLang(firstSegment)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LANG}${pathname === "/" ? "" : pathname}`;
  url.search = search;

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|admin|_next|.*\\..*).*)"],
};
