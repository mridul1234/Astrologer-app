import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { auth } from "@/auth";

// POST /api/user/wallet/topup  — DEV ONLY mock top-up (replace with Razorpay later)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount } = await req.json();
  const topupAmount = Number(amount) || 1000;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { walletBalance: { increment: topupAmount } },
  });

  await prisma.transaction.create({
    data: {
      userId: session.user.id,
      amount: topupAmount,
      type: "CREDIT",
      reason: "Test top-up (dev mode)",
    },
  });

  return NextResponse.json({ balance: user.walletBalance });
}
