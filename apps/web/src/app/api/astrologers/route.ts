import { NextResponse } from "next/server";
import { prisma } from "@astrology/db";

export const revalidate = 30; // Cache for 30s at Vercel Edge

export async function GET() {
  const astrologers = await prisma.astrologer.findMany({
    include: { 
      user: { select: { name: true } },
      reviews: { select: { rating: true } },
      chatSessions: {
        where: { status: "ACTIVE" },
        take: 1,
        select: { id: true, startedAt: true, status: true },
      },
      _count: {
        select: {
          chatSessions: { where: { status: "ENDED" } }
        }
      }
    },
  });

  const formatted = astrologers.map(a => {
    const total = a.reviews.length;
    const avg = total > 0 ? a.reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
    const activeSession = a.chatSessions[0] ?? null;
    const orderCount = a._count.chatSessions + a.fakeOrders;
    
    return { 
      id: a.id,
      userId: a.userId,
      bio: a.bio,
      speciality: a.speciality,
      categories: a.categories,
      ratePerMin: a.ratePerMin,
      isOnline: a.isOnline,
      isBusy: !!activeSession,
      sessionStartedAt: activeSession?.startedAt ?? null,
      user: a.user,
      reviewCount: total, 
      averageRating: avg,
      orderCount,
      experienceYears: a.experienceYears,
      languages: a.languages,
    };
  });

  return NextResponse.json(formatted);
}
