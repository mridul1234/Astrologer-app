import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://cpaas.messagecentral.com";
const CUSTOMER_ID = process.env.MC_CUSTOMER_ID!;
const MC_EMAIL = process.env.MC_EMAIL!;
const MC_PASSWORD = process.env.MC_PASSWORD!;

/**
 * Step 1: Generate a Message Central auth token.
 * Token is short-lived so we regenerate per request.
 */
async function getMCAuthToken(): Promise<string> {
  const base64Pass = Buffer.from(MC_PASSWORD).toString("base64");
  const url = `${BASE_URL}/auth/v1/authentication/token?country=IN&customerId=${CUSTOMER_ID}&email=${encodeURIComponent(MC_EMAIL)}&key=${base64Pass}&scope=NEW`;
  
  const res = await fetch(url, {
    method: "GET",
    headers: { accept: "*/*" },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MC auth token error: ${text}`);
  }

  const data = await res.json();
  if (!data.token) throw new Error("MC auth token missing in response");
  return data.token as string;
}

/**
 * POST /api/auth/otp/send
 * Body: { phone: "9876543210" }
 * Returns: { verificationId: "..." }
 */
export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number. Must be 10 digits." },
        { status: 400 }
      );
    }

    const authToken = await getMCAuthToken();

    const sendUrl = `${BASE_URL}/verification/v3/send?countryCode=91&customerId=${CUSTOMER_ID}&flowType=SMS&mobileNumber=${phone}`;

    const sendRes = await fetch(sendUrl, {
      method: "POST",
      headers: {
        accept: "*/*",
        authToken,
      },
      cache: "no-store",
    });

    const sendData = await sendRes.json();

    // MC returns responseCode 200 inside body.data on success
    if (
      sendData?.data?.responseCode === 200 &&
      !sendData?.data?.errorMessage
    ) {
      return NextResponse.json({
        success: true,
        verificationId: sendData.data.verificationId as string,
      });
    }

    console.error("MC Send OTP error:", sendData);
    return NextResponse.json(
      { error: sendData?.data?.errorMessage || "Failed to send OTP." },
      { status: 500 }
    );
  } catch (err) {
    console.error("OTP send route error:", err);
    return NextResponse.json(
      { error: "Internal server error while sending OTP." },
      { status: 500 }
    );
  }
}
