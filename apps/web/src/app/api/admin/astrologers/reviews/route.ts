import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { astrologerId, rating, comment, reviewerName } = await req.json();
    if (!astrologerId || !rating || !reviewerName) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const review = await prisma.review.create({
      data: {
        astrologerId,
        rating: Number(rating),
        comment,
        reviewerName
      }
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
