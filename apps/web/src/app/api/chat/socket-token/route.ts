import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/mobile-auth";
import jwt from "jsonwebtoken";

// GET /api/chat/socket-token  — returns a signed JWT for socket auth (for astrologers)
export async function GET(req: NextRequest) {
  const session = await getRequestUser(req);
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = jwt.sign(
    { userId: session.id },
    process.env.SOCKET_SECRET!,
    { expiresIn: "24h" }
  );

  return NextResponse.json({ token });
}
