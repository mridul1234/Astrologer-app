/**
 * Telegram Notification Service
 * Sends Telegram messages to astrologers when a user requests a chat.
 * Zero cost, no template approval needed — just a bot token from BotFather.
 *
 * Setup:
 *  1. Create a bot via @BotFather → get TELEGRAM_BOT_TOKEN
 *  2. Each astrologer messages the bot → webhook saves their chat ID to DB
 *  3. Chat ID is stored as Astrologer.telegramChatId
 */

const TELEGRAM_API = "https://api.telegram.org";

/**
 * Sends a Telegram notification to an astrologer when a user requests a chat.
 * @param telegramChatId - The astrologer's Telegram chat ID (numeric string)
 * @param userName       - The name of the user requesting the chat
 * @param sessionId      - The chat session ID
 */
export async function sendChatRequestNotification(
  telegramChatId: string,
  userName: string,
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("[Telegram] TELEGRAM_BOT_TOKEN not set — skipping notification.");
    return { success: false, error: "TELEGRAM_BOT_TOKEN not configured" };
  }

  const message =
    `🔔 *New Chat Request!*\n\n` +
    `👤 User *${escapeMarkdown(userName)}* wants to consult with you\\.\n\n` +
    `👉 [Open Dashboard](https://astrowalla.com/astrologer) to accept the request\\.\n\n` +
    `_Session ID: \`${sessionId}\`_`;

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: message,
        parse_mode: "MarkdownV2",
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      console.error("[Telegram] sendMessage failed:", data);
      return { success: false, error: data.description ?? "Unknown Telegram error" };
    }

    console.log(`[Telegram] Notification sent to chat_id ${telegramChatId} for session ${sessionId}`);
    return { success: true };
  } catch (err) {
    console.error("[Telegram] Request error:", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Sends a plain text message to a Telegram chat ID.
 * Used by the webhook to reply to astrologers with their chat ID.
 */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Escapes special chars for Telegram MarkdownV2 */
function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}
