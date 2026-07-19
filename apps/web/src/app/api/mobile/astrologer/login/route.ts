import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import bcrypt from "bcryptjs";
import { createMobileAccessToken } from "@/lib/mobile-auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
      include: { astrologerProfile: true },
    });

    if (!user || user.role !== "ASTROLOGER" || !user.astrologerProfile) {
      return NextResponse.json({ error: "Invalid astrologer credentials." }, { status: 401 });
    }

    const isValid = await bcrypt.compare(String(password), user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid astrologer credentials." }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      accessToken: createMobileAccessToken({ id: user.id, role: user.role }),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Astrologer mobile login error:", error);
    return NextResponse.json({ error: "Could not sign in. Please try again." }, { status: 500 });
  }
}
