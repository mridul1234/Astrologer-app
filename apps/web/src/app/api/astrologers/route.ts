import { NextResponse } from "next/server";
import { prisma } from "@astrology/db";

export async function GET() {
  const astrologers = await prisma.astrologer.findMany({
    include: { 
      user: { select: { name: true } },
      reviews: { select: { rating: true } }, 
    },
    orderBy: { isOnline: "desc" },
  });

  const formatted = astrologers.map(a => {
    const total = a.reviews.length;
    const avg = total > 0 ? a.reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
    
    return { 
      id: a.id,
      userId: a.userId,
      bio: a.bio,
      speciality: a.speciality,
      ratePerMin: a.ratePerMin,
      isOnline: a.isOnline,
      user: a.user,
      reviewCount: total, 
      averageRating: avg 
    };
  });

  return NextResponse.json(formatted);
}
