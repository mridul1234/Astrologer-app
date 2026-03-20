import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { auth } from "@/auth";

// POST /api/astrologer/online  — toggle online status
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { isOnline } = await req.json();

  const astrologer = await prisma.astrologer.update({
    where: { userId: session.user.id },
    data: { isOnline: Boolean(isOnline) },
  });

  return NextResponse.json({ isOnline: astrologer.isOnline });
}
