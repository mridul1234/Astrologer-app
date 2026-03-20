import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import jwt from "jsonwebtoken";

// GET /api/chat/socket-token  — returns a signed JWT for socket auth (for astrologers)
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = jwt.sign(
    { userId: session.user.id },
    process.env.SOCKET_SECRET!,
    { expiresIn: "24h" }
  );

  return NextResponse.json({ token });
}
