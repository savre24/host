const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const clients = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
        OR: [
          { name: { contains: 'sath', mode: 'insensitive' } },
          { email: { contains: 'sath', mode: 'insensitive' } },
          { clientProfile: { companyName: { contains: 'sath', mode: 'insensitive' } } },
        ]
      }
    });
    console.log("Clients success:", clients.length);
  } catch (e) {
    console.error("Clients error:", e.message);
  }

  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        OR: [
          { invoiceNumber: { contains: 'sath', mode: 'insensitive' } },
          { client: { companyName: { contains: 'sath', mode: 'insensitive' } } },
          { client: { user: { name: { contains: 'sath', mode: 'insensitive' } } } },
        ]
      }
    });
    console.log("Invoices success:", invoices.length);
  } catch (e) {
    console.error("Invoices error:", e.message);
  }
}

main().finally(() => prisma.$disconnect());
