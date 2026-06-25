import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { getRequestUser } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
  const identity = await getRequestUser(req);
  if (!identity?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const transactions = await prisma.transaction.findMany({
    where: { userId: identity.id },
    orderBy: { createdAt: "desc" },
    take: 80,
    select: {
      id: true,
      amount: true,
      type: true,
      reason: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ transactions });
}
