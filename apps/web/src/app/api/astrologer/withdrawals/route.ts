import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const astrologer = await prisma.astrologer.findUnique({ where: { userId: session.user.id } });
  if (!astrologer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const withdrawals = await prisma.withdrawalRequest.findMany({
    where: { astrologerId: astrologer.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ withdrawals });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { amount } = await req.json();
    if (!amount || amount < 500) return NextResponse.json({ error: "Minimum withdrawal is ₹500" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { astrologerProfile: true }
    });

    if (!user || !user.astrologerProfile) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (user.walletBalance < amount) return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });

    const request = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { walletBalance: { decrement: amount } }
      }),
      prisma.withdrawalRequest.create({
        data: {
          astrologerId: user.astrologerProfile.id,
          amount,
          status: "PENDING",
        }
      })
    ]);

    return NextResponse.json({ success: true, request: request[1] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
