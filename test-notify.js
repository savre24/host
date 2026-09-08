const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
  console.log('Admins found:', admins);
  
  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map(a => ({
        userId: a.id,
        title: 'Test',
        message: 'Test message',
      }))
    });
    console.log('Created notifications');
  }
}
test().finally(() => prisma.$disconnect());
