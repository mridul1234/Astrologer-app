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

  // Astrologer trying to access user dashboard, home, or onboarding
  if ((pathname.startsWith("/dashboard") || pathname === "/home" || pathname === "/onboarding") && role === "ASTROLOGER") {
    return NextResponse.redirect(new URL("/astrologer", req.url));
  }

  // User trying to access the astrologer-only dashboard
  // IMPORTANT: /astrologer/[id] are PUBLIC profile pages that users MUST be able to visit.
  // Only block the exact /astrologer dashboard, /astrologer/settings, /astrologer/chat for USERs.
  if (role === "USER" && pathname.startsWith("/astrologer")) {
    // Allow /astrologer/<id> profile pages — these have a cuid-like segment after /astrologer/
    // But block /astrologer (dashboard), /astrologer/settings, /astrologer/chat, /astrologer/login
    const subPath = pathname.replace("/astrologer", "");
    const blockedSubPaths = ["", "/settings", "/chat", "/login"];
    const isBlockedExact = blockedSubPaths.includes(subPath) || 
                           blockedSubPaths.some(bp => bp !== "" && subPath.startsWith(bp + "/"));
    if (isBlockedExact) {
      return NextResponse.redirect(new URL("/home", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
