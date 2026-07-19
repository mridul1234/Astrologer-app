import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@astrology/db";
import { getRequestUser } from "@/lib/mobile-auth";
import jwt from "jsonwebtoken";
import { sendChatRequestNotification } from "@/lib/telegram";
import { sendChatRequestCall } from "@/lib/vobiz";
import { sendPushToUsers } from "@/lib/push-notifications";

// POST /api/chat/start  — resumes or starts a chat session
export async function POST(req: NextRequest) {
  const session = await getRequestUser(req);
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { astrologerId } = await req.json();
  if (!astrologerId) {
    return NextResponse.json({ error: "astrologerId required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const astrologer = await prisma.astrologer.findUnique({
    where: { id: astrologerId },
  });
  if (!astrologer) {
    return NextResponse.json({ error: "Astrologer not found" }, { status: 404 });
  }

  // Brand-new seekers must unlock the Rs 1 intro chat pass before any chat can start.
  // Wallet balance should not bypass this first-chat paywall.
  if (!user.introOfferUsed && user.freeMinutesLeft <= 0) {
    return NextResponse.json(
      {
        error: "Unlock your first 3 minutes for Rs 1 before starting chat.",
        introOfferAvailable: true,
      },
      { status: 402 }
    );
  }

  // After the intro pass is bought/used, allow entry when the user has intro-pass
  // minutes or enough wallet balance for the selected astrologer's per-minute rate.
  if (user.freeMinutesLeft <= 0 && user.walletBalance < astrologer.ratePerMin) {
    return NextResponse.json(
      {
        error: "Insufficient balance. Please top up your wallet.",
        introOfferAvailable: !user.introOfferUsed,
      },
      { status: 402 }
    );
  }

  // --- Check for an existing session between this user + astrologer ---
  const existingSession = await prisma.chatSession.findFirst({
    where: {
      userId: session.id,
      astrologerId,
    },
    orderBy: { startedAt: "desc" },
  });

  let chatSession;

  if (existingSession) {
    // Reactivate existing session — reset startedAt so astrologer's countdown is fresh
    chatSession = await prisma.chatSession.update({
      where: { id: existingSession.id },
      data: { status: "ACTIVE", endedAt: null, startedAt: new Date() },
    });
  } else {
    // Create a brand new session
    chatSession = await prisma.chatSession.create({
      data: {
        userId: session.id,
        astrologerId,
        status: "ACTIVE",
      },
    });
  }

  // Generate a short-lived socket token for this user
  const socketToken = jwt.sign(
    { userId: session.id },
    process.env.SOCKET_SECRET!,
    { expiresIn: "24h" }
  );

  // ─── Send Telegram notification AFTER the response ───────────────────────────
  // after() runs once the response has been sent, so the user is redirected to
  // the chat page immediately without waiting for external alert APIs.
  after(async () => {
    console.log(`[chat/start] Astrologer ID: ${astrologer.id}, phoneNumber: ${astrologer.phoneNumber ?? "NOT SET"}, telegramChatId: ${astrologer.telegramChatId ?? "NOT SET"}`);
    try {
      await sendPushToUsers([astrologer.userId], {
        title: "New chat request",
        body: `${user.name} is waiting for your guidance.`,
        data: { type: "chat_request", sessionId: chatSession.id },
      });
    } catch (err) {
      console.error("[chat/start] Push notification error:", err);
    }

    if (astrologer.phoneNumber) {
      console.log(`[chat/start] Sending Vobiz call alert to ${astrologer.phoneNumber} for user ${user.name}`);
      try {
        const result = await sendChatRequestCall({
          phoneNumber: astrologer.phoneNumber,
          sessionId: chatSession.id,
        });
        console.log("[chat/start] Vobiz call result:", JSON.stringify(result));
      } catch (err) {
        console.error("[chat/start] Vobiz call error:", err);
      }
    } else {
      console.warn(`[chat/start] Skipping Vobiz call — astrologer ${astrologer.id} has no phoneNumber in DB`);
    }

    if (astrologer.telegramChatId) {
      console.log(`[chat/start] Sending Telegram notification to chat_id ${astrologer.telegramChatId} for user ${user.name}`);
      try {
        const result = await sendChatRequestNotification(
          astrologer.telegramChatId,
          user.name,
          chatSession.id
        );
        console.log("[chat/start] Telegram notification result:", JSON.stringify(result));
      } catch (err) {
        console.error("[chat/start] Telegram notification error:", err);
      }
    } else {
      console.warn(`[chat/start] Skipping Telegram — astrologer ${astrologer.id} has no telegramChatId in DB`);
    }
  });

  return NextResponse.json({
    sessionId: chatSession.id,
    socketToken,
    astrologer: {
      id: astrologer.id,
      ratePerMin: astrologer.ratePerMin,
    },
    freeMinutesLeft: user.freeMinutesLeft,
    resumed: !!existingSession,
  });
}
