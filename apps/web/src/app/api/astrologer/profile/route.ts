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
        select: { id: true, name: true, email: true, createdAt: true },
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

  const totalEarnings = astrologer.chatSessions
    .filter((s) => s.status === "ENDED")
    .reduce((acc, s) => acc + s.totalCost, 0);

  return NextResponse.json({ ...astrologer, totalEarnings });
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
