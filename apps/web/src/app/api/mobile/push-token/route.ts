import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { getRequestUser } from "@/lib/mobile-auth";
import { isExpoPushToken } from "@/lib/push-notifications";

export async function POST(req: NextRequest) {
  const session = await getRequestUser(req);
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token, platform, appType } = await req.json();
  const normalizedAppType = appType === "ASTROLOGER" ? "ASTROLOGER" : "USER";

  if (!token || typeof token !== "string" || !isExpoPushToken(token)) {
    return NextResponse.json({ error: "Valid Expo push token required." }, { status: 400 });
  }

  if (normalizedAppType === "ASTROLOGER" && session.role !== "ASTROLOGER") {
    return NextResponse.json({ error: "Only astrologers can register astrologer app tokens." }, { status: 403 });
  }

  await prisma.pushToken.upsert({
    where: { token },
    update: {
      userId: session.id,
      platform: platform || null,
      appType: normalizedAppType,
      enabled: true,
    },
    create: {
      userId: session.id,
      token,
      platform: platform || null,
      appType: normalizedAppType,
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getRequestUser(req);
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await req.json().catch(() => ({}));
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token required." }, { status: 400 });
  }

  await prisma.pushToken.updateMany({
    where: { userId: session.id, token },
    data: { enabled: false },
  });

  return NextResponse.json({ success: true });
}
