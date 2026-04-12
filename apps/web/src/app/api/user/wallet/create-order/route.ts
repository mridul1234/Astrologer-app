import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount } = await req.json();
  const amountNum = Number(amount);
  if (!amountNum || amountNum < 10) {
    return NextResponse.json({ error: "Minimum recharge is ₹10" }, { status: 400 });
  }

  try {
    const order = await (razorpay.orders as any).create({
      amount: amountNum * 100, // Razorpay expects paise
      currency: "INR",
      receipt: `wallet_${session.user.id}_${Date.now()}`,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: amountNum,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    console.error("Razorpay order creation failed:", err);
    return NextResponse.json({ error: "Payment gateway error" }, { status: 500 });
  }
}
