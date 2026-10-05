import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "@astrology/db";

const PREFIX = "play-review:";

function config() {
  const phone = process.env.PLAY_REVIEW_PHONE;
  const code = process.env.PLAY_REVIEW_CODE;
  const secret = process.env.MOBILE_AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!phone || !/^000\d{7}$/.test(phone) || !code || !/^\d{4}$/.test(code) || !secret) return null;
  return { phone, code, secret };
}

export function isPlayReviewPhone(phone: unknown) {
  const settings = config();
  return !!settings && phone === settings.phone;
}

export function createPlayReviewChallenge(phone: string) {
  const settings = config();
  if (!settings || phone !== settings.phone) throw new Error("Review access unavailable");
  return PREFIX + jwt.sign({ phone, purpose: "play-review-login" }, settings.secret, {
    expiresIn: "10m", jwtid: randomBytes(16).toString("hex"), algorithm: "HS256",
  });
}

export async function verifyPlayReviewChallenge(phone: string, challenge: unknown, code: unknown, client: unknown) {
  const settings = config();
  if (!settings || phone !== settings.phone || client !== "mobile" || typeof challenge !== "string" || !challenge.startsWith(PREFIX)) return false;
  try {
    const payload = jwt.verify(challenge.slice(PREFIX.length), settings.secret, { algorithms: ["HS256"] }) as jwt.JwtPayload;
    if (payload.phone !== phone || payload.purpose !== "play-review-login") return false;
  } catch { return false; }

  // One persistent budget across instances and challenges prevents guessing the short mobile PIN.
  const key = `play-review-attempts:${phone}`;
  const hour = Math.floor(Date.now() / 3_600_000);
  await prisma.systemSetting.upsert({ where: { key }, create: { key, value: `${hour}:0` }, update: {} });
  let reserved = false;
  for (let retry = 0; retry < 8; retry++) {
    const row = await prisma.systemSetting.findUniqueOrThrow({ where: { key } });
    const [savedHour, savedCount] = row.value.split(":").map(Number);
    const count = savedHour === hour ? savedCount : 0;
    if (!Number.isFinite(count) || count >= 10) return false;
    const updated = await prisma.systemSetting.updateMany({
      where: { key, value: row.value }, data: { value: `${hour}:${count + 1}` },
    });
    if (updated.count === 1) { reserved = true; break; }
  }
  if (!reserved || typeof code !== "string" || !/^\d{4}$/.test(code)) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(code), digest(settings.code));
}

export async function getPlayReviewUser(phone: string) {
  if (!isPlayReviewPhone(phone)) throw new Error("Review access unavailable");
  const email = `${phone}@astrowalla.com`;
  const password = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email }, update: {},
      create: { email, name: "Google Play Reviewer", password, role: "USER" },
    });
    if (user.role !== "USER") throw new Error("Reviewer account must be a seeker");
    const grantKey = `play-review-credit:${phone}`;
    const grant = await tx.systemSetting.upsert({ where: { key: grantKey }, create: { key: grantKey, value: "pending" }, update: {} });
    if (grant.value === "pending") {
      const claimed = await tx.systemSetting.updateMany({ where: { key: grantKey, value: "pending" }, data: { value: "granted" } });
      if (claimed.count === 1) {
        await tx.user.update({ where: { id: user.id }, data: {
          walletBalance: { increment: 1000 }, introOfferUsed: true, freeMinutesLeft: 3,
        } });
        await tx.transaction.create({ data: { userId: user.id, amount: 1000, type: "CREDIT", reason: "Google Play review promotional credit", referenceId: grantKey } });
      }
    }
    return tx.user.findUniqueOrThrow({ where: { id: user.id } });
  });
}
