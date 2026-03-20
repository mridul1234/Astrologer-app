import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function clearData() {
  console.log("Cleaning database...");

  // 1. Delete dependent records first (Messages)
  const messages = await prisma.message.deleteMany({});
  console.log(`Deleted ${messages.count} messages.`);

  // 2. Delete Chat Sessions
  const sessions = await prisma.chatSession.deleteMany({});
  console.log(`Deleted ${sessions.count} chat sessions.`);

  // 3. Delete Transactions
  const transactions = await prisma.transaction.deleteMany({});
  console.log(`Deleted ${transactions.count} transactions.`);

  // 4. Delete non-test Astrologers
  const astrologers = await prisma.astrologer.deleteMany({
    where: {
      user: {
        email: {
          notIn: ["testuser@example.com", "astro@example.com"]
        }
      }
    }
  });
  console.log(`Deleted ${astrologers.count} redundant astrologer profiles.`);

  // 5. Delete non-test Users
  const users = await prisma.user.deleteMany({
    where: {
      email: {
        notIn: ["testuser@example.com", "astro@example.com"]
      }
    }
  });
  console.log(`Deleted ${users.count} redundant user accounts.`);

  // 6. Reset Test User Balances
  await prisma.user.update({
    where: { email: "testuser@example.com" },
    data: { walletBalance: 1000 }
  });
  console.log("Reset testuser wallet balance to 1000.");

  console.log("Database cleanup complete!");
}

clearData()
  .catch((e) => {
    console.error("Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
