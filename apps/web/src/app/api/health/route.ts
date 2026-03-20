import { NextResponse } from "next/server";
import { prisma } from "@astrology/db";

export async function GET() {
  try {
    // 1. Check DB Connection using simple Postgres query
    await prisma.$queryRaw`SELECT 1`;

    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      status: "healthy",
      database: "connected",
      environment: process.env.NODE_ENV,
      metrics: {
        total_users: userCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Health check failed:", error);
    return NextResponse.json({
      status: "unhealthy",
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
