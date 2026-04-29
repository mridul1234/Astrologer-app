/**
 * Gupshup WhatsApp Notification Service
 * Sends WhatsApp messages to astrologers when a user requests a chat.
 * Uses an approved WhatsApp template (required for business-initiated messages).
 *
 * Template name : "notification"
 * Gupshup ID   : d5197943-9e97-46e5-99eb-638585a61d5f
 * Body          : "Hi, a user wants to talk to you. Please join through the dashboard to respond."
 */

// Template endpoint — required for business-initiated conversations
const GUPSHUP_TEMPLATE_URL = "https://api.gupshup.io/wa/api/v1/template/msg";

// Approved template ID from Gupshup dashboard
const TEMPLATE_ID = "d5197943-9e97-46e5-99eb-638585a61d5f";

/**
 * Sends a WhatsApp notification to an astrologer when a user requests a chat.
 * @param astrologerPhone - The astrologer's WhatsApp number (with country code, e.g. 919876543210)
 * @param userName - The name of the user requesting the chat (unused — template is static)
 * @param sessionId - The chat session ID (for logging)
 */
export async function sendChatRequestNotification(
  astrologerPhone: string,
  userName: string,
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  // Read env vars at request time (not module load time) for Next.js compatibility
  const GUPSHUP_API_KEY = process.env.GUPSHUP_API_KEY;
  const GUPSHUP_SOURCE_NUMBER = process.env.GUPSHUP_SOURCE_NUMBER;
  const GUPSHUP_APP_NAME = process.env.GUPSHUP_APP_NAME;

  if (!GUPSHUP_API_KEY || !GUPSHUP_SOURCE_NUMBER || !GUPSHUP_APP_NAME) {
    console.warn("[Gupshup] Missing env vars — skipping WhatsApp notification.");
    console.warn(
      `[Gupshup] GUPSHUP_API_KEY: ${GUPSHUP_API_KEY ? "SET" : "MISSING"}, ` +
      `GUPSHUP_SOURCE_NUMBER: ${GUPSHUP_SOURCE_NUMBER ? "SET" : "MISSING"}, ` +
      `GUPSHUP_APP_NAME: ${GUPSHUP_APP_NAME ? "SET" : "MISSING"}`
    );
    return { success: false, error: "Gupshup not configured" };
  }

  // Normalise phone: strip non-digits, ensure leading country code
  const phone = normalisePhone(astrologerPhone);
  if (!phone) {
    return { success: false, error: "Invalid phone number" };
  }

  try {
    // Template payload — no params since template body is static
    const template = JSON.stringify({
      id: TEMPLATE_ID,
      params: [],
    });

    const params = new URLSearchParams({
      source: GUPSHUP_SOURCE_NUMBER,
      destination: phone,
      "src.name": GUPSHUP_APP_NAME,
      template,
    });

    console.log("[Gupshup] Sending template notification:", {
      source: GUPSHUP_SOURCE_NUMBER,
      destination: phone,
      appName: GUPSHUP_APP_NAME,
      templateId: TEMPLATE_ID,
      apiKeyPreview: GUPSHUP_API_KEY?.slice(0, 8) + "...",
    });

    const response = await fetch(GUPSHUP_TEMPLATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        apikey: GUPSHUP_API_KEY,
      },
      body: params.toString(),
    });

    const rawText = await response.text();
    console.log(`[Gupshup] HTTP ${response.status} — Raw response: ${rawText}`);

    let data: any = {};
    try { data = JSON.parse(rawText); } catch { data = { rawText }; }

    if (!response.ok || data?.status === "error") {
      console.error("[Gupshup] Template notification failed:", data);
      return { success: false, error: data?.message ?? data?.details ?? rawText ?? "Unknown error" };
    }

    console.log(`[Gupshup] Template notification sent to ${phone} for session ${sessionId}`);
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
