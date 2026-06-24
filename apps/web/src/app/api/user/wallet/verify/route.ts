import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { auth } from "@/auth";
import crypto from "crypto";
import Razorpay from "razorpay";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

  // Cryptographic signature verification
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
  const order = await (razorpay.orders as any).fetch(razorpay_order_id);
  const amountNum = Number(order.amount) / 100;
  const isIntroChatPass = order.notes?.purpose === "intro_chat_pass";

  if (order.notes?.userId !== session.user.id) {
    return NextResponse.json({ error: "This payment belongs to another account" }, { status: 403 });
  }
  if (isIntroChatPass && amountNum !== 1) {
    return NextResponse.json({ error: "Invalid intro chat pass amount" }, { status: 400 });
  }
  if (!isIntroChatPass && amountNum < 10) {
    return NextResponse.json({ error: "Invalid wallet top-up amount" }, { status: 400 });
  }

  // Check if this order has already been processed (idempotency)
  const existing = await prisma.transaction.findFirst({
    where: { referenceId: razorpay_order_id },
  });
  if (existing) {
    return NextResponse.json({ error: "Payment already processed" }, { status: 400 });
  }

  try {
    const user = await prisma.$transaction(async (tx) => {
      if (isIntroChatPass) {
        const claimedOffer = await tx.user.updateMany({
          where: { id: session.user.id, introOfferUsed: false },
          data: { freeMinutesLeft: { increment: 3 }, introOfferUsed: true },
        });
        if (claimedOffer.count !== 1) throw new Error("INTRO_OFFER_USED");
        const updatedUser = await tx.user.findUniqueOrThrow({ where: { id: session.user.id } });
        await tx.transaction.create({
          data: {
            userId: session.user.id,
            amount: amountNum,
            type: "CREDIT",
            reason: `Rs 1 Intro Chat Pass - 3 minutes unlocked (${razorpay_payment_id})`,
            referenceId: razorpay_order_id,
          },
        });
        return updatedUser;
      }

      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: { walletBalance: { increment: amountNum } },
      });
      await tx.transaction.create({
        data: {
          userId: session.user.id,
          amount: amountNum,
          type: "CREDIT",
          reason: `Wallet top-up via Razorpay (${razorpay_payment_id})`,
          referenceId: razorpay_order_id,
        },
      });
      return updatedUser;
    });

    return NextResponse.json({
      success: true,
      balance: user.walletBalance,
      introMinutesLeft: user.freeMinutesLeft,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INTRO_OFFER_USED") {
      return NextResponse.json({ error: "This one-time intro offer has already been used" }, { status: 409 });
    }
    throw error;
  }
}
