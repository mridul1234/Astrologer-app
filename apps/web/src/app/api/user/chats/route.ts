import { NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { auth } from "@/auth";

// GET /api/user/chats — returns all chat sessions for the logged-in user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId: session.user.id },
      orderBy: { startedAt: "desc" },
      include: {
        astrologer: {
          include: {
            user: { select: { name: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // Only the last message for preview
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    const formatted = sessions.map((s) => ({
      id: s.id,
      status: s.status,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      totalCost: s.totalCost,
      astrologer: {
        id: s.astrologer.id,
        name: s.astrologer.user.name,
        speciality: s.astrologer.speciality,
        profileImage: s.astrologer.profileImage,
        ratePerMin: s.astrologer.ratePerMin,
      },
      lastMessage: s.messages[0]
        ? {
            content: s.messages[0].content,
            createdAt: s.messages[0].createdAt,
            senderId: s.messages[0].senderId,
          }
        : null,
      messageCount: s._count.messages,
    }));

    return NextResponse.json({ sessions: formatted });
  } catch (error) {
    console.error("Failed to fetch chats:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
