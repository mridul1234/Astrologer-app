import { NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const astrologer = await prisma.astrologer.findUnique({
    where: { userId: session.user.id },
    include: {
      chatSessions: {
        where: {
          OR: [
            { status: "ACTIVE" },
            { status: "ENDED" }
          ]
        },
        orderBy: { startedAt: "desc" },
        include: {
          user: { select: { name: true } }
        }
      }
    }
  });

  if (!astrologer) {
    return NextResponse.json({ error: "Astrologer profile not found" }, { status: 404 });
  }

  // Calculate total earnings from ended sessions
  const totalEarnings = astrologer.chatSessions
    .filter(s => s.status === "ENDED")
    .reduce((acc, curr) => acc + (curr.totalCost || 0), 0);

  return NextResponse.json({
    sessions: astrologer.chatSessions,
    totalEarnings,
    isOnline: astrologer.isOnline
  });
}
