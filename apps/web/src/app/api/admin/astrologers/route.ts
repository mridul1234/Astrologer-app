import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await auth();

  // ONLY ADMINS CAN CREATE ASTROLOGERS
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  try {
    const { name, email, password, bio, speciality, ratePerMin } = await req.json();

    if (!name || !email || !password || !ratePerMin) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if email already in use
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);

    const astrologer = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: "ASTROLOGER",
        astrologerProfile: {
          create: {
            bio: bio || "A guiding light.",
            speciality: speciality || "Vedic Astrology",
            ratePerMin: Number(ratePerMin),
            isOnline: false, // Default to offline until they log in themselves
          },
        },
      },
      include: {
        astrologerProfile: true, // Return profile info
      },
    });

    // Strip password before returning
    const { password: _, ...safeUser } = astrologer;

    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("Failed to create astrologer:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
