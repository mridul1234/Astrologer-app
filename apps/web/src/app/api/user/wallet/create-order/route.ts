import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import Razorpay from "razorpay";

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

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  try {
    // Receipt must be ≤40 chars for Razorpay
    const receipt = `wp_${session.user.id.slice(-10)}_${Date.now().toString().slice(-8)}`;

    const order = await (razorpay.orders as any).create({
      amount: amountNum * 100, // paise
      currency: "INR",
      receipt,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: amountNum,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    console.error("Razorpay order creation failed:", JSON.stringify(err));
    return NextResponse.json({ error: "Payment gateway error", detail: err?.error?.description }, { status: 500 });
  }
}
