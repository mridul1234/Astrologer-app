import { prisma } from "@astrology/db";

export async function getSafetySession(sessionId: string, userId: string) {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId }, include: { astrologer: { select: { userId: true } } },
  });
  if (!session || (session.userId !== userId && session.astrologer.userId !== userId)) return null;
  return { session, targetId: session.userId === userId ? session.astrologer.userId : session.userId };
}

export async function notifySafetyEnd(sessionIds: string[]) {
  const base = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (!base || !process.env.SOCKET_SECRET) return;
  for (const sessionId of sessionIds) {
    await fetch(`${base.replace(/\/$/, "")}/internal/session-ended`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.SOCKET_SECRET}` },
      body: JSON.stringify({ sessionId }), signal: AbortSignal.timeout(5000),
    }).catch(() => console.error("Safety end notification failed; database session already ended"));
  }
}
