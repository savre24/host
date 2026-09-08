const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@clientportal.com' },
    update: {},
    create: {
      email: 'admin@clientportal.com',
      name: 'Super Admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('Admin user created:', admin.email);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
