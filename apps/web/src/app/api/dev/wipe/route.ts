import { NextResponse } from "next/server";
import { prisma } from "@astrology/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== "nuke_everything") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const messages = await prisma.message.deleteMany({});
    const sessions = await prisma.chatSession.deleteMany({});
    const transactions = await prisma.transaction.deleteMany({});
    const astrologers = await prisma.astrologer.deleteMany({});
    const users = await prisma.user.deleteMany({
      where: {
        role: {
          not: "ADMIN"
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "DB NUKE COMPLETE 🚀",
      deleted: {
        messages: messages.count,
        sessions: sessions.count,
        transactions: transactions.count,
        astrologers: astrologers.count,
        users: users.count
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
