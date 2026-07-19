import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { getRequestUser } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
  const identity = await getRequestUser(req);
  if (!identity?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: identity.id },
    select: { id: true, name: true, walletBalance: true, freeMinutesLeft: true, introOfferUsed: true, kundliProfile: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const identity = await getRequestUser(req);
  if (!identity?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: identity.id },
    data: { name: name.trim() },
    select: { id: true, name: true, walletBalance: true, freeMinutesLeft: true, introOfferUsed: true, kundliProfile: true },
  });

  return NextResponse.json(user);
}
