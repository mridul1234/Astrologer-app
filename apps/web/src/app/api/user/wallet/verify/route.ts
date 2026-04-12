import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { auth } from "@/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = await req.json();

  // Cryptographic signature verification
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  // Check if this order has already been processed (idempotency)
  const existing = await prisma.transaction.findFirst({
    where: { referenceId: razorpay_order_id },
  });
  if (existing) {
    return NextResponse.json({ error: "Payment already processed" }, { status: 400 });
  }

  // Credit the exact amount with no extras, log transaction
  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { walletBalance: { increment: Number(amount) } },
    }),
    prisma.transaction.create({
      data: {
        userId: session.user.id,
        amount: Number(amount),
        type: "CREDIT",
        reason: `Wallet top-up via Razorpay (${razorpay_payment_id})`,
        referenceId: razorpay_order_id,
      },
    }),
  ]);

  return NextResponse.json({ success: true, balance: user.walletBalance });
}
