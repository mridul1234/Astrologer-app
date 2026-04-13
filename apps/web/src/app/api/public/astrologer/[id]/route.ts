import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const astrologer = await prisma.astrologer.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true }
        },
        reviews: {
          include: {
            user: { select: { name: true } }
          },
          orderBy: { createdAt: "desc" }
        },
        chatSessions: {
          select: { id: true }
        }
      }
    });

    if (!astrologer) {
      return NextResponse.json({ error: "Astrologer not found" }, { status: 404 });
    }

    const orderCount = astrologer.chatSessions.length;
    const avgRating = astrologer.reviews.length > 0 
      ? astrologer.reviews.reduce((acc, r) => acc + r.rating, 0) / astrologer.reviews.length 
      : 0;

    return NextResponse.json({
      id: astrologer.id,
      name: astrologer.user.name,
      bio: astrologer.bio,
      speciality: astrologer.speciality,
      categories: astrologer.categories,
      experienceYears: astrologer.experienceYears,
      languages: astrologer.languages,
      ratePerMin: astrologer.ratePerMin,
      isOnline: astrologer.isOnline,
      orderCount,
      avgRating,
      reviews: astrologer.reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        reviewerName: r.reviewerName || r.user?.name || "Anonymous User",
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    console.error("Failed to fetch astrologer profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
