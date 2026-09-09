import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Cashfree, CFEnvironment } from 'cashfree-pg';

export async function POST(req) {
  try {
    const { orderId, invoiceId } = await req.json();

    if (!orderId || !invoiceId) {
      return NextResponse.json({ error: 'Order ID and Invoice ID are required' }, { status: 400 });
    }

    // 1. Fetch Cashfree Settings
    const gatewaySetting = await prisma.paymentGatewaySetting.findFirst({
      where: { provider: 'CASHFREE', isActive: true }
    });

    if (!gatewaySetting || !gatewaySetting.appId || !gatewaySetting.secretKey) {
      return NextResponse.json({ error: 'Payment gateway is not configured or active' }, { status: 500 });
    }

    // 2. Configure Cashfree SDK
    const cashfreeEnvironment = gatewaySetting.environment === 'PRODUCTION' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
    const cashfree = new Cashfree(cashfreeEnvironment, gatewaySetting.appId, gatewaySetting.secretKey);
    cashfree.XApiVersion = "2023-08-01"; // Explicitly set for compatibility

    // 3. Verify Payment Status with Cashfree API
    const response = await cashfree.PGOrderFetchPayments(orderId);
    
    if (response && response.data && response.data.length > 0) {
      const payments = response.data;
      
      // Look for a successful payment
      const successfulPayment = payments.find(p => p.payment_status === 'SUCCESS');

      if (successfulPayment) {
        // 4. Update Database
        await prisma.$transaction(async (tx) => {
          // Check if invoice exists and is not already paid
          const invoice = await tx.invoice.findUnique({
            where: { id: invoiceId }
          });

          if (invoice && invoice.status !== 'PAID') {
            // Update Invoice Status
            await tx.invoice.update({
              where: { id: invoiceId },
              data: { status: 'PAID' }
            });

            // If it's a renewal invoice, update the Renewal Status
            await tx.renewal.updateMany({
              where: { invoiceId: invoiceId },
              data: { status: 'PAID' }
            });
            
            // Create a Payment Record
            await tx.payment.create({
              data: {
                invoiceId: invoice.id,
                clientId: invoice.clientId,
                amount: invoice.total,
                paymentMethod: 'Cashfree',
                paymentReference: orderId,
                status: 'COMPLETED'
              }
            });

            // Log the activity
            await tx.activityLog.create({
              data: {
                userId: invoice.clientId,
                action: 'PAYMENT_SUCCESS',
                details: `Invoice ${invoice.invoiceNumber} paid via Cashfree (Order ID: ${orderId})`
              }
            });
          }
        });

        return NextResponse.json({ success: true, status: 'PAID' });
      } else {
        // Payment is not successful
        const latestPayment = payments[payments.length - 1];
        return NextResponse.json({ 
          success: false, 
          status: latestPayment.payment_status,
          message: latestPayment.payment_message || 'Payment was not successful'
        });
      }
    } else {
      return NextResponse.json({ error: 'No payments found for this order' }, { status: 404 });
    }

  } catch (error) {
    console.error('Cashfree Verification Error:', error?.response?.data || error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}
