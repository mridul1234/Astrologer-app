import { NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { auth } from "@/auth";

/**
 * GET /api/user/balance
 * Lightweight endpoint — fetches ONLY the 3 fields needed by the header + dashboard.
 * Much faster than /api/user/profile which pulls 30 transactions + 20 sessions.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      walletBalance: true,
      freeMinutesLeft: true,
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(user, {
    headers: {
      // Allow browser to cache for 10s — stale-while-revalidate for 30s more
      "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
    },
  });
}
