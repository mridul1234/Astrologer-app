import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { auth } from "@/auth";
import jwt from "jsonwebtoken";

// POST /api/chat/start  — resumes or starts a chat session
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { astrologerId } = await req.json();
  if (!astrologerId) {
    return NextResponse.json({ error: "astrologerId required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const astrologer = await prisma.astrologer.findUnique({
    where: { id: astrologerId },
  });
  if (!astrologer) {
    return NextResponse.json({ error: "Astrologer not found" }, { status: 404 });
  }

  // Allow entry if user has free minutes OR sufficient wallet balance
  if (user.freeMinutesLeft <= 0 && user.walletBalance < astrologer.ratePerMin) {
    return NextResponse.json(
      { error: "Insufficient balance. Please top up your wallet." },
      { status: 402 }
    );
  }

  // --- Check for an existing session between this user + astrologer ---
  const existingSession = await prisma.chatSession.findFirst({
    where: {
      userId: session.user.id,
      astrologerId,
    },
    orderBy: { startedAt: "desc" },
  });

  let chatSession;

  if (existingSession) {
    // Reactivate existing session
    chatSession = await prisma.chatSession.update({
      where: { id: existingSession.id },
      data: { status: "ACTIVE", endedAt: null },
    });
  } else {
    // Create a brand new session
    chatSession = await prisma.chatSession.create({
      data: {
        userId: session.user.id,
        astrologerId,
        status: "ACTIVE",
      },
    });
  }

  // Generate a short-lived socket token for this user
  const socketToken = jwt.sign(
    { userId: session.user.id },
    process.env.SOCKET_SECRET!,
    { expiresIn: "24h" }
  );

  return NextResponse.json({
    sessionId: chatSession.id,
    socketToken,
    astrologer: {
      id: astrologer.id,
      ratePerMin: astrologer.ratePerMin,
    },
    freeMinutesLeft: user.freeMinutesLeft,
    resumed: !!existingSession,
  });
}
