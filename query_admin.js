const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { email: true, name: true }
  });
  console.log("Admins found:", admins);
}
main().catch(console.error).finally(() => prisma.$disconnect());
