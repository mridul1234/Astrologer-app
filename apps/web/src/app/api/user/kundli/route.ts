import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { auth } from "@/auth";

// GET /api/user/kundli — returns the current user's KundliProfile (null if not set)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.kundliProfile.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(profile ?? null);
}

// POST /api/user/kundli — creates or updates the kundli profile
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { fullName, dateOfBirth, timeOfBirth, placeOfBirth } = body;

  if (!fullName || !dateOfBirth || !placeOfBirth) {
    return NextResponse.json(
      { error: "fullName, dateOfBirth, and placeOfBirth are required" },
      { status: 400 }
    );
  }

  // Geocode the city using Nominatim (free, no API key)
  let latitude: number | null = null;
  let longitude: number | null = null;
  let timezone: number | null = null;

  try {
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeOfBirth)}&format=json&limit=1`,
      { headers: { "Accept-Language": "en", "User-Agent": "AstroWalla/1.0" } }
    );
    const geo = await geoRes.json();
    if (geo?.[0]) {
      latitude = parseFloat(geo[0].lat);
      longitude = parseFloat(geo[0].lon);
      timezone = Math.round((longitude / 15) * 2) / 2; // nearest 0.5h
    }
  } catch {
    // geocoding failed — proceed without lat/lon
  }

  // Update user's name if not set properly
  const nameToSave = fullName.trim();

  const [profile] = await Promise.all([
    prisma.kundliProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        fullName: nameToSave,
        dateOfBirth,
        timeOfBirth: timeOfBirth || "12:00",
        placeOfBirth,
        latitude,
        longitude,
        timezone,
      },
      update: {
        fullName: nameToSave,
        dateOfBirth,
        timeOfBirth: timeOfBirth || "12:00",
        placeOfBirth,
        latitude,
        longitude,
        timezone,
      },
    }),
    // Also update the user's display name
    prisma.user.update({
      where: { id: session.user.id },
      data: { name: nameToSave },
    }),
  ]);

  return NextResponse.json(profile);
}
