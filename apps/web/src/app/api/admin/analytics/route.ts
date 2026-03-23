import { NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalAstrologers,
      activeSessions,
      todayRevenueObj,
      totalRevenueObj,
    ] = await Promise.all([
      // Count Users
      prisma.user.count({ where: { role: "USER" } }),
      
      // Count Astrologers
      prisma.user.count({ where: { role: "ASTROLOGER" } }),
      
      // Count currently active sessions
      prisma.chatSession.count({ where: { status: "ACTIVE" } }),
      
      // Today's Revenue (Sum of DEBITs today representing chat spend)
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          type: "DEBIT",
          createdAt: { gte: today },
        },
      }),

      // Total Revenue overall (Sum of all DEBITs)
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          type: "DEBIT",
        },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalAstrologers,
      activeSessions,
      todayRevenue: todayRevenueObj._sum.amount || 0,
      totalRevenue: totalRevenueObj._sum.amount || 0,
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
