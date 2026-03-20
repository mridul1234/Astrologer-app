import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const userRole = role === "ASTROLOGER" ? "ASTROLOGER" : "USER";

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: userRole,
        walletBalance: 0,
        ...(userRole === "ASTROLOGER" && {
          astrologerProfile: {
            create: {
              bio: "",
              speciality: "Vedic Astrology",
              ratePerMin: 10,
              isOnline: false,
            },
          },
        }),
      },
    });

    return NextResponse.json(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      { status: 201 }
    );
  } catch (err) {
    console.error("[signup]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
