import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const withdrawals = await prisma.withdrawalRequest.findMany({
    include: { astrologer: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ withdrawals });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { id, action } = await req.json(); // action can be "APPROVE" or "REJECT"
    if (!id || !["APPROVE", "REJECT"].includes(action)) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const reqData = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: { astrologer: { include: { user: true } } }
    });

    if (!reqData) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (reqData.status !== "PENDING") return NextResponse.json({ error: "Already processed" }, { status: 400 });

    if (action === "APPROVE") {
      await prisma.$transaction([
        prisma.withdrawalRequest.update({
          where: { id },
          data: { status: "APPROVED", processedAt: new Date() }
        }),
        prisma.transaction.create({
          data: {
            userId: reqData.astrologer.userId,
            amount: reqData.amount,
            type: "DEBIT",
            reason: `Withdrawal Approved - ID: ${id}`,
          }
        })
      ]);
    } else {
      // Reject: refund wallet balance
      await prisma.$transaction([
        prisma.withdrawalRequest.update({
          where: { id },
          data: { status: "REJECTED", processedAt: new Date() }
        }),
        prisma.user.update({
          where: { id: reqData.astrologer.userId },
          data: { walletBalance: { increment: reqData.amount } }
        }),
        prisma.transaction.create({
          data: {
            userId: reqData.astrologer.userId,
            amount: reqData.amount,
            type: "CREDIT",
            reason: `Withdrawal Rejected (Refund) - ID: ${id}`,
          }
        })
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
