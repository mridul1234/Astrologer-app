import { NextResponse } from "next/server";
import { prisma } from "@astrology/db";

export async function GET() {
  const astrologers = await prisma.astrologer.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { isOnline: "desc" },
  });
  return NextResponse.json(astrologers);
}
