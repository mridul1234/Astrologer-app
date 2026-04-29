import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@astrology/db";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await auth();

  // ONLY ADMINS CAN CREATE ASTROLOGERS
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  try {
    const { name, email, password, bio, speciality, categories, ratePerMin, experienceYears, languages, profileImage } = await req.json();

    if (!name || !email || !password || !ratePerMin) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if email already in use
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);

    const astrologer = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: "ASTROLOGER",
        astrologerProfile: {
          create: {
            bio: bio || "A guiding light.",
            speciality: speciality || "Vedic Astrology",
            categories: categories || [],
            ratePerMin: Number(ratePerMin),
            experienceYears: experienceYears ? Number(experienceYears) : 0,
            languages: languages || "Hindi, English",
            profileImage: profileImage || null,
            isOnline: false, // Default to offline until they log in themselves
          },
        },
      },
      include: {
        astrologerProfile: true, // Return profile info
      },
    });

    // Strip password before returning
    const { password: _, ...safeUser } = astrologer;

    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("Failed to create astrologer:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const astrologers = await prisma.user.findMany({
      where: { role: "ASTROLOGER" },
      include: { astrologerProfile: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ astrologers });
  } catch (error) {
    console.error("Failed to fetch astrologers:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id, ratePerMin, speciality, bio, fakeOrders } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const updated = await prisma.astrologer.update({
      where: { userId: id },
      data: {
        ...(ratePerMin && { ratePerMin: Number(ratePerMin) }),
        ...(speciality && { speciality }),
        ...(bio && { bio }),
        ...(fakeOrders !== undefined && { fakeOrders: { increment: Number(fakeOrders) } }),
      },
    });
    return NextResponse.json({ success: true, profile: updated });
  } catch (error) {
    console.error("Failed to update astrologer:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    // Verify the user exists and is an astrologer
    const astrologer = await prisma.astrologer.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!astrologer) {
      return NextResponse.json({ error: "Astrologer not found" }, { status: 404 });
    }

    const astrologerId = astrologer.id;

    // Fetch all chat session IDs for this astrologer
    const chatSessions = await prisma.chatSession.findMany({
      where: { astrologerId },
      select: { id: true },
    });
    const sessionIds = chatSessions.map((s) => s.id);

    // 1. Delete Messages tied to those sessions
    if (sessionIds.length > 0) {
      await prisma.message.deleteMany({ where: { sessionId: { in: sessionIds } } });
    }

    // 2. Delete Reviews tied to those sessions or to the astrologer directly
    await prisma.review.deleteMany({
      where: {
        OR: [
          { astrologerId },
          ...(sessionIds.length > 0 ? [{ sessionId: { in: sessionIds } }] : []),
        ],
      },
    });

    // 3. Delete ChatSessions for this astrologer
    await prisma.chatSession.deleteMany({ where: { astrologerId } });

    // 4. Delete WithdrawalRequests for this astrologer
    await prisma.withdrawalRequest.deleteMany({ where: { astrologerId } });

    // 5. Delete Transactions tied to the user
    await prisma.transaction.deleteMany({ where: { userId } });

    // 6. Delete the User (cascades to AstrologerProfile & KundliProfile via onDelete: Cascade)
    await prisma.user.delete({ where: { id: userId, role: "ASTROLOGER" } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete astrologer:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}