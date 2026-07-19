import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { getRequestUser } from "@/lib/mobile-auth";

// GET /api/user/profile
export async function GET(req: NextRequest) {
  const session = await getRequestUser(req);
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      walletBalance: true,
      freeMinutesLeft: true,
      introOfferUsed: true,
      createdAt: true,
      kundliProfile: true,
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          amount: true,
          type: true,
          reason: true,
          createdAt: true,
        },
      },
      chatSessions: {
        orderBy: { startedAt: "desc" },
        take: 20,
        select: {
          id: true,
          startedAt: true,
          endedAt: true,
          totalCost: true,
          status: true,
          astrologer: {
            select: {
              speciality: true,
              ratePerMin: true,
              user: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}

// PATCH /api/user/profile
export async function PATCH(req: NextRequest) {
  const session = await getRequestUser(req);
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, avataremoji } = body;

  const updated = await prisma.user.update({
    where: { id: session.id },
    data: {
      ...(name?.trim() ? { name: name.trim() } : {}),
    },
    select: { id: true, name: true, email: true, walletBalance: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/user/profile
export async function DELETE(req: NextRequest) {
  const session = await getRequestUser(req);
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.role !== "USER") {
    return NextResponse.json({ error: "Only seeker accounts can be deleted from the app." }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.message.deleteMany({ where: { senderId: user.id } }),
    prisma.review.deleteMany({ where: { userId: user.id } }),
    prisma.chatSession.deleteMany({ where: { userId: user.id } }),
    prisma.transaction.deleteMany({ where: { userId: user.id } }),
    prisma.kundliProfile.deleteMany({ where: { userId: user.id } }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);

  return NextResponse.json({ success: true });
}
