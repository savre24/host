import { PrismaClient } from '@prisma/client';
import { Cashfree, CFEnvironment } from 'cashfree-pg';

const prisma = new PrismaClient();

async function test() {
  try {
    const invoice = await prisma.invoice.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { client: { include: { user: true } } }
    });
    
    if (!invoice) return console.log('No invoice found');
    console.log(`Found invoice: ${invoice.id} with total ${invoice.total}`);

    const gatewaySetting = await prisma.paymentGatewaySetting.findFirst({
      where: { provider: 'CASHFREE', isActive: true }
    });

    Cashfree.XClientId = gatewaySetting.appId;
    Cashfree.XClientSecret = gatewaySetting.secretKey;
    Cashfree.XEnvironment = gatewaySetting.environment === 'PRODUCTION' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;

    const orderId = `order_${invoice.id.replace(/-/g, '').substring(0, 8)}_${Date.now()}`;
    const formattedAmount = parseFloat(Number(invoice.total).toFixed(2));

    const request = {
      order_amount: formattedAmount,
      order_currency: 'INR',
      order_id: orderId,
      customer_details: {
        customer_id: invoice.clientId.replace(/-/g, '').substring(0, 20),
        customer_name: invoice.client.user?.name || invoice.client.companyName || 'Client',
        customer_email: invoice.client.user?.email || 'no-email@example.com',
        customer_phone: invoice.client.phone ? (invoice.client.phone.replace(/\D/g, '').length >= 10 ? invoice.client.phone.replace(/\D/g, '').slice(-10) : '9999999999') : '9999999999',
      },
      order_meta: {
        return_url: `http://localhost:3000/client/payments/verify?order_id={order_id}&invoice_id=${invoice.id}`,
      },
      order_tags: {
        invoice_id: invoice.id
      }
    };
    
    console.log("Request payload:", JSON.stringify(request, null, 2));

    const cashfreeInstance = new Cashfree();
    const response = await cashfreeInstance.PGCreateOrder("2023-08-01", request);
    console.log("Success!");
  } catch (error) {
    const errorDetails = error?.response?.data || error?.message || error;
    console.error('Error:', JSON.stringify(errorDetails, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}
test();
