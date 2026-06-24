import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { getRequestUser } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
  const identity = await getRequestUser(req);
  if (!identity?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.chatSession.findMany({
    where: { userId: identity.id },
    orderBy: { startedAt: "desc" },
    include: {
      astrologer: { include: { user: { select: { name: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return NextResponse.json({
    sessions: sessions.map((session) => ({
      id: session.id,
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      totalCost: session.totalCost,
      astrologer: {
        id: session.astrologer.id,
        name: session.astrologer.user.name,
        speciality: session.astrologer.speciality,
        profileImage: session.astrologer.profileImage,
        ratePerMin: session.astrologer.ratePerMin,
      },
      lastMessage: session.messages[0] || null,
    })),
  });
}
