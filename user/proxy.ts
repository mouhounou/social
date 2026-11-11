import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const membersOnly = ["/posts/new", "/settings", "/saved", "/notifications"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loggedIn = request.cookies.has("token");

  const needsAuth = membersOnly.some((p) => pathname.startsWith(p)) || pathname.endsWith("/edit");
  if (!loggedIn && needsAuth) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"],
};
