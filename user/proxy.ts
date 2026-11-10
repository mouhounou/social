import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const guestOnly = ["/login", "/register", "/forgot-password", "/verify-otp", "/reset-password"];
const membersOnly = ["/posts/new", "/settings", "/saved", "/notifications"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loggedIn = request.cookies.has("token");

  if (loggedIn && guestOnly.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

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
