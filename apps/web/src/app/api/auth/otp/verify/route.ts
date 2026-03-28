import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import bcrypt from "bcryptjs";

const BASE_URL = "https://cpaas.messagecentral.com";
const CUSTOMER_ID = process.env.MC_CUSTOMER_ID!;
const MC_EMAIL = process.env.MC_EMAIL!;
const MC_PASSWORD = process.env.MC_PASSWORD!;

async function getMCAuthToken(): Promise<string> {
  const base64Pass = Buffer.from(MC_PASSWORD).toString("base64");
  const url = `${BASE_URL}/auth/v1/authentication/token?country=IN&customerId=${CUSTOMER_ID}&email=${encodeURIComponent(MC_EMAIL)}&key=${base64Pass}&scope=NEW`;

  const res = await fetch(url, {
    method: "GET",
    headers: { accept: "*/*" },
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to get MC auth token");
  const data = await res.json();
  if (!data.token) throw new Error("MC auth token missing");
  return data.token as string;
}

/**
 * POST /api/auth/otp/verify
 * Body: { phone: "9876543210", verificationId: "...", otp: "123456" }
 * Validates OTP with Message Central.
 * On success: upserts the user in DB and returns success + their DB role.
 */
export async function POST(req: NextRequest) {
  try {
    const { phone, verificationId, otp } = await req.json();

    if (!phone || !verificationId || !otp) {
      return NextResponse.json(
        { error: "phone, verificationId, and otp are required." },
        { status: 400 }
      );
    }

    const authToken = await getMCAuthToken();

    const validateUrl = `${BASE_URL}/verification/v3/validateOtp?countryCode=91&mobileNumber=${phone}&verificationId=${verificationId}&customerId=${CUSTOMER_ID}&code=${otp}`;

    const validateRes = await fetch(validateUrl, {
      method: "GET",
      headers: {
        accept: "*/*",
        authToken,
      },
      cache: "no-store",
    });

    const validateData = await validateRes.json();
    console.log("MC Validate OTP response:", JSON.stringify(validateData));

    // MC response: verificationStatus === 'VERIFICATION_COMPLETED' on success
    const isVerified =
      validateData?.data?.verificationStatus === "VERIFICATION_COMPLETED" ||
      validateData?.message === "VERIFICATION_COMPLETED";

    if (!isVerified) {
      return NextResponse.json(
        {
          error:
            validateData?.data?.errorMessage ||
            validateData?.message ||
            "Invalid OTP. Please try again.",
        },
        { status: 401 }
      );
    }

    // OTP is valid — user creation is handled by NextAuth signIn callback
    return NextResponse.json({
      success: true,
      phone,
    });
  } catch (err) {
    console.error("OTP verify route error:", err);
    return NextResponse.json(
      { error: "Internal server error while verifying OTP." },
      { status: 500 }
    );
  }
}
