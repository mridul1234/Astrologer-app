import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { getRequestUser } from "@/lib/mobile-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await getRequestUser(req);
  if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;

  try {
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        astrologer: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
        user: {
          select: { name: true, walletBalance: true, kundliProfile: true },
        },
      },
    });

    if (!chatSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (chatSession.userId !== session.id && chatSession.astrologer.userId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(chatSession);
  } catch (error) {
    console.error("Fetch session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
