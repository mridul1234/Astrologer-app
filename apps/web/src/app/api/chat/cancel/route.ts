import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { auth } from "@/auth";
import { getRequestUser } from "@/lib/mobile-auth";

/**
 * POST /api/chat/cancel
 * Cancels a session before it starts billing:
 * - astrologer rejects an incoming request
 * - user leaves the waiting screen before the astrologer joins
 */
export async function POST(req: NextRequest) {
  const session = await getRequestUser(req);
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await req.json();
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const chatSession = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      user: true,
      astrologer: { select: { userId: true } },
      messages: { select: { createdAt: true } },
    },
  });

  if (!chatSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const isUser = chatSession.userId === session.id;
  const isAstrologer = chatSession.astrologer.userId === session.id;
  if (!isUser && !isAstrologer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (chatSession.status !== "ACTIVE") {
    return NextResponse.json({ error: "Session already ended" }, { status: 400 });
  }

  const startedAtMs = chatSession.startedAt.getTime();
  const hasCurrentMessages = chatSession.messages.some((m) => m.createdAt.getTime() >= startedAtMs);
  if (chatSession.totalCost > 0 || hasCurrentMessages) {
    return NextResponse.json(
      { error: "Session has already started and cannot be cancelled." },
      { status: 409 }
    );
  }

  await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      status: "ENDED",
      endedAt: new Date(),
      totalCost: 0,
    },
  });

  await prisma.transaction.create({
    data: {
      userId: chatSession.userId,
      amount: 0,
      type: "CREDIT",
      reason: isUser
        ? "Chat cancelled by user before astrologer joined (no charge)"
        : "Chat cancelled by astrologer (no charge)",
    },
  });

  return NextResponse.json({ success: true, message: "Session cancelled" });
}
