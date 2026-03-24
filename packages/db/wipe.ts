import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.message.deleteMany({});
  await prisma.chatSession.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.astrologer.deleteMany({});
  const result = await prisma.user.deleteMany({
    where: {
      role: {
        not: "ADMIN"
      }
    }
  });
  console.log(`Successfully deleted \${result.count} regular users and astrologers. Keeping ADMIN users.`);
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
