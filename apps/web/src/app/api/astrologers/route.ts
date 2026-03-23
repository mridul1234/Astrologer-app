import { NextResponse } from "next/server";
import { prisma } from "@astrology/db";

export async function GET() {
  const astrologers = await prisma.astrologer.findMany({
    include: { 
      user: { select: { name: true } },
      reviews: { select: { rating: true } },
      chatSessions: {
        where: { status: "ACTIVE" },
        select: { id: true, startedAt: true },
        orderBy: { startedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { isOnline: "desc" },
  });

  const formatted = astrologers.map(a => {
    const total = a.reviews.length;
    const avg = total > 0 ? a.reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
    const activeSession = a.chatSessions[0] ?? null;
    
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
      experienceYears: a.experienceYears,
      languages: a.languages,
    };
  });

  return NextResponse.json(formatted);
}
