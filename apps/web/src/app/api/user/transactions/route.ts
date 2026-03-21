import { NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rawTx = await prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }, // descending to keep the newest block key first
    });

    const aggregatedMap = rawTx.reduce((acc, t) => {
      // Group recurring live chat minute transactions perfectly into 1 block
      if (t.reason?.startsWith("Chat - session") || t.reason?.startsWith("Chat Earnings - session")) {
        const key = `${t.type}_${t.reason}`;
        if (!acc[key]) {
          acc[key] = { ...t };
        } else {
          acc[key].amount += t.amount;
          // Maintain the original starting date or ending date (currently uses latest since sorted desc before entering map)
        }
      } else {
        acc[t.id] = t;
      }
      return acc;
    }, {} as Record<string, any>);

    const aggregatedArray = Object.values(aggregatedMap).sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ transactions: aggregatedArray });
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
