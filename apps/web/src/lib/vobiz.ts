const VOBIZ_API_BASE = "https://api.vobiz.ai/api";

export type VobizCallResult = {
  success: boolean;
  requestUuid?: string;
  error?: string;
};

export function normalizeIndianPhoneNumber(value: unknown): string | null {
  if (value === undefined || value === null) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  const compact = raw.replace(/[\s().-]/g, "");
  if (/^\+91[6-9]\d{9}$/.test(compact)) return compact;
  if (/^91[6-9]\d{9}$/.test(compact)) return `+${compact}`;
  if (/^[6-9]\d{9}$/.test(compact)) return `+91${compact}`;

  throw new Error("Invalid phone number. Enter a valid 10 digit Indian mobile number.");
}

export async function sendChatRequestCall({
  phoneNumber,
  sessionId,
}: {
  phoneNumber: string;
  sessionId: string;
}): Promise<VobizCallResult> {
  const authId = process.env.VOBIZ_AUTH_ID;
  const authToken = process.env.VOBIZ_AUTH_TOKEN;
  const fromNumber = process.env.VOBIZ_FROM_NUMBER;
  const publicBaseUrl = getPublicBaseUrl();

  if (!authId || !authToken || !fromNumber || !publicBaseUrl) {
    const missing = [
      !authId ? "VOBIZ_AUTH_ID" : null,
      !authToken ? "VOBIZ_AUTH_TOKEN" : null,
      !fromNumber ? "VOBIZ_FROM_NUMBER" : null,
      !publicBaseUrl ? "NEXTAUTH_URL" : null,
    ].filter(Boolean);
    const error = `Missing Vobiz config: ${missing.join(", ")}`;
    console.warn(`[Vobiz] ${error}`);
    return { success: false, error };
  }

  const toNumber = normalizeIndianPhoneNumber(phoneNumber);
  if (!toNumber) return { success: false, error: "Astrologer phone number is empty" };

  const answerUrl = `${publicBaseUrl}/api/vobiz/chat-alert/answer?sessionId=${encodeURIComponent(sessionId)}`;
  const hangupUrl = `${publicBaseUrl}/api/vobiz/chat-alert/hangup?sessionId=${encodeURIComponent(sessionId)}`;

  try {
    const res = await fetch(`${VOBIZ_API_BASE}/v1/Account/${encodeURIComponent(authId)}/Call/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-ID": authId,
        "X-Auth-Token": authToken,
      },
      body: JSON.stringify({
        from: fromNumber,
        to: toNumber,
        answer_url: answerUrl,
        answer_method: "POST",
        hangup_url: hangupUrl,
        hangup_method: "POST",
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = data?.message || data?.error || `HTTP ${res.status}`;
      console.error("[Vobiz] Call request failed:", data);
      return { success: false, error };
    }

    const requestUuid = data?.request_uuid || data?.call_uuid;
    console.log(`[Vobiz] Chat alert call fired for session ${sessionId}: ${requestUuid ?? "no request UUID"}`);
    return { success: true, requestUuid };
  } catch (err) {
    console.error("[Vobiz] Call request error:", err);
    return { success: false, error: String(err) };
  }
}

export function getAlertMessage(): string {
  return (
    process.env.VOBIZ_ALERT_MESSAGE?.trim() ||
    "You have received a chat request. Please go to dashboard and join it."
  );
}

function getPublicBaseUrl(): string | null {
  const value = process.env.NEXTAUTH_URL?.trim();
  if (!value) return null;
  return value.replace(/\/+$/, "");
}
