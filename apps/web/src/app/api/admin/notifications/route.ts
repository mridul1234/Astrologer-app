import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { auth } from "@/auth";
import { sendPushToAudience } from "@/lib/push-notifications";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const [userTokens, astrologerTokens] = await Promise.all([
    prisma.pushToken.count({ where: { enabled: true, appType: "USER" } }),
    prisma.pushToken.count({ where: { enabled: true, appType: "ASTROLOGER" } }),
  ]);

  return NextResponse.json({
    counts: {
      users: userTokens,
      astrologers: astrologerTokens,
      all: userTokens + astrologerTokens,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { title, body, audience } = await req.json();
  const normalizedAudience = audience === "ASTROLOGERS" || audience === "ALL" ? audience : "USERS";

  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
  }

  const result = await sendPushToAudience(normalizedAudience, {
    title: title.trim(),
    body: body.trim(),
    data: {
      type: "admin_campaign",
      audience: normalizedAudience,
    },
  });

  return NextResponse.json({ success: true, ...result });
}
