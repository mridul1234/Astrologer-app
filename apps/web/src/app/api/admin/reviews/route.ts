import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@astrology/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { astrologerId, reviewerName, rating, comment } = await req.json();

    if (!astrologerId || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        astrologerId,
        rating: Number(rating),
        comment,
        reviewerName: reviewerName || "Anonymous User",
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
