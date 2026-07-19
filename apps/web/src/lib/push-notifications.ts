import { prisma } from "@astrology/db";

type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export function isExpoPushToken(token: string) {
  return /^ExponentPushToken\[[^\]]+\]$/.test(token) || /^ExpoPushToken\[[^\]]+\]$/.test(token);
}

async function sendExpoPushMessages(messages: Array<PushPayload & { to: string }>) {
  const validMessages = messages.filter((message) => isExpoPushToken(message.to));
  if (validMessages.length === 0) return { sent: 0, failed: messages.length };

  let sent = 0;
  let failed = 0;

  for (let index = 0; index < validMessages.length; index += 100) {
    const chunk = validMessages.slice(index, index + 100);
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk.map((message) => ({
          to: message.to,
          title: message.title,
          body: message.body,
          data: message.data || {},
          sound: "default",
          priority: "high",
        }))),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        failed += chunk.length;
        console.error("Expo push send failed:", response.status, result);
      } else {
        sent += chunk.length;
      }
    } catch (error) {
      failed += chunk.length;
      console.error("Expo push send error:", error);
    }
  }

  return { sent, failed: failed + (messages.length - validMessages.length) };
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  const uniqueUserIds = [...new Set(userIds)].filter(Boolean);
  if (uniqueUserIds.length === 0) return { sent: 0, failed: 0 };

  const tokens = await prisma.pushToken.findMany({
    where: { userId: { in: uniqueUserIds }, enabled: true },
    select: { token: true },
  });

  return sendExpoPushMessages(tokens.map((item) => ({ to: item.token, ...payload })));
}

export async function sendPushToAudience(audience: "USERS" | "ASTROLOGERS" | "ALL", payload: PushPayload) {
  const where =
    audience === "USERS"
      ? { enabled: true, appType: "USER" as const }
      : audience === "ASTROLOGERS"
        ? { enabled: true, appType: "ASTROLOGER" as const }
        : { enabled: true };

  const tokens = await prisma.pushToken.findMany({
    where,
    select: { token: true },
  });

  return sendExpoPushMessages(tokens.map((item) => ({ to: item.token, ...payload })));
}
