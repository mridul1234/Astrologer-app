import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { getRequestUser } from "@/lib/mobile-auth";

const SIGNS = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
] as const;

type Sign = (typeof SIGNS)[number];

type Horoscope = {
  sign: Sign;
  displayName: string;
  symbol: string;
  date: string;
  horoscope: string;
};

const SYMBOLS: Record<Sign, string> = {
  aries: "♈",
  taurus: "♉",
  gemini: "♊",
  cancer: "♋",
  leo: "♌",
  virgo: "♍",
  libra: "♎",
  scorpio: "♏",
  sagittarius: "♐",
  capricorn: "♑",
  aquarius: "♒",
  pisces: "♓",
};

const cache = globalThis as typeof globalThis & {
  astrowallaHoroscopeCache?: { dateKey: string; data: Horoscope[] };
};

function todayInIndia() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function displayName(sign: Sign) {
  return sign.charAt(0).toUpperCase() + sign.slice(1);
}

function getSunSign(dateOfBirth?: string | null): Sign {
  if (!dateOfBirth) return "aries";
  const [, monthRaw, dayRaw] = dateOfBirth.split("-").map(Number);
  const month = monthRaw || 1;
  const day = dayRaw || 1;

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "aquarius";
  return "pisces";
}

async function fetchDailyHoroscopes(dateKey: string) {
  if (cache.astrowallaHoroscopeCache?.dateKey === dateKey) {
    return cache.astrowallaHoroscopeCache.data;
  }

  const results = await Promise.all(
    SIGNS.map(async (sign) => {
      const response = await fetch(`https://freehoroscopeapi.com/api/v1/get-horoscope/daily?sign=${sign}`, {
        next: { revalidate: 60 * 60 * 6 },
      });
      if (!response.ok) throw new Error(`Horoscope fetch failed for ${sign}`);
      const body = await response.json();
      return {
        sign,
        displayName: displayName(sign),
        symbol: SYMBOLS[sign],
        date: body?.data?.date || dateKey,
        horoscope: body?.data?.horoscope || "Your daily guidance is being prepared. Please check back soon.",
      };
    }),
  );

  cache.astrowallaHoroscopeCache = { dateKey, data: results };
  return results;
}

export async function GET(req: NextRequest) {
  const identity = await getRequestUser(req);
  if (!identity?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: identity.id },
    select: { kundliProfile: { select: { dateOfBirth: true } } },
  });

  const dateKey = todayInIndia();
  const userSign = getSunSign(user?.kundliProfile?.dateOfBirth);
  const horoscopes = await fetchDailyHoroscopes(dateKey);
  const primary = horoscopes.find((item) => item.sign === userSign) || horoscopes[0];

  return NextResponse.json({
    date: dateKey,
    userSign,
    primary,
    horoscopes,
    source: "freehoroscopeapi.com",
  });
}
