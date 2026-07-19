import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { getRequestUser } from "@/lib/mobile-auth";

export async function POST(req: NextRequest) {
  const identity = await getRequestUser(req);
  if (!identity?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { fullName, dateOfBirth, timeOfBirth, placeOfBirth } = await req.json();
  if (!fullName?.trim() || !dateOfBirth || !placeOfBirth?.trim()) {
    return NextResponse.json({ error: "Name, date of birth, and birthplace are required." }, { status: 400 });
  }
  const [profile] = await prisma.$transaction([
    prisma.kundliProfile.upsert({
      where: { userId: identity.id },
      create: { userId: identity.id, fullName: fullName.trim(), dateOfBirth, timeOfBirth: timeOfBirth || "12:00", placeOfBirth: placeOfBirth.trim() },
      update: { fullName: fullName.trim(), dateOfBirth, timeOfBirth: timeOfBirth || "12:00", placeOfBirth: placeOfBirth.trim() },
    }),
    prisma.user.update({ where: { id: identity.id }, data: { name: fullName.trim() } }),
  ]);
  return NextResponse.json(profile);
}
