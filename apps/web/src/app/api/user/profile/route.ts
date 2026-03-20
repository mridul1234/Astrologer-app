import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { auth } from "@/auth";

// GET /api/user/profile
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      walletBalance: true,
      createdAt: true,
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          amount: true,
          type: true,
          reason: true,
          createdAt: true,
        },
      },
      chatSessions: {
        orderBy: { startedAt: "desc" },
        take: 10,
        include: {
          astrologer: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}

// PATCH /api/user/profile
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, avataremoji } = body;

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name?.trim() ? { name: name.trim() } : {}),
    },
    select: { id: true, name: true, email: true, walletBalance: true },
  });

  return NextResponse.json(updated);
}
