import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  // Public paths — always accessible (exact match)
  const publicPaths = ["/", "/login", "/admin/login", "/astrologer/login", "/api/dev/seed-admin"];
  // Public path prefixes — legal/info pages accessible without login
  const publicPrefixes = [
    "/privacy-policy",
    "/terms-and-conditions",
    "/refund-and-cancellation",
    "/user-guidelines",
    "/about-us",
    "/contact-us",
    "/kundli",
  ];
  if (
    publicPaths.some((p) => pathname === p) ||
    publicPrefixes.some((p) => pathname === p || pathname.startsWith(p + "/"))
  ) {
    return NextResponse.next();
  }

  // Not logged in — redirect to login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Astrologer trying to access user dashboard
  if (pathname.startsWith("/dashboard") && role === "ASTROLOGER") {
    return NextResponse.redirect(new URL("/astrologer", req.url));
  }

  // User trying to access astrologer dashboard
  if (pathname.startsWith("/astrologer") && role === "USER") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
