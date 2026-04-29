/**
 * Gupshup WhatsApp Notification Service
 * Sends WhatsApp messages to astrologers when a user requests a chat.
 */

const GUPSHUP_API_URL = "https://api.gupshup.io/sm/api/v1/msg";
const GUPSHUP_API_KEY = process.env.GUPSHUP_API_KEY!;
const GUPSHUP_SOURCE_NUMBER = process.env.GUPSHUP_SOURCE_NUMBER!; // Your Gupshup registered sender number
const GUPSHUP_APP_NAME = process.env.GUPSHUP_APP_NAME!; // Your Gupshup app name

/**
 * Sends a WhatsApp notification to an astrologer when a user requests a chat.
 * @param astrologerPhone - The astrologer's WhatsApp number (with country code, e.g. 919876543210)
 * @param userName - The name of the user requesting the chat
 * @param sessionId - The chat session ID
 */
export async function sendChatRequestNotification(
  astrologerPhone: string,
  userName: string,
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  if (!GUPSHUP_API_KEY || !GUPSHUP_SOURCE_NUMBER || !GUPSHUP_APP_NAME) {
    console.warn("[Gupshup] Missing env vars — skipping WhatsApp notification.");
    return { success: false, error: "Gupshup not configured" };
  }

  // Normalise phone: strip non-digits, ensure leading country code
  const phone = normalisePhone(astrologerPhone);
  if (!phone) {
    return { success: false, error: "Invalid phone number" };
  }

  const message = buildChatRequestMessage(userName, sessionId);

  try {
    const params = new URLSearchParams({
      channel: "whatsapp",
      source: GUPSHUP_SOURCE_NUMBER,
      destination: phone,
      message: JSON.stringify({ type: "text", text: message }),
      "src.name": GUPSHUP_APP_NAME,
    });

    const response = await fetch(GUPSHUP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        apikey: GUPSHUP_API_KEY,
      },
      body: params.toString(),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.status === "error") {
      console.error("[Gupshup] Notification failed:", data);
      return { success: false, error: data?.message ?? "Unknown error" };
    }

    console.log(`[Gupshup] Notification sent to ${phone} for session ${sessionId}`);
    return { success: true };
  } catch (err) {
    console.error("[Gupshup] Request error:", err);
    return { success: false, error: String(err) };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalisePhone(raw: string): string | null {
  // Strip everything except digits
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return null;
  // If already has country code (12+ digits), use as-is
  if (digits.length >= 12) return digits;
  // Assume Indian number — prepend 91
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function buildChatRequestMessage(userName: string, sessionId: string): string {
  return (
    `🔮 *New Chat Request on AstroWalla!*\n\n` +
    `👤 *User:* ${userName}\n` +
    `🕐 *Requested at:* ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}\n\n` +
    `Please open your AstroWalla dashboard to accept the chat.\n\n` +
    `Session ID: \`${sessionId}\``
  );
}
