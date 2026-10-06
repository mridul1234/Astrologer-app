import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { auth } from "@/auth";
import { notifySafetyEnd } from "@/lib/chat-safety";

export async function GET() {
  const user = (await auth())?.user;
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await prisma.contentReport.findMany({ take: 100, orderBy: { createdAt: "desc" },
    include: { reporter: { select: { name: true } }, target: { select: { name: true } } } }));
}

export async function PATCH(req: NextRequest) {
  const user = (await auth())?.user;
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, status, adminNote, action } = await req.json();
  if (typeof id !== "string" || !["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"].includes(status) || typeof adminNote !== "string" || adminNote.length > 2000) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }
  if (["RESOLVED", "DISMISSED"].includes(status) && !adminNote.trim()) return NextResponse.json({ error: "Record the review findings before closing a report" }, { status: 400 });
  if (action !== undefined && !["REMOVE_MESSAGE", "BLOCK_PAIR"].includes(action)) return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  const report = await prisma.contentReport.findUnique({ where: { id } });
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  if (action && !adminNote.trim()) return NextResponse.json({ error: "Enter the reason for the moderation action" }, { status: 400 });
  if (action === "REMOVE_MESSAGE") {
    if (!report.messageId) return NextResponse.json({ error: "This report does not reference a message" }, { status: 400 });
    await prisma.message.updateMany({ where: { id: report.messageId, sessionId: report.sessionId }, data: { content: "[Message removed by support]" } });
  }
  if (action === "BLOCK_PAIR") {
    const ended = await prisma.$transaction(async tx => {
      await tx.userBlock.upsert({ where: { blockerId_blockedId: { blockerId: report.reporterId, blockedId: report.targetId } }, create: { blockerId: report.reporterId, blockedId: report.targetId }, update: {} });
      const sessions = await tx.chatSession.findMany({ where: { status: "ACTIVE", OR: [
        { userId: report.reporterId, astrologer: { userId: report.targetId } },
        { userId: report.targetId, astrologer: { userId: report.reporterId } },
      ] }, select: { id: true } });
      await tx.chatSession.updateMany({ where: { id: { in: sessions.map(session => session.id) } }, data: { status: "ENDED", endedAt: new Date() } });
      return sessions.map(session => session.id);
    });
    await notifySafetyEnd(ended);
  }
  await prisma.contentReport.update({ where: { id }, data: { status, adminNote: adminNote.trim(), reviewedBy: user.id, reviewedAt: new Date() } });
  return NextResponse.json({ success: true });
}
