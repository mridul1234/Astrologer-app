import { NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (existingAdmin) {
      return NextResponse.json({ message: "Admin already exists", email: existingAdmin.email });
    }

    const hashed = await bcrypt.hash("masteradmin123", 10);
    
    const admin = await prisma.user.create({
      data: {
        name: "Supreme Commander",
        email: "admin@astrowalla.com",
        password: hashed,
        role: "ADMIN",
        walletBalance: 0,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Master Admin created!",
      credentials: {
        email: "admin@astrowalla.com",
        password: "masteradmin123"
      }
    });
  } catch (error) {
    console.error("Failed to seed admin:", error);
    return NextResponse.json({ error: "Failed to seed admin" }, { status: 500 });
  }
}
