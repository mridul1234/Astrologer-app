import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { getRequestUser } from "@/lib/mobile-auth";
import { getSafetySession, notifySafetyEnd } from "@/lib/chat-safety";

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocks = await prisma.userBlock.findMany({ where: { blockerId: user.id },
    include: { blocked: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(blocks);
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await req.json();
  if (typeof sessionId !== "string") return NextResponse.json({ error: "Session required" }, { status: 400 });
  const context = await getSafetySession(sessionId, user.id);
  if (!context) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { session, targetId } = context;
  const ended = await prisma.$transaction(async tx => {
    await tx.userBlock.upsert({ where: { blockerId_blockedId: { blockerId: user.id, blockedId: targetId } },
      create: { blockerId: user.id, blockedId: targetId }, update: {} });
    const active = await tx.chatSession.findMany({ where: { userId: session.userId, astrologerId: session.astrologerId, status: "ACTIVE" }, select: { id: true } });
    await tx.chatSession.updateMany({ where: { id: { in: active.map(row => row.id) }, status: "ACTIVE" }, data: { status: "ENDED", endedAt: new Date() } });
    return active.map(row => row.id);
  });
  await notifySafetyEnd(ended);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { blockedId } = await req.json();
  if (typeof blockedId !== "string") return NextResponse.json({ error: "Blocked user required" }, { status: 400 });
  await prisma.userBlock.deleteMany({ where: { blockerId: user.id, blockedId } });
  return NextResponse.json({ success: true });
}
