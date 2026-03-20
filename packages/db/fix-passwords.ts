import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function fixPasswords() {
  const hashedPassword = await bcrypt.hash("password123", 10);
  
  await prisma.user.updateMany({
    where: {
      email: { in: ["testuser@example.com", "astro@example.com"] }
    },
    data: {
      password: hashedPassword
    }
  });

  console.log("Passwords fixed! Test users can now log in.");
}

fixPasswords()
  .catch((err) => {
    console.error("error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
