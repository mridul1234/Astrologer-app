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
      name: "Standard Login",
      credentials: {
        phone: { label: "Phone (For Users)", type: "text" },
        email: { label: "Email (For Staff)", type: "email" },
        password: { label: "Password (For Staff)", type: "password" },
        role: { label: "Role", type: "text" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        // --- 1. ADMIN & ASTROLOGER LOGIN (Email + Password) ---
        if (credentials?.email && credentials?.password) {
          const email = credentials.email as string;
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) return null;
          
          const isValid = await bcrypt.compare(credentials.password as string, user.password);
          if (!isValid) return null;

          // Prevent generic users from using this portal if we want, but letting them is fine
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        }

        // --- 2. USER LOGIN (Mock OTP via Phone) ---
        if (credentials?.phone) {
          const phone = credentials.phone as string;
          const email = `${phone}@cosmic.chat`; // Translate phone to an internal email
          
          let user = await prisma.user.findUnique({
            where: { email },
          });

          // Auto-create USER on first OTP login
          if (!user) {
            const name = (credentials.name as string) || `Seeker ${phone.slice(-4)}`;
            const hashed = await bcrypt.hash("dummy_otp_pass", 10);
            
            user = await prisma.user.create({
              data: {
                name,
                email,
                password: hashed,
                role: "USER",
                walletBalance: 500, // Free ₹500
              },
            });
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        }

        return null; // Both failed
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
