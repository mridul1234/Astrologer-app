/**
 * Telegram Webhook Handler
 *
 * Telegram calls this endpoint whenever an astrologer messages your bot.
 * It automatically saves their chat_id to the DB so you never need to
 * manually enter it — the flow is:
 *
 *   1. You set the webhook once (after deploy):
 *      https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://astrowalla.com/api/telegram/webhook
 *
 *   2. Astrologer opens Telegram → searches your bot → sends /start
 *
 *   3. This handler:
 *      a. Reads their Telegram username / first name
 *      b. Tries to match them to an Astrologer in DB (by searching for their
 *         Telegram username in a dedicated field OR prompting them to link)
 *      c. For now: replies with their chat_id so they can paste it in Settings
 *
 *   4. Astrologer copies the chat_id → pastes into Profile Settings → Save
 *      → Done. They will now receive instant Telegram notifications.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Telegram sends updates — we only care about messages
    const message = body?.message;
    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const chatId: number = message.chat?.id;
    const text: string = message.text ?? "";
    const firstName: string = message.from?.first_name ?? "Astrologer";
    const username: string | undefined = message.from?.username;

    if (!chatId) return NextResponse.json({ ok: true });

    console.log(`[Telegram Webhook] Message from chat_id ${chatId} (@${username ?? "no-username"}): "${text}"`);

    // ── /start command ──────────────────────────────────────────────────────
    if (text.startsWith("/start")) {
      await sendTelegramMessage(
        chatId,
        `👋 Hello ${firstName}! Welcome to AstroWalla Alerts.\n\n` +
        `Your Telegram Chat ID is:\n\n` +
        `🆔  ${chatId}\n\n` +
        `Copy this number and paste it into your Profile Settings on the AstroWalla Astrologer Portal to start receiving instant chat request notifications.\n\n` +
        `➡️ https://astrowalla.com/astrologer\n\n` +
        `Once saved, you'll be notified here every time a user wants to consult with you! 🔔`
      );
      return NextResponse.json({ ok: true });
    }

    // ── /myid command ───────────────────────────────────────────────────────
    if (text.startsWith("/myid")) {
      await sendTelegramMessage(chatId, `🆔 Your Telegram Chat ID is: ${chatId}`);
      return NextResponse.json({ ok: true });
    }

    // ── /link <email> command — auto-link account ───────────────────────────
    // Example: astrologer sends "/link john@example.com"
    if (text.startsWith("/link ")) {
      const email = text.replace("/link ", "").trim().toLowerCase();

      if (!email.includes("@")) {
        await sendTelegramMessage(chatId, `❌ Invalid email. Usage: /link your@email.com`);
        return NextResponse.json({ ok: true });
      }

      // Find the user with this email
      const user = await prisma.user.findUnique({
        where: { email },
        include: { astrologerProfile: true },
      });

      if (!user || !user.astrologerProfile) {
        await sendTelegramMessage(
          chatId,
          `❌ No astrologer account found with email: ${email}\n\nMake sure you're using the same email registered on AstroWalla.`
        );
        return NextResponse.json({ ok: true });
      }

      // Save the telegramChatId to their profile
      await prisma.astrologer.update({
        where: { id: user.astrologerProfile.id },
        data: { telegramChatId: String(chatId) },
      });

      await sendTelegramMessage(
        chatId,
        `✅ Successfully linked!\n\nYour account (${email}) is now connected to this Telegram chat.\n\nYou'll receive instant notifications here whenever a user requests a consultation. 🔔`
      );

      console.log(`[Telegram Webhook] Auto-linked chat_id ${chatId} to astrologer ${user.astrologerProfile.id} (${email})`);
      return NextResponse.json({ ok: true });
    }

    // ── Default response for any other message ──────────────────────────────
    await sendTelegramMessage(
      chatId,
      `👋 Hi ${firstName}!\n\n` +
      `Available commands:\n` +
      `• /start — Get started & see your Chat ID\n` +
      `• /myid — Get your Chat ID\n` +
      `• /link your@email.com — Auto-link your AstroWalla account`
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Telegram Webhook] Error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// Telegram sends a GET to verify the webhook is alive
export async function GET() {
  return NextResponse.json({ status: "AstroWalla Telegram webhook active" });
}
