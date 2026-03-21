import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@astrology/db";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "OTP",
      credentials: {
        phone: { label: "Phone", type: "text" },
        role: { label: "Role", type: "text" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone) return null;
        
        const phone = credentials.phone as string;
        const email = `${phone}@cosmic.chat`; // Translate phone to an internal email
        
        let user = await prisma.user.findUnique({
          where: { email },
        });

        // 🛠️ DEV MODE MOCK API: Auto-create user inside the NextAuth session so tests work flawlessly
        if (!user) {
          const role = (credentials.role as any) || "USER";
          const name = (credentials.name as string) || `Seeker ${phone.slice(-4)}`;
          const hashed = await bcrypt.hash("dummy_otp_pass", 10);
          
          user = await prisma.user.create({
            data: {
              name,
              email,
              password: hashed,
              role,
              walletBalance: role === "USER" ? 500 : 0, // Give them ₹500 automatically to test chat!
              ...(role === "ASTROLOGER" && {
                astrologerProfile: {
                  create: {
                    bio: "A mystical child of the Cosmos here to guide you.",
                    speciality: "Vedic, Tarot, Vastu",
                    ratePerMin: 15,
                    isOnline: true,
                  },
                },
              }),
            },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
