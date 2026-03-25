import { NextResponse } from "next/server";
import { prisma } from "@astrology/db";

export async function GET() {
  const astrologers = await prisma.astrologer.findMany({
    include: { 
      user: { select: { name: true } },
      reviews: { select: { rating: true } },
      chatSessions: {
        select: { id: true, startedAt: true, status: true },
        orderBy: { startedAt: "desc" },
      },
    },
  });

  const formatted = astrologers.map(a => {
    const total = a.reviews.length;
    const avg = total > 0 ? a.reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
    const activeSession = a.chatSessions.find(s => s.status === "ACTIVE") ?? null;
    const orderCount = a.chatSessions.filter(s => s.status === "ENDED").length;
    
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
