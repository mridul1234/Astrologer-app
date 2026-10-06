import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { getRequestUser } from "@/lib/mobile-auth";
import { getSafetySession } from "@/lib/chat-safety";

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId, messageId, reason, details } = await req.json();
  const reasons = ["Harassment", "Sexual content", "Violence or threats", "Scam or payment request", "Other"];
  if (typeof sessionId !== "string" || !reasons.includes(reason) || typeof details !== "string" || details.length > 1000 || (messageId !== undefined && typeof messageId !== "string")) {
    return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  }
  const context = await getSafetySession(sessionId, user.id);
  if (!context) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const message = messageId ? await prisma.message.findFirst({ where: { id: messageId, sessionId, senderId: context.targetId } }) : null;
  if (messageId && !message) return NextResponse.json({ error: "Message unavailable. Report the conversation instead." }, { status: 400 });
  const count = await prisma.contentReport.count({ where: { reporterId: user.id, createdAt: { gte: new Date(Date.now() - 3600000) } } });
  if (count >= 10) return NextResponse.json({ error: "Too many reports. Try again later." }, { status: 429 });
  const report = await prisma.contentReport.create({ data: {
    reporterId: user.id, targetId: context.targetId, sessionId, messageId: message?.id,
    content: message?.content, reason, details: details.trim(),
  } });
  return NextResponse.json({ success: true, reportId: report.id }, { status: 201 });
}
