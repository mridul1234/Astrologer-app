import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { auth } from "@/auth";

export type MobileUser = { id: string; role: string };

const mobileSecret = () => process.env.MOBILE_AUTH_SECRET || process.env.NEXTAUTH_SECRET!;

export function createMobileAccessToken(user: MobileUser) {
  return jwt.sign({ userId: user.id, role: user.role, audience: "mobile" }, mobileSecret(), { expiresIn: "30d" });
}

export async function getRequestUser(req: NextRequest): Promise<MobileUser | null> {
  const authorization = req.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(authorization.slice(7), mobileSecret()) as { userId: string; role?: string; audience?: string };
      if (payload.audience === "mobile" && payload.userId) return { id: payload.userId, role: payload.role || "USER" };
    } catch {
      return null;
    }
  }

  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id, role: (session.user as { role?: string }).role || "USER" };
}
