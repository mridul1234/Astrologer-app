import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { auth } from "@/auth";

/**
 * POST /api/chat/cancel
 * Called by the astrologer to reject/cancel an incoming session before joining.
 * Marks the session ENDED and refunds the user's wallet.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await req.json();
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  // Verify the session belongs to this astrologer
  const astrologer = await prisma.astrologer.findUnique({
    where: { userId: session.user.id },
  });
  if (!astrologer) {
    return NextResponse.json({ error: "Not an astrologer" }, { status: 403 });
  }

  const chatSession = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!chatSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (chatSession.astrologerId !== astrologer.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (chatSession.status !== "ACTIVE") {
    return NextResponse.json({ error: "Session already ended" }, { status: 400 });
  }

  // End the session with 0 cost (refund — no charge since astrologer never joined)
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      status: "ENDED",
      endedAt: new Date(),
      totalCost: 0,
    },
  });

  // Refund any deducted balance (totalCost was 0 at creation, so no refund needed)
  // But log a descriptive transaction for transparency
  await prisma.transaction.create({
    data: {
      userId: chatSession.userId,
      amount: 0,
      type: "CREDIT",
      reason: "Chat cancelled by astrologer (no charge)",
    },
  });

  return NextResponse.json({ success: true, message: "Session cancelled" });
}
