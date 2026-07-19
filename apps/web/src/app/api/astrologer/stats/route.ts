import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { getRequestUser } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
  const session = await getRequestUser(req);
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const astrologer = await prisma.astrologer.findUnique({
    where: { userId: session.id },
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
    .filter((s: any) => s.status === "ENDED")
    .reduce((acc: number, curr: any) => acc + (curr.totalCost || 0), 0);

  return NextResponse.json({
    sessions: astrologer.chatSessions,
    totalEarnings,
    isOnline: astrologer.isOnline
  });
}
