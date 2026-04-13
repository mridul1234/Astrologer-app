import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { auth } from "@/auth";

// GET /api/astrologer/profile
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const astrologer = await prisma.astrologer.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        select: { id: true, name: true, email: true, createdAt: true, walletBalance: true },
      },
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      chatSessions: {
        orderBy: { startedAt: "desc" },
        take: 20,
        include: {
          user: { select: { name: true } },
        },
      },
    },
  });

  if (!astrologer) {
    return NextResponse.json({ error: "Astrologer not found" }, { status: 404 });
  }

  // Calculate Net Total Earnings based on astrologerEarnings (net of platform commission)
  const totalEarnings = astrologer.chatSessions
    .filter((s) => s.status === "ENDED")
    .reduce((acc, s) => acc + s.astrologerEarnings, 0);

  // Calculate Today's Net Earnings
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todaysEarnings = astrologer.chatSessions
    .filter((s) => s.status === "ENDED" && s.startedAt >= startOfToday)
    .reduce((acc, s) => acc + s.astrologerEarnings, 0);

  const avgRating = astrologer.reviews.length > 0 
    ? astrologer.reviews.reduce((acc, r) => acc + r.rating, 0) / astrologer.reviews.length 
    : 0;

  // Add the user's walletBalance to the response so the frontend knows how much they can withdraw
  const balance = astrologer.user.walletBalance;

  return NextResponse.json({ ...astrologer, totalEarnings, todaysEarnings, avgRating, balance });
}

// PATCH /api/astrologer/profile
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, bio, speciality, ratePerMin, languages } = body;

  // Update user name if provided
  if (name?.trim()) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name.trim() },
    });
  }

  // Update astrologer profile fields
  const updated = await prisma.astrologer.update({
    where: { userId: session.user.id },
    data: {
      ...(bio !== undefined ? { bio } : {}),
      ...(speciality?.trim() ? { speciality } : {}),
      ...(ratePerMin !== undefined && ratePerMin > 0 ? { ratePerMin: Number(ratePerMin) } : {}),
    },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json(updated);
}
