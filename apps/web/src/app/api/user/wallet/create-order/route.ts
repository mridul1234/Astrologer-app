import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/mobile-auth";
import { prisma } from "@astrology/db";
import Razorpay from "razorpay";

export async function POST(req: NextRequest) {
  const session = await getRequestUser(req);
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount, purpose } = await req.json();
  const amountNum = Number(amount);
  const isIntroChatPass = purpose === "INTRO_CHAT_PASS";
  if (isIntroChatPass && amountNum !== 1) {
    return NextResponse.json({ error: "The intro chat pass costs Rs 1" }, { status: 400 });
  }
  if (!isIntroChatPass && (!amountNum || amountNum < 10)) {
    return NextResponse.json({ error: "Minimum recharge is ₹10" }, { status: 400 });
  }

  if (isIntroChatPass) {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { introOfferUsed: true },
    });
    if (user?.introOfferUsed) {
      return NextResponse.json({ error: "This one-time intro offer has already been used" }, { status: 409 });
    }
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  try {
    // Receipt must be ≤40 chars for Razorpay
    const receipt = `wp_${session.id.slice(-10)}_${Date.now().toString().slice(-8)}`;

    const order = await (razorpay.orders as any).create({
      amount: amountNum * 100, // paise
      currency: "INR",
      receipt,
      notes: {
        purpose: isIntroChatPass ? "intro_chat_pass" : "wallet_top_up",
        userId: session.id,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: amountNum,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      purpose: isIntroChatPass ? "INTRO_CHAT_PASS" : "WALLET_TOP_UP",
    });
  } catch (err: any) {
    console.error("Razorpay order creation failed:", JSON.stringify(err));
    return NextResponse.json({ error: "Payment gateway error", detail: err?.error?.description }, { status: 500 });
  }
}
