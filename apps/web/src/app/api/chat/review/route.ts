import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId, astrologerId, rating, comment } = await req.json();

  if (!sessionId || !astrologerId || !rating) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  try {
    // Ensure the session exists and belongs to this user
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!chatSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (chatSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized for this session" }, { status: 403 });
    }

    // Upsert to prevent duplicate reviews for the same session
    const review = await prisma.review.upsert({
      where: { sessionId },
      update: {
        rating,
        comment,
      },
      create: {
        rating,
        comment,
        userId: session.user.id,
        astrologerId,
        sessionId,
      },
    });

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Failed to submit review:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
